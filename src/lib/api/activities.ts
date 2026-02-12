import { apiRequest } from "@/lib/api/client";

export async function listClubActivities(clubId: number) {
  return apiRequest(`/clubs/${clubId}/activities`);
}
