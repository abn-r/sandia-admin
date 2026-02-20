"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActionErrorMessage } from "@/lib/api/action-error";
import {
  createInventoryItem,
  deleteInventoryItem,
  updateInventoryItem,
  type InventoryPayload,
} from "@/lib/api/inventory";

export type InventoryActionState = {
  error?: string;
};

type InstanceType = "adventurers" | "pathfinders" | "master_guilds";

function readString(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

function parseRequiredNumber(formData: FormData, fieldName: string, label: string) {
  const value = readString(formData, fieldName);
  if (!value) {
    throw new Error(`El campo ${label} es obligatorio`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`El campo ${label} no es valido`);
  }

  return parsed;
}

function parseOptionalNumber(formData: FormData, fieldName: string) {
  const value = readString(formData, fieldName);
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`El campo ${fieldName} no es valido`);
  }

  return parsed;
}

function parseOptionalInstanceType(formData: FormData) {
  const value = readString(formData, "instance_type");
  if (!value) {
    return undefined;
  }

  if (value === "adventurers" || value === "pathfinders" || value === "master_guilds") {
    return value;
  }

  throw new Error("El tipo de instancia no es valido");
}

function assignInstanceFields(
  payload: InventoryPayload | Partial<InventoryPayload>,
  instanceType: InstanceType,
  instanceId: number,
) {
  payload.club_adv_id = undefined;
  payload.club_pathf_id = undefined;
  payload.club_mg_id = undefined;

  if (instanceType === "adventurers") {
    payload.club_adv_id = instanceId;
    return;
  }

  if (instanceType === "master_guilds") {
    payload.club_mg_id = instanceId;
    return;
  }

  payload.club_pathf_id = instanceId;
}

function buildCreatePayload(formData: FormData) {
  const name = readString(formData, "name");
  if (!name) {
    throw new Error("El nombre del item es obligatorio");
  }

  const amount = parseRequiredNumber(formData, "amount", "Cantidad");
  if (amount < 0) {
    throw new Error("La cantidad no puede ser negativa");
  }

  const instanceType = parseOptionalInstanceType(formData);
  if (!instanceType) {
    throw new Error("El tipo de instancia es obligatorio");
  }

  const instanceId = parseRequiredNumber(formData, "instance_id", "Instancia");

  const payload: InventoryPayload = {
    name,
    description: readString(formData, "description") || undefined,
    inventory_category_id: parseOptionalNumber(formData, "inventory_category_id"),
    amount,
  };

  assignInstanceFields(payload, instanceType, instanceId);

  return payload;
}

function buildUpdatePayload(formData: FormData) {
  const payload: Partial<InventoryPayload> = {};

  const name = readString(formData, "name");
  const description = readString(formData, "description");

  if (name) {
    payload.name = name;
  }

  if (description) {
    payload.description = description;
  }

  const amount = parseOptionalNumber(formData, "amount");
  if (amount !== undefined) {
    if (amount < 0) {
      throw new Error("La cantidad no puede ser negativa");
    }

    payload.amount = amount;
  }

  const categoryId = parseOptionalNumber(formData, "inventory_category_id");
  if (categoryId !== undefined) {
    payload.inventory_category_id = categoryId;
  }

  const instanceType = parseOptionalInstanceType(formData);
  const instanceId = parseOptionalNumber(formData, "instance_id");
  if (instanceType && instanceId !== undefined) {
    assignInstanceFields(payload, instanceType, instanceId);
  }

  if (formData.has("active")) {
    payload.active = formData.get("active") === "on" || formData.get("active") === "true";
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("No hay cambios para guardar");
  }

  return payload;
}

export async function createInventoryItemAction(
  clubId: number,
  _: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  try {
    const payload = buildCreatePayload(formData);
    await createInventoryItem(clubId, payload);
  } catch (error) {
    return {
      error: getActionErrorMessage(error, "No se pudo crear el item", {
        endpointLabel: `/clubs/${clubId}/inventory`,
      }),
    };
  }

  revalidatePath("/dashboard/inventory");
  redirect("/dashboard/inventory");
}

export async function updateInventoryItemAction(
  inventoryId: number,
  _: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  try {
    const payload = buildUpdatePayload(formData);
    await updateInventoryItem(inventoryId, payload);
  } catch (error) {
    return {
      error: getActionErrorMessage(error, "No se pudo actualizar el item", {
        endpointLabel: `/inventory/${inventoryId}`,
      }),
    };
  }

  revalidatePath("/dashboard/inventory");
  revalidatePath(`/dashboard/inventory/${inventoryId}`);
  redirect("/dashboard/inventory");
}

export async function deleteInventoryItemAction(formData: FormData) {
  const inventoryId = Number(formData.get("id"));
  if (!Number.isFinite(inventoryId) || inventoryId <= 0) {
    return;
  }

  await deleteInventoryItem(inventoryId);
  revalidatePath("/dashboard/inventory");
  redirect("/dashboard/inventory");
}
