import { listActivityAttendance, listClubActivities, type Activity } from "@/lib/api/activities";
import { ApiError } from "@/lib/api/client";
import { listCamporees, type Camporee } from "@/lib/api/camporees";
import { listClubs, type Club } from "@/lib/api/clubs";
import { unwrapList } from "@/lib/api/response";

export type ScoringEndpointKey =
  | "camporees"
  | "clubs"
  | "activities"
  | "activity-attendance"
  | "scoring-read"
  | "scoring-write";

export type ScoringEndpointState = "available" | "missing" | "pending-data" | "pending-contract";

export type ScoringEndpointStatus = {
  key: ScoringEndpointKey;
  label: string;
  endpoint: string;
  state: ScoringEndpointState;
  detail: string;
};

export type ScoringReadiness = {
  checkedAt: string;
  contractPublished: boolean;
  contractNote: string;
  camporees: Camporee[];
  clubs: Club[];
  activities: Activity[];
  selectedClubId: number | null;
  endpoints: ScoringEndpointStatus[];
};

type EndpointMap = Record<ScoringEndpointKey, ScoringEndpointStatus>;

const scoringContractNote =
  "No existe contrato oficial de scoring en ../docs/02-API/ENDPOINTS-REFERENCE.md.";

function createEndpointMap(): EndpointMap {
  return {
    camporees: {
      key: "camporees",
      label: "Camporees base",
      endpoint: "GET /api/v1/camporees",
      state: "pending-data",
      detail: "Pendiente de validacion",
    },
    clubs: {
      key: "clubs",
      label: "Clubes base",
      endpoint: "GET /api/v1/clubs",
      state: "pending-data",
      detail: "Pendiente de validacion",
    },
    activities: {
      key: "activities",
      label: "Actividades por club",
      endpoint: "GET /api/v1/clubs/:clubId/activities",
      state: "pending-data",
      detail: "Pendiente de validacion",
    },
    "activity-attendance": {
      key: "activity-attendance",
      label: "Asistencia por actividad",
      endpoint: "GET /api/v1/activities/:activityId/attendance",
      state: "pending-data",
      detail: "Pendiente de validacion",
    },
    "scoring-read": {
      key: "scoring-read",
      label: "Leaderboard scoring",
      endpoint: "GET /api/v1/scoring/leaderboard",
      state: "pending-contract",
      detail: "Sin contrato oficial en docs",
    },
    "scoring-write": {
      key: "scoring-write",
      label: "Registro de puntajes",
      endpoint: "POST /api/v1/scoring/events/:eventId/results",
      state: "pending-contract",
      detail: "Sin contrato oficial en docs",
    },
  };
}

function setEndpointStatus(
  map: EndpointMap,
  key: ScoringEndpointKey,
  state: ScoringEndpointState,
  detail: string,
) {
  map[key] = {
    ...map[key],
    state,
    detail,
  };
}

function isMissingEndpoint(error: unknown) {
  return error instanceof ApiError && [403, 404, 405].includes(error.status);
}

function getActivityId(activity: Activity) {
  if (typeof activity.activity_id === "number" && Number.isFinite(activity.activity_id)) {
    return activity.activity_id;
  }

  const id = (activity as { id?: unknown }).id;
  if (typeof id === "number" && Number.isFinite(id)) {
    return id;
  }

  return null;
}

export async function getScoringReadiness(): Promise<ScoringReadiness> {
  const endpointMap = createEndpointMap();

  let camporees: Camporee[] = [];
  try {
    const response = await listCamporees({ page: 1, limit: 50 });
    camporees = unwrapList<Camporee>(response);
    setEndpointStatus(endpointMap, "camporees", "available", `Disponible (${camporees.length} registros)`);
  } catch (error) {
    if (isMissingEndpoint(error)) {
      setEndpointStatus(endpointMap, "camporees", "missing", "No disponible para este usuario/entorno");
    } else {
      throw error;
    }
  }

  let clubs: Club[] = [];
  try {
    const response = await listClubs({ page: 1, limit: 20 });
    clubs = unwrapList<Club>(response);
    setEndpointStatus(endpointMap, "clubs", "available", `Disponible (${clubs.length} registros)`);
  } catch (error) {
    if (isMissingEndpoint(error)) {
      setEndpointStatus(endpointMap, "clubs", "missing", "No disponible para este usuario/entorno");
      setEndpointStatus(
        endpointMap,
        "activities",
        "missing",
        "No se puede validar sin acceso a /api/v1/clubs",
      );
      setEndpointStatus(
        endpointMap,
        "activity-attendance",
        "missing",
        "No se puede validar sin acceso a actividades",
      );
    } else {
      throw error;
    }
  }

  const selectedClub = clubs.find((club) => club.active) ?? clubs[0] ?? null;
  let activities: Activity[] = [];

  if (selectedClub) {
    try {
      const response = await listClubActivities(selectedClub.club_id, { page: 1, limit: 100 });
      activities = unwrapList<Activity>(response);
      setEndpointStatus(
        endpointMap,
        "activities",
        "available",
        `Disponible (club ${selectedClub.club_id}, ${activities.length} registros)`,
      );
    } catch (error) {
      if (isMissingEndpoint(error)) {
        setEndpointStatus(endpointMap, "activities", "missing", "No disponible para este usuario/entorno");
        setEndpointStatus(
          endpointMap,
          "activity-attendance",
          "missing",
          "No se puede validar sin acceso a actividades",
        );
      } else {
        throw error;
      }
    }
  } else if (endpointMap.activities.state === "pending-data") {
    setEndpointStatus(endpointMap, "activities", "pending-data", "No hay clubes para validar este endpoint");
  }

  if (endpointMap["activity-attendance"].state === "pending-data") {
    const firstActivity = activities.find((activity) => getActivityId(activity) !== null);
    if (!firstActivity) {
      setEndpointStatus(
        endpointMap,
        "activity-attendance",
        "pending-data",
        "No hay actividades para validar asistencias",
      );
    } else {
      const activityId = getActivityId(firstActivity);
      if (activityId === null) {
        setEndpointStatus(
          endpointMap,
          "activity-attendance",
          "pending-data",
          "La actividad no incluye un identificador valido",
        );
      } else {
        try {
          const response = await listActivityAttendance(activityId);
          const attendance = unwrapList<Record<string, unknown>>(response);
          setEndpointStatus(
            endpointMap,
            "activity-attendance",
            "available",
            `Disponible (actividad ${activityId}, ${attendance.length} registros)`,
          );
        } catch (error) {
          if (isMissingEndpoint(error)) {
            setEndpointStatus(
              endpointMap,
              "activity-attendance",
              "missing",
              "No disponible para este usuario/entorno",
            );
          } else {
            throw error;
          }
        }
      }
    }
  }

  const endpoints: ScoringEndpointStatus[] = [
    endpointMap.camporees,
    endpointMap.clubs,
    endpointMap.activities,
    endpointMap["activity-attendance"],
    endpointMap["scoring-read"],
    endpointMap["scoring-write"],
  ];

  return {
    checkedAt: new Date().toISOString(),
    contractPublished: false,
    contractNote: scoringContractNote,
    camporees,
    clubs,
    activities,
    selectedClubId: selectedClub?.club_id ?? null,
    endpoints,
  };
}
