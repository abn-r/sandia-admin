import { AlertTriangle, CheckCircle2, Gauge, Medal, Timer, Trophy } from "lucide-react";
import { getScoringReadiness, type ScoringEndpointState } from "@/lib/api/scoring";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getBadgeVariant(state: ScoringEndpointState) {
  if (state === "available") {
    return "success";
  }

  if (state === "missing") {
    return "warning";
  }

  if (state === "pending-contract") {
    return "secondary";
  }

  return "outline";
}

function getStateLabel(state: ScoringEndpointState) {
  if (state === "available") {
    return "Disponible";
  }

  if (state === "missing") {
    return "No disponible";
  }

  if (state === "pending-contract") {
    return "Sin contrato";
  }

  return "Pendiente datos";
}

function getCamporeeName(
  item: {
    name?: string;
    camporee_id?: number;
    local_camporee_id?: number;
    id?: number;
  },
  index: number,
) {
  if (item.name && item.name.trim().length > 0) {
    return item.name.trim();
  }

  const id = item.camporee_id ?? item.local_camporee_id ?? item.id ?? index + 1;
  return `Camporee #${id}`;
}

function getActivityName(
  item: {
    title?: string;
    name?: string;
    activity_id?: number;
    id?: number;
  },
  index: number,
) {
  if (item.title && item.title.trim().length > 0) {
    return item.title.trim();
  }

  if (item.name && item.name.trim().length > 0) {
    return item.name.trim();
  }

  const id = item.activity_id ?? item.id ?? index + 1;
  return `Actividad #${id}`;
}

export default async function ScoringPage() {
  const readiness = await getScoringReadiness();
  const enabledEndpoints = readiness.endpoints.filter((item) => item.state === "available").length;
  const checkedAt = new Date(readiness.checkedAt).toLocaleString("es-MX");

  const rankingRows =
    readiness.camporees.length > 0
      ? readiness.camporees.slice(0, 6).map((camporee, index) => ({
          position: index + 1,
          label: getCamporeeName(camporee, index),
          status: "Sin resultados",
        }))
      : readiness.activities.slice(0, 6).map((activity, index) => ({
          position: index + 1,
          label: getActivityName(activity, index),
          status: "Sin resultados",
        }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Trophy}
        title="Puntuacion en vivo"
        description="Readiness de fuentes para scoring mientras se publica el contrato oficial de leaderboard."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Camporees detectados</p>
            <p className="mt-1 text-2xl font-bold">{readiness.camporees.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Fuente: `/api/v1/camporees`</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Clubes detectados</p>
            <p className="mt-1 text-2xl font-bold">{readiness.clubs.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {readiness.selectedClubId ? `Club de muestra: ${readiness.selectedClubId}` : "Sin club de muestra"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Actividades muestreadas</p>
            <p className="mt-1 text-2xl font-bold">{readiness.activities.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Fuente: `/api/v1/clubs/:clubId/activities`</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Endpoints validados</p>
            <p className="mt-1 text-2xl font-bold">
              {enabledEndpoints}/{readiness.endpoints.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Revision: {checkedAt}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-4 w-4" />
              Matriz de readiness de endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readiness.endpoints.map((endpoint) => (
                    <TableRow key={endpoint.key}>
                      <TableCell className="font-medium">{endpoint.label}</TableCell>
                      <TableCell className="font-mono text-xs">{endpoint.endpoint}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(endpoint.state)}>{getStateLabel(endpoint.state)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{endpoint.detail}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Brecha de contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Badge variant={readiness.contractPublished ? "success" : "warning"}>
              {readiness.contractPublished ? "Contrato publicado" : "Contrato pendiente"}
            </Badge>
            <p className="text-muted-foreground">{readiness.contractNote}</p>
            <p className="text-muted-foreground">1. Publicar endpoint de lectura de leaderboard.</p>
            <p className="text-muted-foreground">2. Publicar endpoint para registrar resultados y penalizaciones.</p>
            <p className="text-muted-foreground">3. Versionar payload de desempates y reglas por evento.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Medal className="h-4 w-4" />
            Preview de tabla de posiciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rankingRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay camporees ni actividades disponibles para construir un preview de posiciones.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Puntos</TableHead>
                    <TableHead>Penalizaciones</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankingRows.map((row) => (
                    <TableRow key={`${row.position}-${row.label}`}>
                      <TableCell className="font-semibold">{row.position}</TableCell>
                      <TableCell>{row.label}</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="inline-flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            Estructura UI lista para conectar al contrato oficial de scoring cuando sea publicado.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
