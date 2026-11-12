// loginHandler.ts
import { AuthCredentials, saveAuthCredentials } from "@/action/auth/authStorageServices";
import { AppDispatch } from "@/action/store";
import { authLoginSuccess } from "@/action/student/userContext";
import { fetchUserProfile } from "@/action/student/userProfileContext";
import { API_BASE_URL } from "@/config";
import axios from "axios";
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
  role: "PARENT" | "STAFF" | "ADMIN" | "TEACHER";
  staffId?: string;
  profile: any,
  requirePinSetup: boolean
  refreshToken: string
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

    const {token, expiresIn, forcePasswordChange, message, success, tenant, role, staffId, profile, requirePinSetup, refreshToken} = response.data;
      console.log("--res/data login|", response.data, response.data.forcePasswordChange);
    
    //  if(role == "STAFF" || role == "TEACHER") {
    //   if (forcePasswordChange || requirePinSetup ) {
    //     ToastService.show({
    //       type: "info",
    //       message: "Password Change Required ",
    //       duration: 3000,
    //       contentContainerStyle: { flex: 1 },
    //     });
        // router.replace('/(auth)/resetstaffpassword');
        // return;
    //   }
    //  } 
    //  else if (role == "PARENT") {
    //   if (forcePasswordChange || requirePinSetup ) {
    //     ToastService.show({
    //       type: "info",
    //       message: "Password Change Required ",
    //       duration: 3000,
    //       contentContainerStyle: { flex: 1 },
    //     });
    //     router.replace('/(auth)/resetStudentPassword')
    //     return;
    //   }
    //  }
   
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
      loginId: <string> staffId || profile.id || profile.staffId || "",
      role,
      expiresAt,
      refreshToken: refreshToken ? refreshToken: ""
    };
     console.log("authData| studentLogin|", authCredentials);

    await saveAuthCredentials(authCredentials);
    //  console.log("✓ Token saved to storage");
    await dispatch(fetchUserProfile()).unwrap();
    
    // 🧠 Redux: TOKEN ONLY (NO PROFILE HERE)
    dispatch(authLoginSuccess({token, refreshToken, role, tenantId: tenant, expiresIn, forcePasswordChange,}));
  
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


export const validateLoginForm = (formData: {[key: string]: string;}): {
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



// utils/loginHandler.ts
// import {
//   AuthCredentials,
//   saveAuthCredentials,
// } from "@/action/auth/authStorageServices";
// import { AppDispatch } from "@/action/store";
// import { authLoginSuccess } from "@/action/student/userContext";
// import { API_BASE_URL } from "@/config";
// import axios from "axios";
// import { router } from "expo-router";
// import { ToastService } from "react-native-toastier";

// interface LoginParams {
//   requestId?: string;
//   otp?: string;
//   mobileNumber?: string;
//   deviceId: string;
// }

// interface Child {
//   id: string;
//   studentName: string;
//   studentClass?: string;
//   studentAdmissionNumber?: string;
//   studentImage?: string;
//   studentGender?: string;
//   studentDateOfBirth?: string;
// }

// interface LoginResponse {
//   token: string;
//   refreshToken: string;
//   expiresIn: number;
//   message: string;
//   success: boolean;
//   tenant: string;
//   role: "PARENT" | "STAFF" | "ADMIN" | "TEACHER";
//   profile?: Child[];
//   // profile?: any;
// }

// export const handleOTPLogin = async (
//   loginParams: LoginParams,
//   dispatch: AppDispatch,
//   onSuccess?: () => void,
//   onError?: (error: string) => void
// ): Promise<void> => {
//   try {
//     const response = await axios.post<LoginResponse>(
//       `${API_BASE_URL}parent/auth/verify-otp`,
//       loginParams,
//       { timeout: 10000 }
//     );

//     const {
//       token,
//       refreshToken,
//       expiresIn,
//       message,
//       success,
//       tenant,
//       role,
//       profile,
//     } = response.data;
//     console.log("---response.data loginHandle|",);
    
//     if (!success || !token) {
//       const errorMsg = message || "Login failed";
//       ToastService.show({
//         type: "danger",
//         message: errorMsg,
//         duration: 3000,
//         contentContainerStyle: { flex: 1 },
//       });
//       onError?.(errorMsg);
//       return;
//     }

//     // 🔐 Save credentials with refresh token
//     const expiresAt = Date.now() + expiresIn * 1000;

//     const authCredentials: AuthCredentials = {
//       token,
//       refreshToken,
//       tenantId: tenant,
//       loginId: "",
//       role,
//       expiresAt,
//     };

//     await saveAuthCredentials(authCredentials);

//     // 🧠 Redux: Store auth data with profile
//     dispatch(
//       authLoginSuccess({
//         token,
//         refreshToken,
//         role,
//         tenantId: tenant,
//         expiresIn,
//         forcePasswordChange: false,
//         profile: profile || [],
//       })
//     );

//     // Navigate to child selection if multiple profile, else to home
//     if (profile && profile.length > 1) {
//       router.replace("/(auth)/SelectChild");
//     } else if (profile && profile.length === 1) {
//       dispatch({ type: "SET_SELECTED_CHILD", payload: profile[0] });
//       router.replace("/(tabs)/home");
//     } else {
//       router.replace("/(tabs)/home");
//     }

//     onSuccess?.();
//   } catch (error: any) {
//     const errorMessage =
//       error?.response?.data?.message ||
//       error?.message ||
//       "Login failed. Please try again.";

//     console.error("❌ OTP Login exception:", error);
//     ToastService.show({
//       type: "danger",
//       message: "Login failed",
//       duration: 3000,
//       contentContainerStyle: { flex: 1 },
//     });

//     onError?.(errorMessage);
//   }
// };

// export const validateLoginForm = (formData: {
//   [key: string]: string;
// }): {
//   isValid: boolean;
//   errors: { [key: string]: string };
//   cleanedData: { [key: string]: string };
// } => {
//   const errors: { [key: string]: string } = {};
//   const cleanedData: { [key: string]: string } = {};

//   Object.entries(formData).forEach(([field, value]) => {
//     const trimmedValue = value?.trim() ?? "";

//     cleanedData[field] = trimmedValue;

//     if (!trimmedValue) {
//       errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
//     }
//   });

//   return {
//     isValid: Object.keys(errors).length === 0,
//     errors,
//     cleanedData,
//   };
// };