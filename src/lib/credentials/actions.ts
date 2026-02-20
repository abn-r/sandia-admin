"use server";

import { redirect } from "next/navigation";
import { disconnectOauthProvider, requestPasswordReset } from "@/lib/api/auth";

function readString(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

function createResultUrl(status: string) {
  return `/dashboard/credentials?status=${encodeURIComponent(status)}`;
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = readString(formData, "email");
  if (!email) {
    redirect(createResultUrl("missing_email"));
  }

  try {
    await requestPasswordReset(email);
    redirect(createResultUrl("password_reset_sent"));
  } catch {
    redirect(createResultUrl("password_reset_error"));
  }
}

export async function disconnectOauthProviderAction(formData: FormData) {
  const provider = readString(formData, "provider");

  if (provider !== "google" && provider !== "apple") {
    redirect(createResultUrl("invalid_provider"));
  }

  try {
    await disconnectOauthProvider(provider);
    redirect(createResultUrl(`provider_disconnected_${provider}`));
  } catch {
    redirect(createResultUrl(`provider_disconnect_error_${provider}`));
  }
}
