// userContext.ts (Updated Redux Slice)
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchUserProfile } from "./userProfileContext";

interface UserState {
  token: string | null;
  userDetail: any | null;
  role: "PARENT" | "STAFF" | "ADMIN" | null;
  isLoggedIn: boolean;
  tenantId: string | null;
  expiresAt: number | null; // Unix timestamp in milliseconds
  forcePasswordChange: boolean | null;
  isProfileLoading: boolean;
}

const initialState: UserState = {
  token: null,
  userDetail: null,
  role: null,
  isLoggedIn: false,
  tenantId: null,
  expiresAt: null,
  forcePasswordChange: null,
  isProfileLoading: false,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    authLoginSuccess(
      state,
      action: PayloadAction<{
        token: string;
        role: "PARENT" | "STAFF" | "ADMIN";
        tenantId: string;
        expiresIn: number;
        forcePasswordChange: boolean;
      }>
    ) {
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.tenantId = action.payload.tenantId;
      state.isLoggedIn = true;
      state.expiresAt = Date.now() + action.payload.expiresIn * 1000;
      state.forcePasswordChange = action.payload.forcePasswordChange;
    },

    rehydrateAuth(
      state,
      action: PayloadAction<{
        token: string;
        expiresAt: number; // Already an absolute timestamp
        tenantId: string;
        role: string;
      }>
    ) {
      state.token = action.payload.token;
      state.expiresAt = action.payload.expiresAt;
      state.tenantId = action.payload.tenantId;
      state.role = action.payload.role as UserState["role"];
      state.isLoggedIn = true;
    },

    logout(state) {
      return initialState;
    },

    // Action to handle token refresh
    refreshToken(
      state,
      action: PayloadAction<{
        token: string;
        expiresIn: number;
      }>
    ) {
      state.token = action.payload.token;
      state.expiresAt = Date.now() + action.payload.expiresIn * 1000;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isProfileLoading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.userDetail = action.payload.data ?? action.payload;
        state.role = action.payload.role ?? state.role;
        state.tenantId = action.payload.tenant ?? state.tenantId;
        state.isProfileLoading = false;
        state.isLoggedIn = true;
      })
      .addCase(fetchUserProfile.rejected, (state) => {
        state.isProfileLoading = false;
      });
  },
});

export const { authLoginSuccess, logout, rehydrateAuth, refreshToken } =
  userSlice.actions;
export default userSlice.reducer;