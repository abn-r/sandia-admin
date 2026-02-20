import { apiRequest } from "@/lib/api/client";

export type Activity = {
  activity_id: number;
  title?: string;
  name?: string;
  description?: string | null;
  activity_type?: number | string;
  activity_date?: string;
  start_date?: string;
  end_date?: string;
  location?: string | null;
  club_adv_id?: number | null;
  club_pathf_id?: number | null;
  club_mg_id?: number | null;
  instance_type?: "adventurers" | "pathfinders" | "master_guilds";
  instance_id?: number;
  club_type_id?: number;
  attendance_count?: number;
  active?: boolean;
};

export type ActivityListQuery = {
  clubTypeId?: number;
  active?: boolean;
  activityType?: number | string;
  page?: number;
  limit?: number;
};

export type ActivityPayload = {
  title?: string;
  name?: string;
  description?: string;
  activity_type: number | string;
  activity_date?: string;
  start_date?: string;
  end_date: string;
  location?: string;
  instance_type?: "adventurers" | "pathfinders" | "master_guilds";
  instance_id?: number;
  club_adv_id?: number;
  club_pathf_id?: number;
  club_mg_id?: number;
  active?: boolean;
};

export type ActivityAttendanceMember = {
  user_id: string;
  name: string;
  picture_url?: string | null;
  attended_at?: string;
};

export type RecordActivityAttendancePayload = {
  user_ids: string[];
};

export async function listClubActivities(clubId: number, query: ActivityListQuery = {}) {
  return apiRequest(`/clubs/${clubId}/activities`, { params: query });
}

export async function getActivityById(activityId: number) {
  return apiRequest(`/activities/${activityId}`);
}

export async function createActivity(clubId: number, payload: ActivityPayload) {
  return apiRequest(`/clubs/${clubId}/activities`, {
    method: "POST",
    body: payload,
  });
}

export async function updateActivity(activityId: number, payload: Partial<ActivityPayload>) {
  return apiRequest(`/activities/${activityId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteActivity(activityId: number) {
  return apiRequest(`/activities/${activityId}`, {
    method: "DELETE",
  });
}

export async function listActivityAttendance(activityId: number) {
  return apiRequest<ActivityAttendanceMember[]>(`/activities/${activityId}/attendance`);
}

export async function recordActivityAttendance(
  activityId: number,
  payload: RecordActivityAttendancePayload,
) {
  return apiRequest(`/activities/${activityId}/attendance`, {
    method: "POST",
    body: payload,
  });
}
