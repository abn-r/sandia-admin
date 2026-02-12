"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  Award,
  BookOpen,
  Box,
  Boxes,
  CalendarCheck,
  Check,
  GraduationCap,
  KeyRound,
  Loader2,
  Search,
  Settings,
  Shield,
  Trophy,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import type { Permission, Role } from "@/lib/rbac/types";
import { syncRolePermissions } from "@/lib/rbac/service";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

// Orden preferido de acciones para las columnas
const ACTION_ORDER = ["read", "create", "update", "delete", "manage", "assign", "view", "export", "revoke", "read_detail"];

// Etiquetas en español para cabeceras de columna
const ACTION_LABELS: Record<string, string> = {
  read: "Leer",
  create: "Crear",
  update: "Editar",
  delete: "Eliminar",
  manage: "Gestionar",
  assign: "Asignar",
  view: "Ver",
  export: "Exportar",
  revoke: "Revocar",
  read_detail: "Detalle",
  approve: "Aprobar",
  reject: "Rechazar",
};

// Ancho fijo de cada columna de accion (px)
const COL_WIDTH = 84;
// Ancho fijo de la columna de recurso (px)
const RESOURCE_COL = 240;

// Iconos por recurso conocido
const RESOURCE_ICON_MAP: Record<string, LucideIcon> = {
  activities: CalendarCheck,
  users: UserRound,
  roles: Shield,
  permissions: KeyRound,
  clubs: Users,
  classes: GraduationCap,
  honors: Trophy,
  finances: Wallet,
  inventory: Boxes,
  camporees: Award,
  certifications: Activity,
  catalogs: BookOpen,
  system: Settings,
};

// Paleta de colores para iconos de recurso (inline para compatibilidad con Tailwind v4)
const PALETTE = [
  { bg: "#fef2f2", border: "#fecaca", color: "#dc2626" },
  { bg: "#fff7ed", border: "#fed7aa", color: "#ea580c" },
  { bg: "#eff6ff", border: "#bfdbfe", color: "#2563eb" },
  { bg: "#faf5ff", border: "#e9d5ff", color: "#9333ea" },
  { bg: "#ecfdf5", border: "#a7f3d0", color: "#059669" },
  { bg: "#fffbeb", border: "#fde68a", color: "#d97706" },
  { bg: "#ecfeff", border: "#a5f3fc", color: "#0891b2" },
  { bg: "#fdf2f8", border: "#fbcfe8", color: "#db2777" },
  { bg: "#f0fdf4", border: "#bbf7d0", color: "#16a34a" },
  { bg: "#fefce8", border: "#fef08a", color: "#ca8a04" },
];

function extractAction(p: Permission) {
  return p.permission_name.split(":")[1] ?? "";
}

// Agrupar permisos por recurso
function groupByResource(permissions: Permission[]) {
  const groups = new Map<string, Permission[]>();
  for (const p of permissions) {
    const resource = p.permission_name.split(":")[0] ?? "other";
    const existing = groups.get(resource) ?? [];
    existing.push(p);
    groups.set(resource, existing);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

// Extraer acciones unicas y ordenarlas
function extractActions(permissions: Permission[]) {
  const actionSet = new Set<string>();
  for (const p of permissions) {
    actionSet.add(extractAction(p));
  }
  const actions = Array.from(actionSet);
  actions.sort((a, b) => {
    const ia = ACTION_ORDER.indexOf(a);
    const ib = ACTION_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
  return actions;
}

export function RolePermissionsMatrix({
  roles,
  permissions,
}: {
  roles: Role[];
  permissions: Permission[];
}) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.role_id ?? "");
  const [search, setSearch] = useState("");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => {
    const role = roles[0];
    if (!role) return new Set();
    return new Set(role.role_permissions.map((rp) => rp.permissions.permission_id));
  });
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  const activePermissions = useMemo(
    () => permissions.filter((p) => p.active),
    [permissions],
  );

  // Columnas de acciones
  const actionColumns = useMemo(
    () => extractActions(activePermissions),
    [activePermissions],
  );

  // Grupos de recursos filtrados por busqueda
  const filteredGroups = useMemo(() => {
    const groups = groupByResource(activePermissions);
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups
      .map(([resource, perms]) => [
        resource,
        perms.filter(
          (p) =>
            p.permission_name.toLowerCase().includes(q) ||
            (p.description ?? "").toLowerCase().includes(q) ||
            resource.toLowerCase().includes(q),
        ),
      ] as [string, Permission[]])
      .filter(([, perms]) => perms.length > 0);
  }, [activePermissions, search]);

  const selectedRole = useMemo(
    () => roles.find((r) => r.role_id === selectedRoleId),
    [roles, selectedRoleId],
  );

  const handleSelectRole = useCallback(
    (roleId: string) => {
      const role = roles.find((r) => r.role_id === roleId);
      if (!role) return;
      setSelectedRoleId(roleId);
      setCheckedIds(new Set(role.role_permissions.map((rp) => rp.permissions.permission_id)));
      setDirty(false);
      setFeedback(null);
    },
    [roles],
  );

  const handleToggle = useCallback((permissionId: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
    setDirty(true);
    setFeedback(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedRoleId) return;
    startTransition(async () => {
      try {
        await syncRolePermissions(selectedRoleId, Array.from(checkedIds));
        setFeedback({ type: "success", message: "Permisos actualizados correctamente" });
        setDirty(false);
      } catch (error) {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Error al guardar",
        });
      }
    });
  }, [selectedRoleId, checkedIds]);

  const totalAssigned = checkedIds.size;
  const totalAvailable = activePermissions.length;

  return (
    <div
      className="flex overflow-hidden rounded-xl border bg-card shadow-sm"
      style={{ height: "calc(100vh - 12rem)" }}
    >
      {/* ── Panel izquierdo: lista de roles ── */}
      <div className="hidden w-64 shrink-0 flex-col border-r lg:flex">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Jerarquía de roles
          </h2>
        </div>
        <div className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {roles.map((role) => {
            const isActive = role.role_id === selectedRoleId;
            const count = isActive ? checkedIds.size : role.role_permissions.length;

            return (
              <button
                key={role.role_id}
                type="button"
                onClick={() => handleSelectRole(role.role_id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? "border border-primary/20 bg-primary/10 font-bold text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Shield className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                <span className="flex-1 truncate capitalize">
                  {role.role_name.replace(/_/g, " ")}
                </span>
                <span className={`text-xs tabular-nums ${isActive ? "text-primary font-bold" : ""}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Panel central: matriz de permisos ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Cabecera de la matriz */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold">Matriz de Permisos</h1>
            {selectedRole ? (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Configurando permisos para{" "}
                <span className="font-semibold capitalize text-primary">
                  {selectedRole.role_name.replace(/_/g, " ")}
                </span>
                .{" "}
                <span className="tabular-nums font-medium text-foreground">
                  {totalAssigned}/{totalAvailable}
                </span>{" "}
                asignados.
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {/* Selector de rol en móvil */}
            <select
              value={selectedRoleId}
              onChange={(e) => handleSelectRole(e.target.value)}
              className="rounded-lg border bg-card px-3 py-2 text-sm capitalize lg:hidden"
            >
              {roles.map((r) => (
                <option key={r.role_id} value={r.role_id}>
                  {r.role_name.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            {/* Busqueda */}
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar permisos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 pl-9"
              />
            </div>
            {/* Guardar */}
            <Button disabled={!dirty || isPending} onClick={handleSave}>
              {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>

        {/* Feedback */}
        {feedback ? (
          <div
            className={`flex items-center gap-2 border-b px-5 py-2.5 text-sm ${
              feedback.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {feedback.type === "success" ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {feedback.message}
          </div>
        ) : null}

        {/* Cuerpo de la matriz con scroll horizontal */}
        <div className="flex-1 overflow-auto">
          <div
            className="min-w-max"
            style={{ minWidth: `${RESOURCE_COL + actionColumns.length * COL_WIDTH + 48}px` }}
          >
            {/* Cabecera de columnas — sticky */}
            <div className="sticky top-0 z-10 flex items-center border-b bg-card px-6 py-3">
              <div
                className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                style={{ width: `${RESOURCE_COL}px` }}
              >
                Módulo / Recurso
              </div>
              {actionColumns.map((action) => (
                <div
                  key={action}
                  className="shrink-0 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                  style={{ width: `${COL_WIDTH}px` }}
                >
                  {ACTION_LABELS[action] ?? action.replace(/_/g, " ")}
                </div>
              ))}
            </div>

            {/* Filas de recursos */}
            <div className="space-y-2 p-4 px-6">
              {filteredGroups.map(([resource, perms], index) => {
                const palette = PALETTE[index % PALETTE.length];
                const ResourceIcon = RESOURCE_ICON_MAP[resource] ?? Box;

                return (
                  <div
                    key={resource}
                    className="flex items-center rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                  >
                    {/* Info del recurso */}
                    <div
                      className="flex shrink-0 items-center gap-3 pr-4"
                      style={{ width: `${RESOURCE_COL}px` }}
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: palette.bg,
                          borderWidth: "1px",
                          borderStyle: "solid",
                          borderColor: palette.border,
                        }}
                      >
                        <ResourceIcon style={{ color: palette.color }} className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold capitalize leading-tight">
                          {resource.replace(/_/g, " ")}
                        </h3>
                        <span className="text-[10px] text-muted-foreground">
                          {perms.length} {perms.length === 1 ? "permiso" : "permisos"}
                        </span>
                      </div>
                    </div>

                    {/* Checkboxes — columnas de ancho fijo */}
                    {actionColumns.map((action) => {
                      const perm = perms.find((p) => extractAction(p) === action);

                      return (
                        <div
                          key={action}
                          className="flex shrink-0 items-center justify-center"
                          style={{ width: `${COL_WIDTH}px` }}
                        >
                          {perm ? (
                            <Checkbox
                              checked={checkedIds.has(perm.permission_id)}
                              onCheckedChange={() => handleToggle(perm.permission_id)}
                              className="h-5 w-5 cursor-pointer rounded transition-transform hover:scale-110"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground/20">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Estado vacio */}
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Search className="mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  No se encontraron permisos{search ? ` para "${search}"` : ""}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
