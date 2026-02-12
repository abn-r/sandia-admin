import { apiRequest } from "@/lib/api/client";

export type Honor = {
  honor_id: number;
  name: string;
  category_id: number;
  active: boolean;
};

export async function listHonors() {
  return apiRequest<{ data: Honor[] }>("/honors");
}
