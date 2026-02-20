"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActionErrorMessage } from "@/lib/api/action-error";
import {
  createFinance,
  deleteFinance,
  updateFinance,
  type FinancePayload,
} from "@/lib/api/finances";

export type FinanceActionState = {
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

function parseRequiredType(formData: FormData) {
  const value = parseRequiredNumber(formData, "type", "Tipo");
  if (value !== 0 && value !== 1) {
    throw new Error("El tipo debe ser 0 (ingreso) o 1 (egreso)");
  }

  return value as 0 | 1;
}

function parseOptionalType(formData: FormData) {
  const value = parseOptionalNumber(formData, "type");
  if (value === undefined) {
    return undefined;
  }

  if (value !== 0 && value !== 1) {
    throw new Error("El tipo debe ser 0 (ingreso) o 1 (egreso)");
  }

  return value as 0 | 1;
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
  payload: FinancePayload | Partial<FinancePayload>,
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
  const description = readString(formData, "description");
  if (!description) {
    throw new Error("La descripcion es obligatoria");
  }

  const amount = parseRequiredNumber(formData, "amount", "Monto");
  if (amount <= 0) {
    throw new Error("El monto debe ser mayor a cero");
  }

  const transactionDate = readString(formData, "transaction_date");
  if (!transactionDate) {
    throw new Error("La fecha de transaccion es obligatoria");
  }

  const instanceType = parseOptionalInstanceType(formData);
  if (!instanceType) {
    throw new Error("El tipo de instancia es obligatorio");
  }

  const instanceId = parseRequiredNumber(formData, "instance_id", "Instancia");

  const payload: FinancePayload = {
    description,
    amount,
    type: parseRequiredType(formData),
    transaction_date: transactionDate,
    finance_category_id: parseRequiredNumber(formData, "finance_category_id", "Categoria"),
    ecclesiastical_year_id: parseOptionalNumber(formData, "ecclesiastical_year_id"),
    receipt_number: readString(formData, "receipt_number") || undefined,
    notes: readString(formData, "notes") || undefined,
  };

  assignInstanceFields(payload, instanceType, instanceId);

  return payload;
}

function buildUpdatePayload(formData: FormData) {
  const payload: Partial<FinancePayload> = {};

  const description = readString(formData, "description");
  const transactionDate = readString(formData, "transaction_date");
  const receiptNumber = readString(formData, "receipt_number");
  const notes = readString(formData, "notes");

  if (description) {
    payload.description = description;
  }

  if (transactionDate) {
    payload.transaction_date = transactionDate;
  }

  if (receiptNumber) {
    payload.receipt_number = receiptNumber;
  }

  if (notes) {
    payload.notes = notes;
  }

  const amount = parseOptionalNumber(formData, "amount");
  if (amount !== undefined) {
    if (amount <= 0) {
      throw new Error("El monto debe ser mayor a cero");
    }

    payload.amount = amount;
  }

  const type = parseOptionalType(formData);
  if (type !== undefined) {
    payload.type = type;
  }

  const categoryId = parseOptionalNumber(formData, "finance_category_id");
  if (categoryId !== undefined) {
    payload.finance_category_id = categoryId;
  }

  const ecclesiasticalYearId = parseOptionalNumber(formData, "ecclesiastical_year_id");
  if (ecclesiasticalYearId !== undefined) {
    payload.ecclesiastical_year_id = ecclesiasticalYearId;
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

export async function createFinanceAction(
  clubId: number,
  _: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
    const payload = buildCreatePayload(formData);
    await createFinance(clubId, payload);
  } catch (error) {
    return {
      error: getActionErrorMessage(error, "No se pudo crear el movimiento", {
        endpointLabel: `/clubs/${clubId}/finances`,
      }),
    };
  }

  revalidatePath("/dashboard/finances");
  redirect("/dashboard/finances");
}

export async function updateFinanceAction(
  financeId: number,
  _: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
    const payload = buildUpdatePayload(formData);
    await updateFinance(financeId, payload);
  } catch (error) {
    return {
      error: getActionErrorMessage(error, "No se pudo actualizar el movimiento", {
        endpointLabel: `/finances/${financeId}`,
      }),
    };
  }

  revalidatePath("/dashboard/finances");
  revalidatePath(`/dashboard/finances/${financeId}`);
  redirect("/dashboard/finances");
}

export async function deleteFinanceAction(formData: FormData) {
  const financeId = Number(formData.get("id"));
  if (!Number.isFinite(financeId) || financeId <= 0) {
    return;
  }

  await deleteFinance(financeId);
  revalidatePath("/dashboard/finances");
  redirect("/dashboard/finances");
}
