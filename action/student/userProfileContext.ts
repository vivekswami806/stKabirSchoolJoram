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
      if (!credentials) throw "No credentials";

      const { token, role, tenantId, expiresAt } = credentials;

      if (Date.now() >= expiresAt) throw "Token expired";

      const apiRole = ROLE_CONFIG[role].apiRole;
       const deviceId = await getDeviceId();
          
      const response = await axios.get(
        `${API_BASE_URL}login-auth/${apiRole}/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            'X-Device-ID': deviceId
          },
        }
      );
      //  console.log("---response|login-auth/${apiRole}/profile|", response);
      
      return {
        data: response.data.data,
        role,
        tenant: tenantId,
      };
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Profile fetch failed"
      );
    }
  }
);

