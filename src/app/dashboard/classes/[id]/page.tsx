import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, GraduationCap } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  type ClassDetail,
  type ClassSection,
  getClassById,
  listClassModules,
  type ClassModule,
} from "@/lib/api/classes";
import { unwrapList, unwrapObject } from "@/lib/api/response";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getModuleId(module: ClassModule, index: number) {
  if (typeof module.module_id === "number") {
    return module.module_id;
  }

  return index + 1;
}

function getModuleLabel(module: ClassModule, index: number) {
  return module.title || module.name || `Modulo ${index + 1}`;
}

function getSectionLabel(section: ClassSection, index: number) {
  return section.title || section.name || `Seccion ${index + 1}`;
}

function getSectionsCount(module: ClassModule) {
  if (typeof module.sections_count === "number") {
    return module.sections_count;
  }

  if (Array.isArray(module.sections)) {
    return module.sections.length;
  }

  return 0;
}

function mergeModules(modulesFromClassDetail: ClassModule[], modulesFromList: ClassModule[]) {
  const map = new Map<number, ClassModule>();

  for (const classModule of modulesFromClassDetail) {
    if (typeof classModule.module_id === "number") {
      map.set(classModule.module_id, classModule);
    }
  }

  for (const classModule of modulesFromList) {
    if (typeof classModule.module_id !== "number") {
      continue;
    }

    const base = map.get(classModule.module_id);
    map.set(classModule.module_id, {
      ...base,
      ...classModule,
      sections: base?.sections ?? classModule.sections,
    });
  }

  return Array.from(map.values()).sort((left, right) => {
    const leftOrder = typeof left.display_order === "number" ? left.display_order : Number.MAX_SAFE_INTEGER;
    const rightOrder =
      typeof right.display_order === "number" ? right.display_order : Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classId = Number(id);

  if (!Number.isFinite(classId) || classId <= 0) {
    notFound();
  }

  let classItem: ClassDetail | null = null;
  try {
    const classResponse = await getClassById(classId);
    classItem = unwrapObject<ClassDetail>(classResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 429].includes(error.status) || error.status >= 500)
    ) {
      return (
        <div className="space-y-6">
          <PageHeader
            icon={GraduationCap}
            title="Detalle de clase"
            description="No fue posible cargar la informacion de la clase."
            actions={
              <Link href="/dashboard/classes">
                <Button variant="outline">Volver</Button>
              </Link>
            }
          />
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              {error.status === 429
                ? "Rate limit alcanzado al consultar la clase. Reintenta en unos segundos."
                : error.status >= 500
                  ? "Backend no disponible temporalmente para consultar la clase."
                  : "No tienes permisos para consultar esta clase."}
            </CardContent>
          </Card>
        </div>
      );
    }

    throw error;
  }

  if (!classItem || typeof classItem.class_id !== "number") {
    notFound();
  }

  const modulesFromClassDetail = Array.isArray(classItem.modules) ? classItem.modules : [];
  let modulesEndpointAvailable = true;
  let modulesEndpointDetail = "";
  let modulesFromList: ClassModule[] = [];

  try {
    const modulesResponse = await listClassModules(classId);
    modulesFromList = unwrapList<ClassModule>(modulesResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      modulesEndpointAvailable = false;
      if (error.status === 429) {
        modulesEndpointDetail = "Rate limit alcanzado al consultar modulos.";
      } else if (error.status >= 500) {
        modulesEndpointDetail = "Backend no disponible temporalmente para consultar modulos.";
      } else {
        modulesEndpointDetail = "No fue posible consultar modulos para esta clase en este entorno.";
      }
    } else {
      throw error;
    }
  }

  const modules = mergeModules(modulesFromClassDetail, modulesFromList);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GraduationCap}
        title={classItem.name}
        description="Detalle de clase y modulos asociados."
        actions={
          <Link href="/dashboard/classes">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Tipo de club</p>
            <Badge variant="outline" className="mt-1">{classItem.club_type_id}</Badge>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Orden</p>
            <p className="mt-1 font-medium">{classItem.display_order}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs uppercase text-muted-foreground">Estado</p>
            <div className="mt-1">
              <StatusBadge active={classItem.active} />
            </div>
          </div>
          {classItem.description ? (
            <div className="sm:col-span-2">
              <p className="text-xs uppercase text-muted-foreground">Descripcion</p>
              <p className="mt-1 text-muted-foreground">{classItem.description}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {!modulesEndpointAvailable ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">{modulesEndpointDetail}</CardContent>
        </Card>
      ) : null}

      {modules.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Sin modulos"
          description="Esta clase no tiene modulos disponibles para mostrar."
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modulo</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Secciones</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module, index) => (
                  <TableRow key={getModuleId(module, index)}>
                    <TableCell className="font-medium">{getModuleLabel(module, index)}</TableCell>
                    <TableCell className="tabular-nums">{module.display_order ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{getSectionsCount(module)}</TableCell>
                    <TableCell>
                      <StatusBadge active={Boolean(module.active ?? true)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3">
            {modules.map((module, moduleIndex) => (
              <Card key={`sections-${getModuleId(module, moduleIndex)}`}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{getModuleLabel(module, moduleIndex)}</p>
                      <p className="text-xs text-muted-foreground">
                        {getSectionsCount(module)} seccion{getSectionsCount(module) === 1 ? "" : "es"}
                      </p>
                    </div>
                    <StatusBadge active={Boolean(module.active ?? true)} />
                  </div>

                  {Array.isArray(module.sections) && module.sections.length > 0 ? (
                    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                      {module.sections.map((section, sectionIndex) => (
                        <div
                          key={typeof section.section_id === "number" ? section.section_id : sectionIndex}
                          className="flex flex-col gap-0.5 text-sm"
                        >
                          <p className="font-medium">{getSectionLabel(section, sectionIndex)}</p>
                          {section.description ? (
                            <p className="text-xs text-muted-foreground">{section.description}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Este modulo no tiene secciones detalladas publicadas.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
