import { apiRequest } from "@/lib/api/client";

export async function listInventoryCategories() {
  return apiRequest("/admin/inventory/categories");
}
