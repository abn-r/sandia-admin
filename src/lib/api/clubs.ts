import { apiRequest } from "@/lib/api/client";

export type Club = {
  club_id: number;
  name: string;
  active: boolean;
  local_field_id: number;
  district_id: number;
  church_id: number;
};

export async function listClubs() {
  return apiRequest<{ data: Club[] }>("/clubs");
}
