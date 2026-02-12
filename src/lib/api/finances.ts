import { apiRequest } from "@/lib/api/client";

export async function listFinanceCategories() {
  return apiRequest("/finances/categories");
}
