import { apiRequest } from "@/lib/api/client";

export async function listCamporees() {
  return apiRequest("/admin/camporees");
}
