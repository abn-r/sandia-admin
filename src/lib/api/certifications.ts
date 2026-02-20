import { apiRequest } from "@/lib/api/client";

export type Certification = {
  certification_id?: number;
  id?: number;
  name: string;
  description?: string | null;
  duration_hours?: number;
  modules_count?: number;
  active?: boolean;
};

export type CertificationQuery = {
  page?: number;
  limit?: number;
};

export async function listCertifications(query: CertificationQuery = {}) {
  return apiRequest<{ data: Certification[] }>("/certifications", { params: query });
}

export async function getCertificationById(certificationId: number) {
  return apiRequest<Certification>(`/certifications/${certificationId}`);
}
