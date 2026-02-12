export type AdminRole = "super_admin" | "admin" | "coordinator";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  paternal_last_name?: string | null;
  maternal_last_name?: string | null;
  picture_url?: string | null;
  role?: string | null;
  roles?: string[];
  permissions?: string[];
  active?: boolean;
  [key: string]: unknown;
};

export type LoginResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: AuthUser;
  message?: string;
  error?: string;
  status?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    access_token?: string;
    refresh_token?: string;
    user?: AuthUser;
    message?: string;
    error?: string;
    detail?: string;
    reason?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type AuthActionState = {
  error?: string;
};
