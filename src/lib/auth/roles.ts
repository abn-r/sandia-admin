import type { AuthUser } from "@/lib/auth/types";

export const ALLOWED_ADMIN_ROLES = ["super_admin", "admin", "coordinator"] as const;

function normalizeRole(role: unknown): string | null {
  if (typeof role !== "string") {
    return null;
  }

  return role.trim().toLowerCase();
}

export function extractRoles(user: AuthUser | null | undefined): string[] {
  if (!user) {
    return [];
  }

  // Si la respuesta viene envuelta en { status, data }, extraer data
  const resolved = unwrapResponse(user);

  const roles = new Set<string>();

  const addRole = (value: unknown) => {
    const normalized = normalizeRole(value);
    if (normalized) {
      roles.add(normalized);
    }
  };

  addRole(resolved.role);

  if (Array.isArray(resolved.roles)) {
    resolved.roles.forEach(addRole);
  }

  const nestedKeys = ["global_role", "global_roles", "club_roles"];
  nestedKeys.forEach((key) => {
    const value = resolved[key];

    if (Array.isArray(value)) {
      value.forEach(addRole);
      return;
    }

    addRole(value);
  });

  // Manejar users_roles en formato Prisma: [{ roles: { role_name } }]
  const usersRoles = resolved["users_roles"];
  if (Array.isArray(usersRoles)) {
    for (const ur of usersRoles) {
      if (ur && typeof ur === "object") {
        const record = ur as Record<string, unknown>;
        const nestedRole = record["roles"] as Record<string, unknown> | undefined;
        if (nestedRole?.["role_name"]) {
          addRole(nestedRole["role_name"]);
        }
      }
    }
  }

  const metadata = resolved["metadata"];
  if (metadata && typeof metadata === "object") {
    const record = metadata as Record<string, unknown>;
    const role = record["role"];
    const rolesList = record["roles"];

    addRole(role);
    if (Array.isArray(rolesList)) {
      rolesList.forEach(addRole);
    }
  }

  return Array.from(roles);
}

// Desenvuelve respuestas del backend con formato { status, data: { ... } }
function unwrapResponse(user: AuthUser): AuthUser {
  const status = user["status"];
  const data = user["data"];

  if (
    typeof status === "string" &&
    data &&
    typeof data === "object" &&
    !Array.isArray(data)
  ) {
    return data as AuthUser;
  }

  return user;
}

export function hasAdminRole(user: AuthUser | null | undefined): boolean {
  const roleSet = new Set(extractRoles(user));
  return ALLOWED_ADMIN_ROLES.some((role) => roleSet.has(role));
}
