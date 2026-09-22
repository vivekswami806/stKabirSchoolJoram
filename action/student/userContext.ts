import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchUserProfile } from "./userProfileContext";

interface Child {
  id: string;
  studentName: string;
  studentClass?: string;
  studentAdmissionNumber?: string;
  studentImage?: string;
  studentGender?: string;
  studentDateOfBirth?: string;
}

interface UserState {
  token: string | null;
  refreshToken: string | null;
  userDetail: any | null;

  role:
    | "PARENT"
    | "STAFF"
    | "ADMIN"
    | "TEACHER"
    | null;

  isLoggedIn: boolean;
  tenantId: string | null;
  expiresAt: number | null;
  forcePasswordChange: boolean | null;
  isProfileLoading: boolean;

  children: Child[];
}

const initialState: UserState = {
  token: null,
  refreshToken: null,
  userDetail: null,
  role: null,
  isLoggedIn: false,
  tenantId: null,
  expiresAt: null,
  forcePasswordChange: false,
  isProfileLoading: false,
  children: [],
};

export const userSlice = createSlice({
  name: "user",
  initialState,

  reducers: {
    authLoginSuccess(
      state,
      action: PayloadAction<{
        token: string;
        refreshToken?: string;
        role:
          | "PARENT"
          | "STAFF"
          | "ADMIN"
          | "TEACHER";
        tenantId: string;
        expiresIn: number;
        forcePasswordChange: boolean;
      }>
    ) {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      state.role = action.payload.role;
      state.tenantId = action.payload.tenantId;
      state.isLoggedIn = true;
      state.expiresAt =Date.now() + action.payload.expiresIn * 1000;
      state.forcePasswordChange = action.payload.forcePasswordChange;
    },

    rehydrateAuth(
      state,
      action: PayloadAction<{
        token: string;
        refreshToken?: string;
        expiresAt: number;
        tenantId: string;
        role: string;
      }>
    ) {
      state.token = action.payload.token;
      state.refreshToken =
        action.payload.refreshToken || null;
      state.expiresAt =
        action.payload.expiresAt;
      state.tenantId =
        action.payload.tenantId;

      state.role =
        action.payload.role as UserState["role"];

      state.isLoggedIn = true;
    },

    refreshToken(
      state,
      action: PayloadAction<{
        token: string;
        refreshToken?: string;
        expiresIn: number;
      }>
    ) {
      state.token = action.payload.token;

      if (action.payload.refreshToken) {
        state.refreshToken =
          action.payload.refreshToken;
      }

      state.expiresAt =
        Date.now() +
        action.payload.expiresIn * 1000;
    },

    // ? SELECTED CHILD INSIDE USER DETAIL
    setSelectedChild(
      state,
      action: PayloadAction<Child>
    ) {
      if (state.userDetail) {
        state.userDetail = action.payload;
      }
    },

    clearSelectedChild(state) {
      if (state.userDetail) {
        state.userDetail.selectedChild = null;
      }
    },

    logout(state) {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(
        fetchUserProfile.pending,
        (state) => {
          state.isProfileLoading = true;
        }
      )

      .addCase(
        fetchUserProfile.fulfilled,
        (state, action) => {
          state.userDetail =action.payload.data ?? action.payload;
          state.role =action.payload.role ?? state.role;
          state.tenantId = action.payload.tenant ?? state.tenantId;

          if ( action.payload.role === "PARENT" ) {
            state.children =Array.isArray( action.payload.data)? action.payload.data : [];
          }

          state.isProfileLoading = false;
          state.isLoggedIn = true;
        }
      )

      .addCase(
        fetchUserProfile.rejected,
        (state) => {
          state.isProfileLoading = false;
        }
      );
  },
});

export const {
  authLoginSuccess,
  logout,
  rehydrateAuth,
  refreshToken,
  setSelectedChild,
  clearSelectedChild,
} = userSlice.actions;

export default userSlice.reducer;