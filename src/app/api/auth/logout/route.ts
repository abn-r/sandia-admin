import { NextResponse, type NextRequest } from "next/server";
import { clearSession } from "@/lib/auth/session";

export async function POST() {
  await clearSession();
  return NextResponse.json({ message: "ok" });
}

export async function GET(request: NextRequest) {
  await clearSession();

  const nextParam = request.nextUrl.searchParams.get("next");
  const safeNext = typeof nextParam === "string" && nextParam.startsWith("/") ? nextParam : "/login";
  const redirectUrl = new URL(safeNext, request.url);

  return NextResponse.redirect(redirectUrl);
}
