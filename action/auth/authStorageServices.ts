// // authStorageService.ts
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Buffer } from "buffer";

// export interface AuthCredentials {
//   token: string;
//   tenantId: string;
//   loginId: string;
//   role: "PARENT" | "STAFF" | "ADMIN";
//   expiresAt: number; // Unix timestamp in milliseconds
// }

// const AUTH_KEYS = {
//   TOKEN: "auth_token",
//   TENANT_ID: "auth_tenant",
//   LOGIN_ID: "auth_login_id",
//   ROLE: "auth_role",
//   EXPIRES_AT: "auth_expires_at",
// } as const;

// /**
//  * Save authentication credentials to AsyncStorage
//  */
// export const saveAuthCredentials = async (
//   credentials: AuthCredentials
// ): Promise<void> => {
//   try {
//     const encodedTenant = Buffer.from(credentials.tenantId, "utf-8").toString(
//       "base64"
//     );

//     const storageData = [
//       [AUTH_KEYS.TOKEN, credentials.token],
//       [AUTH_KEYS.TENANT_ID, encodedTenant],
//       [AUTH_KEYS.LOGIN_ID, credentials.loginId],
//       [AUTH_KEYS.ROLE, credentials.role],
//       [AUTH_KEYS.EXPIRES_AT, credentials.expiresAt.toString()],
//     ] as const;

//     await AsyncStorage.multiSet(storageData);
//     // console.log("✓ Auth credentials saved successfully");
//   } catch (error) {
//     console.error("✗ Failed to save auth credentials:", error);
//     throw error;
//   }
// };

// /**
//  * Retrieve authentication credentials from AsyncStorage
//  */
// export const getAuthCredentials = async (): Promise<AuthCredentials | null> => {
//   try {
//     const values = await AsyncStorage.multiGet([
//       AUTH_KEYS.TOKEN,
//       AUTH_KEYS.TENANT_ID,
//       AUTH_KEYS.LOGIN_ID,
//       AUTH_KEYS.ROLE,
//       AUTH_KEYS.EXPIRES_AT,
//     ]);

//     const [
//       [, token],
//       [, encodedTenant],
//       [, loginId],
//       [, role],
//       [, expiresAtStr],
//     ] = values;
 
//     if (!token || !encodedTenant || !loginId || !role || !expiresAtStr) {
//       console.warn("⚠ Incomplete auth data in storage");
//       return null;
//     }

//     const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
//     const expiresAt = Number(expiresAtStr);

//     // Validate expiration
//     if (isNaN(expiresAt)) {
//       console.warn("⚠ Invalid expiration timestamp");
//       return null;
//     }

//     return {
//       token,
//       tenantId,
//       loginId,
//       role: role as AuthCredentials["role"],
//       expiresAt,
//     };
//   } catch (error) {
//     console.error("✗ Failed to retrieve auth credentials:", error);
//     return null;
//   }
// };

// /**
//  * Check if token is expired
//  */
// export const isTokenExpired = async (): Promise<boolean> => {
//   try {
//     const credentials = await getAuthCredentials();
//     if (!credentials) return true;

//     const isExpired = Date.now() >= credentials.expiresAt;
//     // console.log("Token expiration check:", {
//     //   current: new Date(Date.now()).toISOString(),
//     //   expires: new Date(credentials.expiresAt).toISOString(),
//     //   isExpired,
//     // });

//     return isExpired;
//   } catch (error) {
//     console.error("✗ Error checking token expiration:", error);
//     return true;
//   }
// };

// /**
//  * Clear all authentication data
//  */
// export const clearAuthStorage = async (): Promise<void> => {
//   try {
//     await AsyncStorage.multiRemove(Object.values(AUTH_KEYS));
//     // console.log("✓ Auth storage cleared");
//   } catch (error) {
//     console.error("✗ Failed to clear auth storage:", error);
//     throw error;
//   }
// };

// /**
//  * Get remaining token lifetime in seconds
//  */
// export const getTokenLifetime = async (): Promise<number> => {
//   try {
//     const credentials = await getAuthCredentials();
//     if (!credentials) return 0;

//     const remainingMs = credentials.expiresAt - Date.now();
//     const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

//     return remainingSeconds;
//   } catch (error) {
//     console.error("✗ Error calculating token lifetime:", error);
//     return 0;
//   }
// };


// authStorageService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";

/**
 * Supported roles
 */
export type UserRole = "PARENT" | "STAFF" | "ADMIN";

/**
 * Auth credentials shape
 */
export interface AuthCredentials {
  token: string;
  tenantId: string;
  loginId: string;
  role: UserRole;
  expiresAt: number; // Unix timestamp (ms)
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
} as const;

/* -------------------------------------------------------------------------- */
/*                               SAVE CREDENTIALS                             */
/* -------------------------------------------------------------------------- */

export const saveAuthCredentials = async (
  credentials: AuthCredentials
): Promise<void> => {
  try {
    const encodedTenantId = Buffer.from(
      credentials.tenantId,
      "utf-8"
    ).toString("base64");

    await AsyncStorage.multiSet([
      [AUTH_KEYS.TOKEN, credentials.token],
      [AUTH_KEYS.TENANT_ID, encodedTenantId],
      [AUTH_KEYS.LOGIN_ID, credentials.loginId],
      [AUTH_KEYS.ROLE, credentials.role],
      [AUTH_KEYS.EXPIRES_AT, credentials.expiresAt.toString()],
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

    // Incomplete or corrupted storage
    if (!token || !encodedTenantId || !loginId || !role || !expiresAtStr) {
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
