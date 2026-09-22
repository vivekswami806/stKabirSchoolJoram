import { API_BASE_URL } from "@/config";
import { ROLE_CONFIG } from "@/helper/authRole.Map";
import { getDeviceId } from "@/helper/getDeviceId";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { getAuthCredentials } from "../auth/authStorageServices";

export const fetchUserProfile = createAsyncThunk(
  "user/fetchProfile",

  async (_, { rejectWithValue }) => {
    try {
      const credentials = await getAuthCredentials();

      if (!credentials) {
        throw new Error("No credentials");
      }

      const { token, role, tenantId, expiresAt } = credentials;

      // Token validation
      if (Date.now() >= expiresAt) { throw new Error("Token expired")};
      const deviceId = await getDeviceId();

      // =========================================================
      // STUDENT / PARENT
      // =========================================================
      if (role === "PARENT") {
        const response = await axios.get(`${API_BASE_URL}parent/children`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Tenant-ID": tenantId,
              "X-Device-ID": deviceId,
            },
          }
        );
        //  console.log("--- parent/children response ---", response.data);
        return {
          data: response.data,
          role,
          tenant: tenantId,
        };
      }

      // =========================================================
      // STAFF / ADMIN / TEACHER
      // =========================================================

      const apiRole = ROLE_CONFIG[role].apiRole;

      const response = await axios.get(`${API_BASE_URL}login-auth/${apiRole}/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "X-Device-ID": deviceId,
          },
        }
      );

      // console.log( `--- login-auth/${apiRole}/profile ---`,response.data);
      return {
        data: response?.data?.data,
        role,
        tenant: tenantId,
      };

    } catch (err: any) {
      console.error(" fetchUserProfile failed:",err?.response?.data || err);
      return rejectWithValue(err?.response?.data?.message ||"Profile fetch failed");
    }
  }
);
