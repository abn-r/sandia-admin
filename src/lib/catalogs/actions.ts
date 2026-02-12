"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getEntityConfig, type EntityKey } from "@/lib/catalogs/entities";
import {
  buildPayloadFromForm,
  createEntityItem,
  deleteEntityItem,
  updateEntityItem,
} from "@/lib/catalogs/service";

export type CatalogActionState = {
  error?: string;
};

export async function createCatalogItemAction(
  entityKey: EntityKey,
  redirectTo: string,
  _: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const config = getEntityConfig(entityKey);

  if (!config) {
    return { error: "Entidad no soportada" };
  }

  try {
    const payload = buildPayloadFromForm(config, formData);
    await createEntityItem(entityKey, payload);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo crear el registro",
    };
  }

  revalidatePath(config.routeBase);
  redirect(redirectTo);
}

export async function updateCatalogItemAction(
  entityKey: EntityKey,
  id: number,
  redirectTo: string,
  _: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const config = getEntityConfig(entityKey);

  if (!config) {
    return { error: "Entidad no soportada" };
  }

  try {
    const payload = buildPayloadFromForm(config, formData);
    await updateEntityItem(entityKey, id, payload);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo actualizar el registro",
    };
  }

  revalidatePath(config.routeBase);
  redirect(redirectTo);
}

export async function deleteCatalogItemAction(formData: FormData) {
  const entityKey = String(formData.get("entityKey")) as EntityKey;
  const id = Number(formData.get("id"));
  const returnPath = String(formData.get("returnPath") ?? "");
  const config = getEntityConfig(entityKey);

  if (!config || !id) {
    return;
  }

  await deleteEntityItem(entityKey, id);
  revalidatePath(config.routeBase);

  if (returnPath.startsWith("/")) {
    redirect(returnPath);
  }
}
