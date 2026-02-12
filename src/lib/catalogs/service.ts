import { ApiError, apiRequest } from "@/lib/api/client";
import {
  entityConfigs,
  type EntityConfig,
  type EntityField,
  type EntityKey,
} from "@/lib/catalogs/entities";

export type CatalogItem = Record<string, unknown>;

function getIdValue(item: CatalogItem, config: EntityConfig): number {
  const id = item[config.idField];
  if (typeof id === "number") {
    return id;
  }

  return Number(id ?? 0);
}

function normalizeItem(item: CatalogItem): CatalogItem {
  if (typeof item.active === "boolean") {
    return item;
  }

  return { ...item, active: true };
}

function normalizeCollection(payload: unknown): CatalogItem[] {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeItem(item as CatalogItem));
  }

  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown[] }).data)) {
    return (payload as { data: unknown[] }).data.map((item) => normalizeItem(item as CatalogItem));
  }

  return [];
}

export async function listEntityItems(entityKey: EntityKey, query: Record<string, string | undefined> = {}) {
  const config = entityConfigs[entityKey];

  const params = new URLSearchParams();

  if (config.parentFilter) {
    const value = query[config.parentFilter.queryParam];
    if (value) {
      params.set(config.parentFilter.queryParam, value);
    }
  }

  const path = params.toString() ? `${config.listEndpoint}?${params.toString()}` : config.listEndpoint;

  try {
    const payload = await apiRequest<unknown>(path);
    return normalizeCollection(payload);
  } catch (error) {
    if (error instanceof ApiError && [404, 405].includes(error.status)) {
      return [];
    }

    throw error;
  }
}

export async function getEntityItemById(entityKey: EntityKey, id: number) {
  const config = entityConfigs[entityKey];
  const items = await listEntityItems(entityKey);
  return items.find((item) => getIdValue(item, config) === id) ?? null;
}

export async function getSelectOptions(entityKey: EntityKey) {
  const config = entityConfigs[entityKey];
  const items = await listEntityItems(entityKey);

  return items.map((item) => ({
    label: String(item[config.nameField] ?? `#${item[config.idField] ?? ""}`),
    value: Number(item[config.idField]),
  }));
}

function parseFieldValue(field: EntityField, rawValue: FormDataEntryValue | null) {
  if (field.type === "checkbox") {
    return rawValue === "on" || rawValue === "true";
  }

  if (rawValue === null || rawValue === "") {
    return field.required ? null : undefined;
  }

  if (field.type === "number" || field.type === "select") {
    const numberValue = Number(rawValue);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  return String(rawValue).trim();
}

export function buildPayloadFromForm(config: EntityConfig, formData: FormData) {
  const payload: Record<string, unknown> = {};

  for (const field of config.fields) {
    const parsedValue = parseFieldValue(field, formData.get(field.name));

    if (field.required && (parsedValue === null || parsedValue === undefined || parsedValue === "")) {
      throw new Error(`El campo ${field.label} es obligatorio`);
    }

    if (parsedValue !== undefined) {
      payload[field.name] = parsedValue;
    }
  }

  return payload;
}

export async function createEntityItem(entityKey: EntityKey, payload: Record<string, unknown>) {
  const config = entityConfigs[entityKey];
  return apiRequest(config.adminEndpoint, {
    method: "POST",
    body: payload,
  });
}

export async function updateEntityItem(entityKey: EntityKey, id: number, payload: Record<string, unknown>) {
  const config = entityConfigs[entityKey];
  return apiRequest(`${config.adminEndpoint}/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteEntityItem(entityKey: EntityKey, id: number) {
  const config = entityConfigs[entityKey];
  return apiRequest(`${config.adminEndpoint}/${id}`, {
    method: "DELETE",
  });
}
