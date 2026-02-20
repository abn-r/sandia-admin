"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActionErrorMessage } from "@/lib/api/action-error";
import {
  broadcastNotification,
  deleteFcmToken,
  registerFcmToken,
  sendNotification,
  sendNotificationToClub,
  type FcmDeviceType,
  type NotificationClubInstanceType,
} from "@/lib/api/notifications";

export type NotificationActionState = {
  error?: string;
  success?: string;
};

function readString(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

function parseOptionalJson(value: string, label: string) {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("JSON invalido");
    }

    return parsed as Record<string, unknown>;
  } catch {
    throw new Error(`El campo ${label} debe ser un JSON valido`);
  }
}

function parseInstanceType(rawValue: string) {
  const value = rawValue.trim().toLowerCase();
  if (value === "adv" || value === "adventurers") {
    return "adventurers" as NotificationClubInstanceType;
  }

  if (value === "mg" || value === "master_guilds") {
    return "master_guilds" as NotificationClubInstanceType;
  }

  if (value === "pathf" || value === "pathfinders") {
    return "pathfinders" as NotificationClubInstanceType;
  }

  throw new Error("Tipo de instancia invalido. Usa adv, pathf o mg");
}

function parseDeviceType(value: string) {
  if (!value) {
    return undefined;
  }

  if (value === "ios" || value === "android" || value === "web") {
    return value as FcmDeviceType;
  }

  throw new Error("Tipo de dispositivo invalido");
}

export async function registerFcmTokenAction(
  _: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  const token = readString(formData, "token");
  if (!token) {
    return { error: "El token FCM es obligatorio" };
  }

  try {
    const deviceType = parseDeviceType(readString(formData, "device_type"));
    await registerFcmToken({
      token,
      device_type: deviceType,
      device_name: readString(formData, "device_name") || undefined,
    });
  } catch (error) {
    return {
      error: getActionErrorMessage(error, "No se pudo registrar el token FCM", {
        endpointLabel: "/fcm-tokens",
      }),
    };
  }

  revalidatePath("/dashboard/notifications");
  return { success: "Token FCM registrado correctamente" };
}

export async function sendDirectNotificationAction(
  _: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  const userId = readString(formData, "user_id");
  const title = readString(formData, "title");
  const body = readString(formData, "body");

  if (!userId) {
    return { error: "El user_id es obligatorio" };
  }

  if (!title || !body) {
    return { error: "El titulo y el mensaje son obligatorios" };
  }

  try {
    await sendNotification({
      userId,
      title,
      body,
      data: parseOptionalJson(readString(formData, "data_json"), "Data JSON"),
    });
  } catch (error) {
    return {
      error: getActionErrorMessage(error, "No se pudo enviar la notificacion directa", {
        endpointLabel: "/notifications/send",
      }),
    };
  }

  return { success: "Notificacion enviada al usuario" };
}

export async function broadcastNotificationAction(
  _: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  const title = readString(formData, "title");
  const body = readString(formData, "body");

  if (!title || !body) {
    return { error: "El titulo y el mensaje son obligatorios" };
  }

  try {
    await broadcastNotification({
      title,
      body,
      data: parseOptionalJson(readString(formData, "data_json"), "Data JSON"),
    });
  } catch (error) {
    return {
      error: getActionErrorMessage(error, "No se pudo enviar el broadcast", {
        endpointLabel: "/notifications/broadcast",
      }),
    };
  }

  return { success: "Broadcast enviado correctamente" };
}

export async function sendClubNotificationAction(
  _: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  const instanceTypeRaw = readString(formData, "instance_type");
  const instanceIdRaw = readString(formData, "instance_id");
  const title = readString(formData, "title");
  const body = readString(formData, "body");

  if (!instanceTypeRaw || !instanceIdRaw) {
    return { error: "El tipo e ID de instancia son obligatorios" };
  }

  if (!title || !body) {
    return { error: "El titulo y el mensaje son obligatorios" };
  }

  const instanceId = Number(instanceIdRaw);
  if (!Number.isFinite(instanceId) || instanceId <= 0) {
    return { error: "El instance_id debe ser un numero mayor a cero" };
  }

  try {
    await sendNotificationToClub({
      instanceType: parseInstanceType(instanceTypeRaw),
      instanceId,
      title,
      body,
      data: parseOptionalJson(readString(formData, "data_json"), "Data JSON"),
    });
  } catch (error) {
    return {
      error: getActionErrorMessage(error, "No se pudo enviar la notificacion al club", {
        endpointLabel: "/notifications/club/:instanceType/:instanceId",
      }),
    };
  }

  return { success: "Notificacion enviada al club" };
}

export async function deleteFcmTokenAction(formData: FormData) {
  const token = readString(formData, "token");
  if (!token) {
    return;
  }

  await deleteFcmToken(token);
  revalidatePath("/dashboard/notifications");
  redirect("/dashboard/notifications");
}
