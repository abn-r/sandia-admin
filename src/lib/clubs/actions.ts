"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActionErrorMessage } from "@/lib/api/action-error";
import {
  addClubInstanceMember,
  createClub,
  createClubInstance,
  deleteClub,
  removeClubInstanceMember,
  updateClub,
  updateClubInstance,
  updateClubInstanceMemberRole,
  type ClubInstanceType,
} from "@/lib/api/clubs";

export type ClubActionState = {
  error?: string;
  success?: string;
};

function readString(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

function parseInstanceType(value: string): ClubInstanceType {
  if (value === "adventurers" || value === "pathfinders" || value === "master_guilds") {
    return value;
  }

  throw new Error("Tipo de instancia no valido");
}

function buildClubInstancePath(clubId: number, instanceType: ClubInstanceType, instanceId: number) {
  return `/dashboard/clubs/${clubId}/instances/${instanceType}/${instanceId}`;
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

function parseCoordinates(formData: FormData) {
  const latRaw = readString(formData, "coordinates_lat");
  const lngRaw = readString(formData, "coordinates_lng");

  if (!latRaw && !lngRaw) {
    return undefined;
  }

  if (!latRaw || !lngRaw) {
    throw new Error("Para guardar coordenadas debes capturar latitud y longitud");
  }

  const lat = Number(latRaw);
  const lng = Number(lngRaw);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Las coordenadas no son validas");
  }

  return { lat, lng };
}

function buildCreatePayload(formData: FormData) {
  const name = readString(formData, "name");
  if (!name) {
    throw new Error("El nombre del club es obligatorio");
  }

  return {
    name,
    description: readString(formData, "description") || undefined,
    local_field_id: parseRequiredNumber(formData, "local_field_id", "Campo local"),
    district_id: parseRequiredNumber(formData, "district_id", "Distrito"),
    church_id: parseRequiredNumber(formData, "church_id", "Iglesia"),
    address: readString(formData, "address") || undefined,
    coordinates: parseCoordinates(formData),
  };
}

function buildUpdatePayload(formData: FormData) {
  const payload: Record<string, unknown> = {};

  const name = readString(formData, "name");
  const description = readString(formData, "description");
  const address = readString(formData, "address");

  if (name) {
    payload.name = name;
  }

  if (description) {
    payload.description = description;
  }

  if (address) {
    payload.address = address;
  }

  const localFieldId = parseOptionalNumber(formData, "local_field_id");
  const districtId = parseOptionalNumber(formData, "district_id");
  const churchId = parseOptionalNumber(formData, "church_id");

  if (localFieldId !== undefined) {
    payload.local_field_id = localFieldId;
  }

  if (districtId !== undefined) {
    payload.district_id = districtId;
  }

  if (churchId !== undefined) {
    payload.church_id = churchId;
  }

  const coordinates = parseCoordinates(formData);
  if (coordinates) {
    payload.coordinates = coordinates;
  }

  if (formData.has("active")) {
    payload.active = formData.get("active") === "on" || formData.get("active") === "true";
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("No hay cambios para guardar");
  }

  return payload;
}

export async function createClubAction(
  _: ClubActionState,
  formData: FormData,
): Promise<ClubActionState> {
  try {
    const payload = buildCreatePayload(formData);
    await createClub(payload);
  } catch (error) {
    return {
      error: getActionErrorMessage(error, "No se pudo crear el club", {
        endpointLabel: "/clubs",
      }),
    };
  }

  revalidatePath("/dashboard/clubs");
  redirect("/dashboard/clubs");
}

export async function updateClubAction(
  clubId: number,
  _: ClubActionState,
  formData: FormData,
): Promise<ClubActionState> {
  try {
    const payload = buildUpdatePayload(formData);
    await updateClub(clubId, payload);
  } catch (error) {
    return {
      error: getActionErrorMessage(error, "No se pudo actualizar el club", {
        endpointLabel: `/clubs/${clubId}`,
      }),
    };
  }

  revalidatePath("/dashboard/clubs");
  revalidatePath(`/dashboard/clubs/${clubId}`);
  redirect("/dashboard/clubs");
}

export async function deleteClubAction(formData: FormData) {
  const clubId = Number(formData.get("id"));
  if (!Number.isFinite(clubId) || clubId <= 0) {
    return;
  }

  await deleteClub(clubId);
  revalidatePath("/dashboard/clubs");
  redirect("/dashboard/clubs");
}

export async function createClubInstanceAction(
  clubId: number,
  _: ClubActionState,
  formData: FormData,
): Promise<ClubActionState> {
  const name = readString(formData, "name");

  if (!name) {
    return { error: "El nombre de la instancia es obligatorio" };
  }

  let clubTypeId = 0;
  try {
    clubTypeId = parseRequiredNumber(formData, "club_type_id", "Tipo de club");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Tipo de club invalido" };
  }

  try {
    await createClubInstance(clubId, {
      name,
      club_type_id: clubTypeId,
    });
  } catch (error) {
    return {
      error: getActionErrorMessage(error, "No se pudo crear la instancia", {
        endpointLabel: `/clubs/${clubId}/instances`,
      }),
    };
  }

  revalidatePath(`/dashboard/clubs/${clubId}`);
  return { success: "Instancia creada correctamente" };
}

export async function updateClubInstanceAction(
  clubId: number,
  instanceTypeValue: string,
  instanceId: number,
  _: ClubActionState,
  formData: FormData,
): Promise<ClubActionState> {
  let instanceType: ClubInstanceType;
  try {
    instanceType = parseInstanceType(instanceTypeValue);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Tipo de instancia invalido" };
  }

  const payload: { name?: string; active?: boolean } = {};
  const name = readString(formData, "name");
  if (name) {
    payload.name = name;
  }

  const activeRaw = readString(formData, "active");
  if (activeRaw) {
    if (activeRaw !== "true" && activeRaw !== "false") {
      return { error: "El estado de la instancia no es valido" };
    }
    payload.active = activeRaw === "true";
  }

  if (Object.keys(payload).length === 0) {
    return { error: "No hay cambios para guardar en la instancia" };
  }

  try {
    await updateClubInstance(clubId, instanceType, instanceId, payload);
  } catch (error) {
    return {
      error: getActionErrorMessage(error, "No se pudo actualizar la instancia", {
        endpointLabel: `/clubs/${clubId}/instances/${instanceType}/${instanceId}`,
      }),
    };
  }

  revalidatePath(`/dashboard/clubs/${clubId}`);
  revalidatePath(buildClubInstancePath(clubId, instanceType, instanceId));
  return { success: "Instancia actualizada correctamente" };
}

export async function addClubInstanceMemberAction(
  clubId: number,
  instanceTypeValue: string,
  instanceId: number,
  _: ClubActionState,
  formData: FormData,
): Promise<ClubActionState> {
  let instanceType: ClubInstanceType;
  try {
    instanceType = parseInstanceType(instanceTypeValue);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Tipo de instancia invalido" };
  }

  const userId = readString(formData, "user_id");
  if (!userId) {
    return { error: "El ID del usuario es obligatorio" };
  }

  let roleId = 0;
  let ecclesiasticalYearId = 0;
  try {
    roleId = parseRequiredNumber(formData, "role_id", "Rol");
    ecclesiasticalYearId = parseRequiredNumber(formData, "ecclesiastical_year_id", "Año eclesiastico");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Datos invalidos" };
  }

  try {
    await addClubInstanceMember(clubId, instanceType, instanceId, {
      user_id: userId,
      role_id: roleId,
      ecclesiastical_year_id: ecclesiasticalYearId,
    });
  } catch (error) {
    return {
      error: getActionErrorMessage(error, "No se pudo agregar el miembro", {
        endpointLabel: `/clubs/${clubId}/instances/${instanceType}/${instanceId}/members`,
      }),
    };
  }

  revalidatePath(`/dashboard/clubs/${clubId}`);
  revalidatePath(buildClubInstancePath(clubId, instanceType, instanceId));
  return { success: "Miembro agregado correctamente" };
}

export async function updateClubInstanceMemberRoleAction(
  clubId: number,
  instanceTypeValue: string,
  instanceId: number,
  userId: string,
  _: ClubActionState,
  formData: FormData,
): Promise<ClubActionState> {
  if (!userId) {
    return { error: "No se pudo identificar al miembro" };
  }

  let instanceType: ClubInstanceType;
  try {
    instanceType = parseInstanceType(instanceTypeValue);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Tipo de instancia invalido" };
  }

  let roleId = 0;
  try {
    roleId = parseRequiredNumber(formData, "role_id", "Rol");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Rol invalido" };
  }

  try {
    await updateClubInstanceMemberRole(clubId, instanceType, instanceId, userId, { role_id: roleId });
  } catch (error) {
    return {
      error: getActionErrorMessage(error, "No se pudo actualizar el rol", {
        endpointLabel: `/clubs/${clubId}/instances/${instanceType}/${instanceId}/members/${userId}/role`,
      }),
    };
  }

  revalidatePath(buildClubInstancePath(clubId, instanceType, instanceId));
  return { success: "Rol actualizado correctamente" };
}

export async function removeClubInstanceMemberAction(
  clubId: number,
  instanceTypeValue: string,
  instanceId: number,
  _: ClubActionState,
  formData: FormData,
): Promise<ClubActionState> {
  let instanceType: ClubInstanceType;
  try {
    instanceType = parseInstanceType(instanceTypeValue);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Tipo de instancia invalido" };
  }

  const userId = readString(formData, "user_id");
  if (!userId) {
    return { error: "No se pudo identificar el miembro a remover" };
  }

  try {
    await removeClubInstanceMember(clubId, instanceType, instanceId, userId);
  } catch (error) {
    return {
      error: getActionErrorMessage(error, "No se pudo remover el miembro", {
        endpointLabel: `/clubs/${clubId}/instances/${instanceType}/${instanceId}/members/${userId}`,
      }),
    };
  }

  revalidatePath(`/dashboard/clubs/${clubId}`);
  revalidatePath(buildClubInstancePath(clubId, instanceType, instanceId));
  return { success: "Miembro removido correctamente" };
}
