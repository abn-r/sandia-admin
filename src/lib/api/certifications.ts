import { apiRequest } from "@/lib/api/client";

export async function listCertifications() {
  return apiRequest("/admin/certifications");
}
