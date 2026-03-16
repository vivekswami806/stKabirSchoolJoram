import { clearAuthStorage, getAuthCredentials } from "@/action/auth/authStorageServices";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { logout, rehydrateAuth } from "./userContext";
import { fetchUserProfile } from "./userProfileContext";

export const bootstrapAuth = createAsyncThunk(
  "user/bootstrap",
  async (_, { dispatch }) => {
    const creds = await getAuthCredentials();

    if (!creds) {
      dispatch(logout());
      return;
    }

    if (Date.now() >= creds.expiresAt) {
      await clearAuthStorage();
      dispatch(logout());
      return;
    }

    dispatch(rehydrateAuth(creds));
    await dispatch(fetchUserProfile());
  }
);
