
// authStorageService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";

export type UserRole = "PARENT" | "STAFF" | "ADMIN" | "TEACHER";

export interface AuthCredentials {
  token: string;
  tenantId: string;
  loginId: string;
  role: UserRole;
  expiresAt: number; // Unix timestamp (ms)
  refreshToken: string;
}

/**
 * Storage keys (single source of truth)
 */
const AUTH_KEYS = {
  TOKEN: "auth_token",
  TENANT_ID: "auth_tenant",
  LOGIN_ID: "auth_login_id",
  ROLE: "auth_role",
  EXPIRES_AT: "auth_expires_at",
  REFRESH_TOKEN: "refresh_token"
} as const;

/* -------------------------------------------------------------------------- */
/*                               SAVE CREDENTIALS                             */
/* -------------------------------------------------------------------------- */

export const saveAuthCredentials = async (credentials: AuthCredentials): Promise<void> => {
  try {
    const encodedTenantId = Buffer.from(credentials.tenantId,"utf-8").toString("base64");
    await AsyncStorage.multiSet([
      [AUTH_KEYS.TOKEN, credentials.token],
      [AUTH_KEYS.TENANT_ID, encodedTenantId],
      [AUTH_KEYS.LOGIN_ID, credentials.loginId],
      [AUTH_KEYS.ROLE, credentials.role],
      [AUTH_KEYS.EXPIRES_AT, credentials.expiresAt.toString()],
      [AUTH_KEYS.REFRESH_TOKEN, credentials.refreshToken ],

    ]);
  } catch (error) {
    console.error("❌ Failed to save auth credentials:", error);
    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*                              GET CREDENTIALS                               */
/* -------------------------------------------------------------------------- */

export const getAuthCredentials = async (): Promise<AuthCredentials | null> => {
  try {
    const entries = await AsyncStorage.multiGet(Object.values(AUTH_KEYS));
    const data = Object.fromEntries(entries);
    const token = data[AUTH_KEYS.TOKEN];
    const encodedTenantId = data[AUTH_KEYS.TENANT_ID];
    const loginId = data[AUTH_KEYS.LOGIN_ID];
    const role = data[AUTH_KEYS.ROLE] as UserRole | undefined;
    const expiresAtStr = data[AUTH_KEYS.EXPIRES_AT];
    const refreshToken = data[AUTH_KEYS.REFRESH_TOKEN];

    // Incomplete or corrupted storage
    if (!token || refreshToken == null || !encodedTenantId || loginId == null  || !role || !expiresAtStr) {
      return null;
    }

    const expiresAt = Number(expiresAtStr);
    if (isNaN(expiresAt)) return null;

    return {
      token,
      tenantId: Buffer.from(encodedTenantId, "base64").toString("utf-8"),
      loginId,
      role,
      expiresAt,
      refreshToken
    };
  } catch (error) {
    console.error("❌ Failed to read auth credentials:", error);
    return null;
  }
};

/* -------------------------------------------------------------------------- */
/*                              TOKEN EXPIRY CHECK                             */
/* -------------------------------------------------------------------------- */

export const isTokenExpired = async (): Promise<boolean> => {
  try {
    const expiresAtStr = await AsyncStorage.getItem(AUTH_KEYS.EXPIRES_AT);
    if (!expiresAtStr) return true;

    const expiresAt = Number(expiresAtStr);
    if (isNaN(expiresAt)) return true;

    return Date.now() >= expiresAt;
  } catch (error) {
    console.error("❌ Error checking token expiry:", error);
    return true;
  }
};

/* -------------------------------------------------------------------------- */
/*                              CLEAR AUTH STORAGE                             */
/* -------------------------------------------------------------------------- */

export const clearAuthStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(AUTH_KEYS));
  } catch (error) {
    console.error("❌ Failed to clear auth storage:", error);
    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*                        REMAINING TOKEN LIFETIME (SEC)                       */
/* -------------------------------------------------------------------------- */

export const getTokenLifetime = async (): Promise<number> => {
  try {
    const expiresAtStr = await AsyncStorage.getItem(AUTH_KEYS.EXPIRES_AT);
    if (!expiresAtStr) return 0;

    const expiresAt = Number(expiresAtStr);
    if (isNaN(expiresAt)) return 0;

    const remainingMs = expiresAt - Date.now();
    return Math.max(0, Math.floor(remainingMs / 1000));
  } catch (error) {
    console.error("❌ Failed to calculate token lifetime:", error);
    return 0;
  }
};
