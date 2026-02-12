import { apiRequest } from "@/lib/api/client";

export type ClassItem = {
  class_id: number;
  name: string;
  club_type_id: number;
  display_order: number;
  active: boolean;
};

export async function listClasses() {
  return apiRequest<{ data: ClassItem[] }>("/classes");
}
