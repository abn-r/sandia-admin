import { apiRequest } from "@/lib/api/client";

export type FcmDeviceType = "ios" | "android" | "web";

export type FcmToken = {
  fcm_token_id?: string;
  user_id?: string;
  token: string;
  device_type?: FcmDeviceType;
  device_name?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export type DirectNotificationPayload = NotificationPayload & {
  userId: string;
};

export type NotificationClubInstanceType =
  | "adventurers"
  | "pathfinders"
  | "master_guilds"
  | "adv"
  | "pathf"
  | "mg";

export type ClubNotificationPayload = NotificationPayload & {
  instanceType: NotificationClubInstanceType;
  instanceId: number;
};

function normalizeInstanceType(
  instanceType: NotificationClubInstanceType,
): "adventurers" | "pathfinders" | "master_guilds" {
  if (instanceType === "adv" || instanceType === "adventurers") {
    return "adventurers";
  }

  if (instanceType === "pathf" || instanceType === "pathfinders") {
    return "pathfinders";
  }

  return "master_guilds";
}

export async function registerFcmToken(payload: {
  token: string;
  device_type?: FcmDeviceType;
  device_name?: string;
}) {
  return apiRequest("/fcm-tokens", {
    method: "POST",
    body: payload,
  });
}

export async function listFcmTokens() {
  return apiRequest("/fcm-tokens");
}

export async function listFcmTokensByUser(userId: string) {
  return apiRequest(`/fcm-tokens/user/${userId}`);
}

export async function deleteFcmToken(token: string) {
  return apiRequest(`/fcm-tokens/${encodeURIComponent(token)}`, {
    method: "DELETE",
  });
}

export async function sendNotification(payload: DirectNotificationPayload) {
  return apiRequest("/notifications/send", {
    method: "POST",
    body: payload,
  });
}

export async function broadcastNotification(payload: NotificationPayload) {
  return apiRequest("/notifications/broadcast", {
    method: "POST",
    body: payload,
  });
}

export async function sendNotificationToClub(payload: ClubNotificationPayload) {
  const normalizedType = normalizeInstanceType(payload.instanceType);

  return apiRequest(`/notifications/club/${normalizedType}/${payload.instanceId}`, {
    method: "POST",
    body: {
      title: payload.title,
      body: payload.body,
      data: payload.data,
    },
  });
}
