import { apiRequest } from "@/lib/api/client";

export type Honor = {
  honor_id: number;
  name: string;
  title?: string;
  description?: string | null;
  requirements_count?: number;
  patch_image?: string | null;
  category_id?: number;
  honors_category_id?: number;
  club_type_id?: number;
  skill_level?: number;
  active: boolean;
};

export type HonorCategory = {
  honor_category_id?: number;
  category_id?: number;
  name: string;
  description?: string | null;
  honors_count?: number;
  active?: boolean;
};

export type HonorListQuery = {
  categoryId?: number;
  clubTypeId?: number;
  skillLevel?: number;
  page?: number;
  limit?: number;
};

export async function listHonors(query: HonorListQuery = {}) {
  return apiRequest<{ data: Honor[] }>("/honors", { params: query });
}

export async function getHonorById(honorId: number) {
  return apiRequest<Honor>(`/honors/${honorId}`);
}

export async function listHonorCategories() {
  return apiRequest<HonorCategory[]>("/honors/categories");
}
