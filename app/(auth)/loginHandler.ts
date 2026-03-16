// loginHandler.ts
import {
  AuthCredentials,
  saveAuthCredentials,
} from "@/action/auth/authStorageServices";
import { AppDispatch } from "@/action/store";
import { authLoginSuccess } from "@/action/student/userContext";
import { fetchUserProfile } from "@/action/student/userProfileContext";
import { API_BASE_URL } from "@/config";
import axios from "axios";
import { router } from "expo-router";
import { ToastService } from "react-native-toastier";

interface LoginParams {
  mobile?: string;
  admissionNo?: string;
  username?: string;
  pin?: string;
  password?: string;
  deviceId: string;
}

interface LoginResponse {
  token: string;
  expiresIn: number;
  forcePasswordChange: boolean;
  message?: string;
  success: boolean;
  tenant: string;
  role: "PARENT" | "STAFF" | "ADMIN";
  staffId?: string;
  profile: any,
  requirePinSetup: boolean
}

export const handleLogin = async (
  loginParams: LoginParams,
  apiEndpoint: string,
  dispatch: AppDispatch,
  onSuccess?: () => void,
  onError?: (error: string) => void
): Promise<void> => {
  try {
    // console.log("🔐 Initiating login...");

    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}${apiEndpoint}`,
      loginParams,
      { timeout: 10000 }
    );

    const {
      token,
      expiresIn,
      forcePasswordChange,
      message,
      success,
      tenant,
      role,
      staffId,
      profile,
      requirePinSetup
    } = response.data;
    //  console.log("--res/data login|", response);
    
     if(role == "STAFF") {
      if (forcePasswordChange || requirePinSetup ) {
        ToastService.show({
          type: "info",
          message: "Password Change Required ",
          duration: 3000,
          contentContainerStyle: { flex: 1 },
        });
        router.replace('/staffDashboard/resetstaffpassword')
      }
     } else if (role == "PARENT") {
      if (forcePasswordChange || requirePinSetup ) {
        ToastService.show({
          type: "info",
          message: "Password Change Required ",
          duration: 3000,
          contentContainerStyle: { flex: 1 },
        });
        router.replace('/(auth)/resetStudentPassword')
        return;
      }
     }
   
    if (!success || !token) {
      const errorMsg = message || "Login failed";
      ToastService.show({
        type: "danger",
        message: message,
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
      onError?.(errorMsg);
      return;
    }

    // 🔐 Save credentials
    const expiresAt = Date.now() + expiresIn * 1000;

    const authCredentials: AuthCredentials = {
      token,
      tenantId: tenant,
      loginId: <string> staffId || profile.id || profile.staffId,
      role,
      expiresAt,
    };

    await saveAuthCredentials(authCredentials);
    // console.log("✓ Token saved to storage");
    await dispatch(fetchUserProfile()).unwrap();
    
    // 🧠 Redux: TOKEN ONLY (NO PROFILE HERE)
    dispatch(
      authLoginSuccess({
        token,
        role,
        tenantId: tenant,
        expiresIn,
        forcePasswordChange,
      })
    );
  
    onSuccess?.();
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Login failed. Please try again.";

    console.error("❌ Login exception:", error);
    ToastService.show({
      type: "danger",
      message: "Login failed",
      duration: 3000,
      contentContainerStyle: { flex: 1 },
    });
    
    onError?.(errorMessage);
  }
};


export const validateLoginForm = (formData: {
  [key: string]: string;
}): {
  isValid: boolean;
  errors: { [key: string]: string };
  cleanedData: { [key: string]: string };
} => {
  const errors: { [key: string]: string } = {};
  const cleanedData: { [key: string]: string } = {};

  Object.entries(formData).forEach(([field, value]) => {
    const trimmedValue = value?.trim() ?? "";

    cleanedData[field] = trimmedValue;

    if (!trimmedValue) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    cleanedData,
  };
};
