import { apiRequest } from "@/lib/api/client";

export type InventoryCategory = {
  category_id: number;
  name: string;
  description?: string | null;
  active?: boolean;
};

export type InventoryItem = {
  inventory_id: number;
  name: string;
  description?: string | null;
  inventory_category_id?: number | null;
  amount: number;
  club_adv_id?: number | null;
  club_pathf_id?: number | null;
  club_mg_id?: number | null;
  active?: boolean;
};

export type InventoryListQuery = {
  instanceType?: "adv" | "pathf" | "mg";
  includeInactive?: boolean;
};

export type InventoryPayload = {
  name: string;
  description?: string;
  inventory_category_id?: number;
  amount: number;
  club_adv_id?: number;
  club_pathf_id?: number;
  club_mg_id?: number;
  active?: boolean;
};

export async function listInventoryCategories() {
  return apiRequest<InventoryCategory[]>("/catalogs/inventory-categories");
}

export async function listClubInventory(clubId: number, query: InventoryListQuery = {}) {
  return apiRequest<InventoryItem[]>(`/clubs/${clubId}/inventory`, { params: query });
}

export async function getInventoryItemById(inventoryId: number) {
  return apiRequest<InventoryItem>(`/inventory/${inventoryId}`);
}

export async function createInventoryItem(clubId: number, payload: InventoryPayload) {
  return apiRequest(`/clubs/${clubId}/inventory`, {
    method: "POST",
    body: payload,
  });
}

export async function updateInventoryItem(inventoryId: number, payload: Partial<InventoryPayload>) {
  return apiRequest(`/inventory/${inventoryId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteInventoryItem(inventoryId: number) {
  return apiRequest(`/inventory/${inventoryId}`, {
    method: "DELETE",
  });
}
