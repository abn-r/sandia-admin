import { apiRequest } from "@/lib/api/client";

export type FinanceCategory = {
  category_id: number;
  name: string;
  description?: string | null;
  type?: number;
  active?: boolean;
};

export type Finance = {
  finance_id: number;
  description: string;
  amount: number | string;
  type: number;
  transaction_date: string;
  finance_category_id: number;
  category_id?: number;
  ecclesiastical_year_id?: number | null;
  receipt_number?: string | null;
  notes?: string | null;
  club_adv_id?: number | null;
  club_pathf_id?: number | null;
  club_mg_id?: number | null;
  active?: boolean;
};

export type FinanceCategoryQuery = {
  type?: 0 | 1;
};

export type FinanceListQuery = {
  year?: number;
  month?: number;
  clubTypeId?: number;
  categoryId?: number;
  includeInactive?: boolean;
};

export type FinanceSummaryQuery = {
  year?: number;
  month?: number;
  clubTypeId?: number;
};

export type FinancePayload = {
  description: string;
  amount: number;
  type: 0 | 1;
  transaction_date: string;
  finance_category_id: number;
  ecclesiastical_year_id?: number;
  receipt_number?: string;
  notes?: string;
  club_adv_id?: number;
  club_pathf_id?: number;
  club_mg_id?: number;
  active?: boolean;
};

export type FinanceSummary = {
  total_income?: number | string;
  total_expenses?: number | string;
  balance?: number | string;
  by_category?: Array<{
    category_name?: string;
    total?: number | string;
    type?: number;
  }>;
};

export async function listFinanceCategories(query: FinanceCategoryQuery = {}) {
  return apiRequest<FinanceCategory[]>("/finances/categories", { params: query });
}

export async function listClubFinances(clubId: number, query: FinanceListQuery = {}) {
  return apiRequest<Finance[]>(`/clubs/${clubId}/finances`, { params: query });
}

export async function getClubFinanceSummary(clubId: number, query: FinanceSummaryQuery = {}) {
  return apiRequest<FinanceSummary>(`/clubs/${clubId}/finances/summary`, { params: query });
}

export async function getFinanceById(financeId: number) {
  return apiRequest<Finance>(`/finances/${financeId}`);
}

export async function createFinance(clubId: number, payload: FinancePayload) {
  return apiRequest(`/clubs/${clubId}/finances`, {
    method: "POST",
    body: payload,
  });
}

export async function updateFinance(financeId: number, payload: Partial<FinancePayload>) {
  return apiRequest(`/finances/${financeId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteFinance(financeId: number) {
  return apiRequest(`/finances/${financeId}`, {
    method: "DELETE",
  });
}
