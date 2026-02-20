"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createActivity,
  deleteActivity,
  recordActivityAttendance,
  updateActivity,
  type ActivityPayload,
} from "@/lib/api/activities";

export type ActivityActionState = {
  error?: string;
  success?: string;
};

type ActivityInstanceType = "adventurers" | "pathfinders" | "master_guilds";

function readString(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

function parseRequiredNumber(formData: FormData, fieldName: string, label: string) {
  const value = readString(formData, fieldName);
  if (!value) {
    throw new Error(`El campo ${label} es obligatorio`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`El campo ${label} no es valido`);
  }

  return parsed;
}

function parseOptionalNumber(formData: FormData, fieldName: string) {
  const value = readString(formData, fieldName);
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`El campo ${fieldName} no es valido`);
  }

  return parsed;
}

function parseOptionalInstanceType(formData: FormData, fieldName: string) {
  const value = readString(formData, fieldName);
  if (!value) {
    return undefined;
  }

  if (value === "adventurers" || value === "pathfinders" || value === "master_guilds") {
    return value;
  }

  throw new Error("El tipo de instancia no es valido");
}

function mapInstanceField(
  instanceType: ActivityInstanceType,
): "club_adv_id" | "club_pathf_id" | "club_mg_id" {
  if (instanceType === "adventurers") {
    return "club_adv_id";
  }

  if (instanceType === "master_guilds") {
    return "club_mg_id";
  }

  return "club_pathf_id";
}

function attachInstancePayload(
  payload: ActivityPayload | Partial<ActivityPayload>,
  instanceType: ActivityInstanceType,
  instanceId: number,
) {
  payload.instance_type = instanceType;
  payload.instance_id = instanceId;
  payload[mapInstanceField(instanceType)] = instanceId;
}

function buildCreatePayload(formData: FormData) {
  const name = readString(formData, "name");
  if (!name) {
    throw new Error("El nombre es obligatorio");
  }

  const activityDate = readString(formData, "activity_date");
  const endDate = readString(formData, "end_date");
  if (!activityDate || !endDate) {
    throw new Error("Las fechas de actividad y fin son obligatorias");
  }

  const activityType = readString(formData, "activity_type");
  if (!activityType) {
    throw new Error("El tipo de actividad es obligatorio");
  }

  const instanceType = parseOptionalInstanceType(formData, "instance_type");
  if (!instanceType) {
    throw new Error("El tipo de instancia es obligatorio");
  }

  const instanceId = parseRequiredNumber(formData, "instance_id", "Instancia");
  const payload: ActivityPayload = {
    name,
    title: name,
    description: readString(formData, "description") || undefined,
    activity_type: activityType,
    activity_date: activityDate,
    start_date: activityDate,
    end_date: endDate,
    location: readString(formData, "location") || undefined,
  };

  attachInstancePayload(payload, instanceType, instanceId);

  return payload;
}

function buildUpdatePayload(formData: FormData) {
  const payload: Partial<ActivityPayload> = {};

  const name = readString(formData, "name");
  const description = readString(formData, "description");
  const activityDate = readString(formData, "activity_date");
  const endDate = readString(formData, "end_date");
  const location = readString(formData, "location");

  if (name) {
    payload.name = name;
    payload.title = name;
  }

  if (description) {
    payload.description = description;
  }

  if (activityDate) {
    payload.activity_date = activityDate;
    payload.start_date = activityDate;
  }

  if (endDate) {
    payload.end_date = endDate;
  }

  if (location) {
    payload.location = location;
  }

  const activityType = readString(formData, "activity_type");
  const instanceId = parseOptionalNumber(formData, "instance_id");
  const instanceType = parseOptionalInstanceType(formData, "instance_type");

  if (activityType) {
    payload.activity_type = activityType;
  }

  if (instanceId !== undefined && instanceType) {
    attachInstancePayload(payload, instanceType, instanceId);
  }

  if (formData.has("active")) {
    payload.active = formData.get("active") === "on" || formData.get("active") === "true";
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("No hay cambios para guardar");
  }

  return payload;
}

export async function createActivityAction(
  clubId: number,
  _: ActivityActionState,
  formData: FormData,
): Promise<ActivityActionState> {
  try {
    const payload = buildCreatePayload(formData);
    await createActivity(clubId, payload);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo crear la actividad",
    };
  }

  revalidatePath("/dashboard/activities");
  redirect("/dashboard/activities");
}

export async function updateActivityAction(
  activityId: number,
  _: ActivityActionState,
  formData: FormData,
): Promise<ActivityActionState> {
  try {
    const payload = buildUpdatePayload(formData);
    await updateActivity(activityId, payload);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo actualizar la actividad",
    };
  }

  revalidatePath("/dashboard/activities");
  redirect("/dashboard/activities");
}

export async function deleteActivityAction(formData: FormData) {
  const activityId = Number(formData.get("id"));
  if (!Number.isFinite(activityId) || activityId <= 0) {
    return;
  }

  await deleteActivity(activityId);
  revalidatePath("/dashboard/activities");
  redirect("/dashboard/activities");
}

function parseAttendanceUserIds(rawValue: string) {
  return rawValue
    .split(/[\s,;]+/g)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export async function recordActivityAttendanceAction(
  activityId: number,
  _: ActivityActionState,
  formData: FormData,
): Promise<ActivityActionState> {
  const attendeesRaw = readString(formData, "user_ids");
  const userIds = parseAttendanceUserIds(attendeesRaw);

  if (userIds.length === 0) {
    return { error: "Debes capturar al menos un ID de usuario para registrar asistencia." };
  }

  try {
    await recordActivityAttendance(activityId, { user_ids: userIds });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo registrar la asistencia",
    };
  }

  revalidatePath(`/dashboard/activities/${activityId}`);
  return { success: "Asistencia registrada correctamente" };
}
