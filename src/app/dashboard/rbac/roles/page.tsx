import {
  ShieldCheck,
  Globe,
  Building2,
  Star,
  HeadphonesIcon,
  Plus,
  MoreHorizontal,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

/* ─── Datos estáticos de roles ─── */
type RoleCard = {
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  usersCount: number;
  hasGradientBar?: boolean;
};

const roles: RoleCard[] = [
  {
    name: "Super Admin",
    description:
      "Acceso completo a todas las configuraciones del sistema, gestión de usuarios, registros financieros y logs de auditoría. Puede administrar todos los demás roles.",
    icon: ShieldCheck,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    usersCount: 4,
    hasGradientBar: true,
  },
  {
    name: "Director de Unión",
    description:
      "Supervisa múltiples conferencias. Puede generar reportes agregados, ver estadísticas regionales y aprobar eventos a nivel de conferencia.",
    icon: Globe,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    usersCount: 12,
  },
  {
    name: "Admin de Conferencia",
    description:
      "Administra clubes dentro de un territorio de conferencia específico. Autoridad de aprobación para la creación de clubes y eventos importantes.",
    icon: Building2,
    iconColor: "text-teal-500",
    iconBg: "bg-teal-500/10",
    usersCount: 34,
  },
  {
    name: "Director de Club",
    description:
      "Administra un club local específico. Puede agregar miembros, programar eventos, registrar asistencia y gestionar el inventario del club.",
    icon: Star,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    usersCount: 145,
  },
  {
    name: "Consejero",
    description:
      "Acceso restringido a los miembros de la unidad asignada. Puede registrar asistencia, progreso de insignias y ver registros de salud de su unidad.",
    icon: HeadphonesIcon,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
    usersCount: 800,
  },
];

function formatUserCount(count: number): string {
  if (count >= 800) return "800+";
  return new Intl.NumberFormat("es-MX").format(count);
}

/* ─── Página de Roles ─── */
export default function RolesPage() {
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageHeader
          title="Roles del sistema"
          description="Administra niveles de acceso y capacidades de control para el sistema. Define quién puede ver y editar datos."
        />
        <button
          type="button"
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/50 active:scale-95"
        >
          <Plus size={16} />
          Crear nuevo rol
        </button>
      </div>

      {/* Grid de roles */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <div
              key={role.name}
              className="group relative flex flex-col rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_20px_-5px_rgba(43,43,238,0.3)]"
            >
              {/* Barra de gradiente (Super Admin) */}
              {role.hasGradientBar && (
                <div className="absolute left-0 top-0 h-1 w-full rounded-t-xl bg-gradient-to-r from-primary to-purple-600 opacity-80" />
              )}

              {/* Encabezado de la tarjeta */}
              <div className="mb-4 flex items-start justify-between">
                <div className={`inline-flex rounded-lg p-2.5 ${role.iconBg}`}>
                  <Icon size={24} className={role.iconColor} />
                </div>
                <button
                  type="button"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Nombre y descripción */}
              <h3 className="mb-2 text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
                {role.name}
              </h3>
              <p className="mb-6 flex-grow text-sm text-muted-foreground">
                {role.description}
              </p>

              {/* Usuarios asignados */}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground ring-2 ring-card">
                  {formatUserCount(role.usersCount)}
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {formatUserCount(role.usersCount)} usuarios asignados
                </span>
              </div>

              {/* Botones de acción */}
              <div className="mt-auto grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="rounded-lg bg-muted px-4 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Editar rol
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-transparent bg-primary/10 px-4 py-2 text-center text-sm font-medium text-primary transition-colors hover:border-primary/30 hover:bg-primary/20"
                >
                  Permisos
                </button>
              </div>
            </div>
          );
        })}

        {/* Tarjeta para crear rol personalizado */}
        <div className="group flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/40 p-6 transition-all hover:border-primary/50 hover:bg-primary/5">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/20">
            <Plus size={28} className="text-muted-foreground group-hover:text-primary" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">
            Crear rol personalizado
          </h3>
          <p className="max-w-[200px] text-center text-sm text-muted-foreground">
            Define un nuevo rol con permisos específicos adaptados a tus necesidades.
          </p>
        </div>
      </div>

      {/* Footer con conteo */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">
          Mostrando <span className="font-medium text-foreground">{roles.length}</span> roles definidos
        </p>
      </div>
    </div>
  );
}
