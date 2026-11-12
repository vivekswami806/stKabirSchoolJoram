// import { ThemeContext } from "@/action/theme/ThemeContext";
// import { getDeviceId } from "@/helper/getDeviceId";
// import {
//   getContainerWidth,
//   getPhoneSize,
//   getResponsiveFontSize,
//   getResponsivePadding,
//   scaleFont,
//   scaleH,
//   scaleW,
// } from "@/utils/responsivedesignsystem";
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { router, useLocalSearchParams } from "expo-router";
// import React, { useContext, useState } from "react";
// import {
//   ActivityIndicator,
//   Animated,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useDispatch } from "react-redux";
// import { handleLogin, validateLoginForm } from "../../utils/loginHandler";

// export default function StaffLogin() {
//   const dispatch = useDispatch();
//   const { role } = useLocalSearchParams();
//   const roleParam = Array.isArray(role) ? role[0] : role;
//   const themeState = useContext(ThemeContext);
//   if (!themeState) return null;
//   const { theme } = themeState;
//   const styles = getStyles(theme);
//   const isDark = theme.mode === "dark";

//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [errors, setErrors] = useState<any>({});
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);

//   // Animation values
//   const [fadeAnim] = useState(new Animated.Value(0));
//   const [slideAnim] = useState(new Animated.Value(scaleH(50)));

//   React.useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, []);

//   const roleImages: any = {
//     studentlogin: require("../../assets/images/student.png"),
//     staffslogin: require("../../assets/images/staff.png"),
//     adminslogin: require("../../assets/images/admin.webp"),
//   };

//   const roleTitles: any = {
//     studentlogin: "Student Login",
//     staffslogin: "Staff Login",
//     adminslogin: "Admin Login",
//   };

//   const roleSubtitles: any = {
//     studentlogin: "Welcome back! Please login to continue",
//     staffslogin: "Access your staff portal",
//     adminslogin: "Administrator access",
//   };

//   const handleLoginPress = async () => {
//     const deviceId = await getDeviceId();
//     const { isValid, errors: validationErrors } = validateLoginForm({username, password,});

//     if (!isValid) {
//       setErrors(validationErrors);
//       return;
//     }

//     setErrors({});
//     setLoading(true);

//     let params = {
//       username: username,
//       password: password,
//       deviceId: deviceId,
//     };

//     try {
//       await handleLogin(
//         params,
//         "login-auth/staff/loginV2",
//         dispatch,
//         () => {
//           // Success callback
//         },
//         (error) => {
//           console.error("❌ Login failed:", error);
//           setLoading(false);
//         }
//       );
//     } catch (error) {
//       console.error("❌ Unexpected error:", error);
//       setLoading(false);
//     }
//   };

//   const handleBackPress = () => {
//     router.back();
//   };

//   return (
//     <LinearGradient
//       colors={[theme.background, theme.background]}
//       style={styles.container}
//     >
//       <KeyboardAvoidingView
//         style={styles.keyboardView}
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scrollContent}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//           bounces={false}
//         >
//           {/* Header Section */}
//           <Animated.View
//             style={[
//               styles.headerSection,
//               {
//                 opacity: fadeAnim,
//                 transform: [{ translateY: slideAnim }],
//               },
//             ]}
//           >
//             <View style={styles.imageContainer}>
//               <Image source={roleImages[roleParam]} style={styles.roleImage} />
//             </View>
//             <Text style={styles.welcomeText}>Welcome Back!</Text>
//             <Text style={styles.subtitle}>{roleSubtitles[roleParam]}</Text>
//           </Animated.View>

//           {/* Login Card */}
//           <Animated.View
//             style={[
//               styles.card,
//               {
//                 opacity: fadeAnim,
//                 transform: [{ translateY: slideAnim }],
//               },
//             ]}
//           >
//             <Text style={styles.cardTitle}>{roleTitles[roleParam]}</Text>

//             {/* Username Input */}
//             <View style={styles.inputContainer}>
//               <Text style={styles.label}>Username</Text>
//               <View
//                 style={[
//                   styles.inputWrapper,
//                   errors.username && styles.inputError,
//                 ]}
//               >
//                 <Ionicons
//                   name="person-outline"
//                   size={scaleFont(20)}
//                   color={errors.username ? "#e74c3c" : theme.primary}
//                   style={styles.icon}
//                 />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Enter your username"
//                   placeholderTextColor="#a0a0a0"
//                   value={username}
//                   onChangeText={(text) => {
//                     setUsername(text);
//                     if (errors.username) setErrors({ ...errors, username: "" });
//                   }}
//                   editable={!loading}
//                   autoCapitalize="none"
//                 />
//               </View>
//               {errors.username && (
//                 <Text style={styles.errorText}>{errors.username}</Text>
//               )}
//             </View>

//             {/* Password Input */}
//             <View style={styles.inputContainer}>
//               <Text style={styles.label}>Password</Text>
//               <View
//                 style={[
//                   styles.inputWrapper,
//                   errors.password && styles.inputError,
//                 ]}
//               >
//                 <Ionicons
//                   name="lock-closed-outline"
//                   size={scaleFont(20)}
//                   color={errors.password ? "#e74c3c" : theme.primary}
//                   style={styles.icon}
//                 />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Enter your password"
//                   placeholderTextColor="#a0a0a0"
//                   secureTextEntry={!showPassword}
//                   value={password}
//                   onChangeText={(text) => {
//                     setPassword(text);
//                     if (errors.password)
//                       setErrors({ ...errors, password: "" });
//                   }}
//                   editable={!loading}
//                 />
//                 <TouchableOpacity
//                   onPress={() => setShowPassword(!showPassword)}
//                   disabled={loading}
//                   style={styles.eyeIcon}
//                 >
//                   <Ionicons
//                     name={showPassword ? "eye-off-outline" : "eye-outline"}
//                     size={scaleFont(20)}
//                     color={theme.primary}
//                   />
//                 </TouchableOpacity>
//               </View>
//               {errors.password && (
//                 <Text style={styles.errorText}>{errors.password}</Text>
//               )}
//             </View>

//             {/* Login Button */}
//             <TouchableOpacity
//               style={[styles.button, loading && styles.buttonDisabled]}
//               onPress={handleLoginPress}
//               disabled={loading}
//               activeOpacity={0.8}
//             >
//               <LinearGradient
//                 colors={
//                   loading
//                     ? [theme.primary, theme.primary]
//                     : [theme.primary, theme.primary]
//                 }
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 0 }}
//                 style={styles.buttonGradient}
//               >
//                 {loading ? (
//                   <View style={styles.loaderContainer}>
//                     <ActivityIndicator color="#fff" size="small" />
//                     <Text style={styles.buttonText}>Logging in...</Text>
//                   </View>
//                 ) : (
//                   <Text style={styles.buttonText}>Login</Text>
//                 )}
//               </LinearGradient>
//             </TouchableOpacity>

//             {loading && (
//               <View style={styles.loadingInfo}>
//                 <ActivityIndicator color={theme.primary} size="small" />
//                 <Text style={styles.infoText}>
//                   Fetching your profile data...
//                 </Text>
//               </View>
//             )}
//           </Animated.View>

//           {/* Footer */}
//           <View style={styles.footer}>
//             <TouchableOpacity
//               onPress={handleBackPress}
//               disabled={loading}
//               style={styles.footerButton}
//             >
//               <Ionicons
//                 name="arrow-back"
//                 size={scaleFont(16)}
//                 color={theme.primary}
//               />
//               <Text style={styles.footerText}>Back</Text>
//             </TouchableOpacity>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </LinearGradient>
//   );
// }

// const getStyles = (theme: any) => {
//   const isDark = theme.mode === "dark";
//   const padding = getResponsivePadding();
//   const fonts = getResponsiveFontSize();
//   const containerWidth = getContainerWidth();
//   const phoneSize = getPhoneSize();

//   return StyleSheet.create({
//     container: {
//       flex: 1,
//     },

//     keyboardView: {
//       flex: 1,
//       width: "100%",
//     },

//     scrollContent: {
//       flexGrow: 1,
//       paddingHorizontal: padding.md,
//       paddingTop: scaleH(
//         Platform.OS === "ios"
//           ? phoneSize === "XS"
//             ? 30
//             : 60
//           : phoneSize === "XS"
//           ? 20
//           : 40
//       ),
//       paddingBottom: padding.xl,
//     },

//     headerSection: {
//       alignItems: "center",
//       marginBottom: scaleH(30),
//       width: "100%",
//       maxWidth: containerWidth,
//       alignSelf: "center",
//     },

//     imageContainer: {
//       width: scaleW(phoneSize === "XS" ? 80 : 120),
//       height: scaleW(phoneSize === "XS" ? 80 : 120),
//       borderRadius: scaleW(phoneSize === "XS" ? 40 : 60),
//       backgroundColor: theme.background,
//       justifyContent: "center",
//       alignItems: "center",
//       marginBottom: scaleH(20),
//     },

//     roleImage: {
//       width: scaleW(phoneSize === "XS" ? 60 : 80),
//       height: scaleW(phoneSize === "XS" ? 60 : 80),
//       resizeMode: "contain",
//     },

//     welcomeText: {
//       fontSize: fonts.h2,
//       fontWeight: "700",
//       color: theme.primary,
//       marginBottom: scaleH(8),
//       textAlign: "center",
//     },

//     subtitle: {
//       fontSize: fonts.body,
//       color: theme.primary,
//       textAlign: "center",
//       paddingHorizontal: padding.md,
//     },

//     card: {
//       backgroundColor: theme.card,
//       borderRadius: scaleW(24),
//       padding: padding.lg,
//       width: "100%",
//       maxWidth: containerWidth,
//       alignSelf: "center",
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: scaleH(10) },
//       shadowOpacity: isDark ? 0.4 : 0.25,
//       shadowRadius: scaleW(20),
//       elevation: 15,
//       marginVertical: scaleH(20),
//     },

//     cardTitle: {
//       fontSize: fonts.h3,
//       fontWeight: "700",
//       color: theme.primary,
//       marginBottom: scaleH(24),
//       textAlign: "center",
//     },

//     inputContainer: {
//       marginBottom: scaleH(20),
//     },

//     label: {
//       fontSize: fonts.small,
//       fontWeight: "600",
//       color: theme.textSecondary,
//       marginBottom: scaleH(8),
//       marginLeft: scaleW(4),
//     },

//     inputWrapper: {
//       flexDirection: "row",
//       alignItems: "center",
//       borderWidth: 2,
//       borderColor: theme.border || theme.primary,
//       borderRadius: scaleW(12),
//       paddingHorizontal: padding.md,
//       height: scaleH(48),
//       backgroundColor: theme.background,
//     },

//     inputError: {
//       borderColor: theme.primary,
//     },

//     icon: {
//       marginRight: padding.sm,
//       color: theme.primary,
//     },

//     input: {
//       flex: 1,
//       fontSize: fonts.body,
//       color: theme.text,
//       paddingVertical: 0,
//     },

//     eyeIcon: {
//       padding: scaleW(4),
//     },

//     errorText: {
//       color: theme.errorColor,
//       fontSize: fonts.tiny,
//       marginTop: scaleH(6),
//       marginLeft: scaleW(4),
//       fontWeight: "500",
//     },

//     button: {
//       borderRadius: scaleW(12),
//       overflow: "hidden",
//       marginTop: scaleH(8),
//       minHeight: scaleH(48),
//     },

//     buttonDisabled: {
//       opacity: 0.7,
//     },

//     buttonGradient: {
//       paddingVertical: scaleH(16),
//       alignItems: "center",
//       justifyContent: "center",
//       minHeight: scaleH(48),
//     },

//     buttonText: {
//       color: theme.buttonText,
//       fontSize: fonts.body,
//       fontWeight: "700",
//       letterSpacing: 0.5,
//     },

//     loaderContainer: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "center",
//       gap: padding.md,
//     },

//     loadingInfo: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "center",
//       marginTop: scaleH(16),
//       gap: padding.sm,
//     },

//     infoText: {
//       color: theme.primary,
//       fontSize: fonts.small,
//       fontStyle: "italic",
//     },

//     footer: {
//       marginTop: scaleH(24),
//       alignItems: "center",
//     },

//     footerButton: {
//       flexDirection: "row",
//       alignItems: "center",
//       gap: padding.sm,
//       paddingVertical: scaleH(12),
//       paddingHorizontal: padding.lg,
//     },

//     footerText: {
//       color: theme.primary,
//       fontSize: fonts.body,
//       fontWeight: "600",
//     },
//   });
// };



import { useAppDispatch } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { handleLogin } from "@/utils/loginHandler";
import {
  getContainerWidth,
  getPhoneSize,
  getResponsiveFontSize,
  getResponsivePadding,
  scaleFont,
  scaleH,
  scaleW,
} from "@/utils/responsivedesignsystem";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function StaffLogin() {
  const themeState = useContext(ThemeContext);

  if (!themeState) return null;

  const { theme } = themeState;
  const styles = getStyles(theme);

  const dispatch = useAppDispatch();

  const { role } = useLocalSearchParams();
  const roleParam = Array.isArray(role)
    ? role[0]
    : role || "staffslogin";

  // --------------------------------------------------
  // Form state
  // --------------------------------------------------

  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");

  const [errors, setErrors] = useState<{
    [key: string]: string;
  }>({});

  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // OTP flow state
  // --------------------------------------------------

  const [step, setStep] = useState<"mobile" | "otp">("mobile");

  const [requestId, setRequestId] = useState("");

  const [otpTimer, setOtpTimer] = useState(0);

  const [deviceId, setDeviceId] = useState("");

  // --------------------------------------------------
  // Animation
  // --------------------------------------------------

  const [fadeAnim] = useState(new Animated.Value(0));

  const [slideAnim] = useState(
    new Animated.Value(scaleH(50))
  );

  // --------------------------------------------------
  // Initial setup
  // --------------------------------------------------

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Get device ID
    getDeviceId().then(setDeviceId);
  }, []);

  // --------------------------------------------------
  // OTP Timer
  // --------------------------------------------------

  React.useEffect(() => {
    if (otpTimer > 0) {
      const interval = setTimeout(() => {
        setOtpTimer((previous) => previous - 1);
      }, 1000);

      return () => clearTimeout(interval);
    }
  }, [otpTimer]);

  // --------------------------------------------------
  // Role configuration
  // --------------------------------------------------

  const roleImages: any = {
    studentlogin: require("../../assets/images/student.png"),
    staffslogin: require("../../assets/images/staff.png"),
    adminslogin: require("../../assets/images/admin.webp"),
  };

  const roleTitles: any = {
    studentlogin: "Student Login",
    staffslogin: "Staff Login",
    adminslogin: "Admin Login",
  };

  const roleSubtitles: any = {
    studentlogin: "Welcome back! Please login to continue",
    staffslogin: "Access your staff portal",
    adminslogin: "Administrator access",
  };

  // --------------------------------------------------
  // Request Staff OTP
  // --------------------------------------------------

  const handleRequestOTP = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      setErrors({
        mobileNumber: "Enter valid 10-digit mobile number",
      });

      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(
        `${API_BASE_URL}staff/auth/request-otp`,
        {
          mobileNumber,
          deviceId,
        }
      );

      console.log(
        "Staff request OTP response:",
        response.data
      );

      if (response.data.success) {
        setRequestId(response.data.requestId);

        setOtpTimer(
          response.data.expiresIn || 300
        );

        setOtp("");

        setStep("otp");
      } else {
        setErrors({
          mobileNumber:
            response.data.message ||
            "Failed to send OTP",
        });
      }
    } catch (error: any) {
      console.error(
        "❌ Staff OTP Request failed:",
        error
      );

      setErrors({
        mobileNumber:
          error.response?.data?.message ||
          "Failed to send OTP. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Verify Staff OTP
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 4) {
      setErrors({
        otp: "Enter valid 4-digit OTP",
      });

      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const params = {
        requestId,
        otp,
        deviceId,
      };

      console.log( "Staff OTP verification:", params );

      await handleLogin( params,"staff/auth/verify-otp", dispatch,  () => {
          // Success callback
          //
          // Your AuthGate / authentication
          // logic can redirect automatically.
        },

        (error) => {
          console.error("❌ Staff OTP verification failed:", error);
          setLoading(false);
          setErrors({ otp :"Invalid OTP. Please try again." });
        }
      );
    } catch (error: any) {
      console.error("❌ Staff OTP Verification failed:", error);

      setErrors({
        otp: "Failed to verify OTP. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Resend OTP
  // --------------------------------------------------

  const handleResendOTP = async () => {
    setOtp("");

    await handleRequestOTP();
  };

  // --------------------------------------------------
  // Back button
  // --------------------------------------------------

  const handleBackPress = () => {
    if (step === "otp") {
      setStep("mobile");
      setRequestId("");
      setOtp("");
      setOtpTimer(0);
      setErrors({});
    } else {
      router.back();
    }
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <LinearGradient
      colors={[theme.background, theme.background]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.headerSection,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim,
                  },
                ],
              },
            ]}
          >
            <View style={styles.imageContainer}>
              <Image
                source={roleImages[roleParam]}
                style={styles.roleImage}
              />
            </View>

            <Text style={styles.welcomeText}>
              Welcome Back!
            </Text>

            <Text style={styles.subtitle}>
              {roleSubtitles[roleParam]}
            </Text>
          </Animated.View>

          {/* Login Card */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim,
                  },
                ],
              },
            ]}
          >
            <Text style={styles.cardTitle}>
              {roleTitles[roleParam]}
            </Text>

            {/* ======================================
                STEP 1 - MOBILE NUMBER
            ====================================== */}

            {step === "mobile" ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Mobile Number
                  </Text>

                  <View
                    style={[
                      styles.inputWrapper,
                      errors.mobileNumber &&
                        styles.inputError,
                    ]}
                  >
                    <Ionicons
                      name="call-outline"
                      size={scaleFont(20)}
                      color={theme.primary}
                      style={styles.icon}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="Enter your mobile number"
                      placeholderTextColor={
                        theme.textSecondary
                      }
                      value={mobileNumber}
                      onChangeText={(text) => {
                        const cleanedText =
                          text.replace(
                            /[^0-9]/g,
                            ""
                          );

                        setMobileNumber(
                          cleanedText
                        );

                        if (
                          errors.mobileNumber
                        ) {
                          setErrors({
                            ...errors,
                            mobileNumber: "",
                          });
                        }
                      }}
                      keyboardType="phone-pad"
                      editable={!loading}
                      maxLength={10}
                    />
                  </View>

                  {errors.mobileNumber && (
                    <Text
                      style={styles.errorText}
                    >
                      {errors.mobileNumber}
                    </Text>
                  )}
                </View>

                {/* Request OTP */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    loading &&
                      styles.buttonDisabled,
                  ]}
                  onPress={
                    handleRequestOTP
                  }
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[
                      theme.primary,
                      theme.primary,
                    ]}
                    start={{
                      x: 0,
                      y: 0,
                    }}
                    end={{
                      x: 1,
                      y: 0,
                    }}
                    style={
                      styles.buttonGradient
                    }
                  >
                    {loading ? (
                      <View
                        style={
                          styles.loaderContainer
                        }
                      >
                        <ActivityIndicator
                          color="#fff"
                          size="small"
                        />

                        <Text
                          style={
                            styles.buttonText
                          }
                        >
                          Sending OTP...
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={
                          styles.buttonText
                        }
                      >
                        Request OTP
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              /* ======================================
                 STEP 2 - OTP
              ====================================== */

              <>
                <View
                  style={
                    styles.inputContainer
                  }
                >
                  <Text style={styles.label}>
                    Enter OTP
                  </Text>

                  <Text
                    style={
                      styles.otpSubtext
                    }
                  >
                    We've sent a 4-digit OTP to{" "}
                    {mobileNumber}
                  </Text>

                  <View
                    style={[
                      styles.inputWrapper,
                      errors.otp &&
                        styles.inputError,
                    ]}
                  >
                    <Ionicons
                      name="key-outline"
                      size={scaleFont(20)}
                      color={theme.primary}
                      style={styles.icon}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="0000"
                      placeholderTextColor={
                        theme.textSecondary
                      }
                      value={otp}
                      onChangeText={(text) => {
                        const cleanedText =
                          text
                            .replace(
                              /[^0-9]/g,
                              ""
                            )
                            .slice(0, 4);

                        setOtp(cleanedText);

                        if (errors.otp) {
                          setErrors({
                            ...errors,
                            otp: "",
                          });
                        }
                      }}
                      keyboardType="number-pad"
                      editable={!loading}
                      maxLength={4}
                    />
                  </View>

                  {errors.otp && (
                    <Text
                      style={styles.errorText}
                    >
                      {errors.otp}
                    </Text>
                  )}
                </View>

                {/* Resend OTP */}
                <View
                  style={
                    styles.resendContainer
                  }
                >
                  {otpTimer > 0 ? (
                    <Text
                      style={styles.timerText}
                    >
                      Resend OTP in{" "}
                      {otpTimer}s
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={
                        handleResendOTP
                      }
                      disabled={loading}
                    >
                      <Text
                        style={
                          styles.resendText
                        }
                      >
                        Resend OTP
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Verify OTP */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    loading &&
                      styles.buttonDisabled,
                  ]}
                  onPress={
                    handleVerifyOTP
                  }
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[
                      theme.primary,
                      theme.primary,
                    ]}
                    start={{
                      x: 0,
                      y: 0,
                    }}
                    end={{
                      x: 1,
                      y: 0,
                    }}
                    style={
                      styles.buttonGradient
                    }
                  >
                    {loading ? (
                      <View
                        style={
                          styles.loaderContainer
                        }
                      >
                        <ActivityIndicator
                          color="#fff"
                          size="small"
                        />

                        <Text
                          style={
                            styles.buttonText
                          }
                        >
                          Verifying...
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={
                          styles.buttonText
                        }
                      >
                        Verify OTP
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleBackPress}
              disabled={loading}
              style={styles.footerButton}
            >
              <Ionicons
                name="arrow-back"
                size={scaleFont(16)}
                color={theme.primary}
              />

              <Text
                style={styles.footerText}
              >
                {step === "otp"
                  ? "Change Number"
                  : "Back"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ======================================================
// STYLES
// ======================================================

const getStyles = (theme: any) => {
  const padding = getResponsivePadding();
  const fonts = getResponsiveFontSize();
  const containerWidth =
    getContainerWidth();
  const phoneSize = getPhoneSize();

  return StyleSheet.create({
    container: {
      flex: 1,
    },

    keyboardView: {
      flex: 1,
      width: "100%",
    },

    scrollContent: {
      flexGrow: 1,

      paddingHorizontal:
        padding.md,

      paddingTop: scaleH(
        Platform.OS === "ios"
          ? phoneSize === "XS"
            ? 30
            : 60
          : phoneSize === "XS"
          ? 20
          : 40
      ),

      paddingBottom: padding.xl,
    },

    headerSection: {
      alignItems: "center",

      marginBottom: scaleH(10),

      width: "100%",

      maxWidth: containerWidth,

      alignSelf: "center",
    },

    imageContainer: {
      width: scaleW(
        phoneSize === "XS"
          ? 80
          : 120
      ),

      height: scaleW(
        phoneSize === "XS"
          ? 80
          : 120
      ),

      borderRadius: scaleW(
        phoneSize === "XS"
          ? 40
          : 60
      ),

      backgroundColor:
        theme.background,

      justifyContent: "center",

      alignItems: "center",

      marginBottom: scaleH(20),
    },

    roleImage: {
      width: scaleW(
        phoneSize === "XS"
          ? 60
          : 80
      ),

      height: scaleW(
        phoneSize === "XS"
          ? 60
          : 80
      ),

      resizeMode: "contain",
    },

    welcomeText: {
      fontSize: fonts.h2,

      fontWeight: "700",

      color: theme.primary,

      marginBottom: scaleH(8),

      textAlign: "center",
    },

    subtitle: {
      fontSize: fonts.body,

      color: theme.primary,

      textAlign: "center",

      paddingHorizontal:
        padding.md,
    },

    card: {
      backgroundColor:
        theme.card,

      borderRadius: scaleW(24),

      padding: padding.lg,

      width: "100%",

      maxWidth: containerWidth,

      alignSelf: "center",

      shadowColor: theme.primary,

      shadowOffset: {
        width: 0,
        height: scaleH(10),
      },

      shadowOpacity:
        theme.mode === "dark"
          ? 0.4
          : 0.25,

      shadowRadius:
        scaleW(20),

      elevation: 15,

      marginVertical:
        scaleH(20),
    },

    cardTitle: {
      fontSize: fonts.h3,

      fontWeight: "700",

      color: theme.primary,

      marginBottom:
        scaleH(24),

      textAlign: "center",
    },

    inputContainer: {
      marginBottom:
        scaleH(16),
    },

    label: {
      fontSize: fonts.small,

      fontWeight: "600",

      color:
        theme.textSecondary,

      marginBottom:
        scaleH(8),

      marginLeft:
        scaleW(4),
    },

    otpSubtext: {
      fontSize: fonts.tiny,

      color:
        theme.textSecondary,

      marginBottom:
        scaleH(8),

      marginLeft:
        scaleW(4),
    },

    inputWrapper: {
      flexDirection: "row",

      alignItems: "center",

      borderWidth: 2,

      borderColor:
        theme.border ||
        theme.primary,

      borderRadius:
        scaleW(12),

      paddingHorizontal:
        padding.md,

      height: scaleH(48),

      backgroundColor:
        theme.background,
    },

    inputError: {
      borderColor:
        theme.errorColor ||
        "#FF6B6B",
    },

    icon: {
      marginRight:
        padding.sm,

      color: theme.primary,
    },

    input: {
      flex: 1,

      fontSize: fonts.body,

      color: theme.text,

      paddingVertical: 0,
    },

    errorText: {
      color:
        theme.errorColor ||
        "#FF6B6B",

      fontSize: fonts.tiny,

      marginTop:
        scaleH(6),

      marginLeft:
        scaleW(4),

      fontWeight: "500",
    },

    button: {
      borderRadius:
        scaleW(12),

      overflow: "hidden",

      minHeight:
        scaleH(48),

      marginVertical:
        scaleH(12),
    },

    buttonDisabled: {
      opacity: 0.7,
    },

    buttonGradient: {
      paddingVertical:
        scaleH(16),

      alignItems: "center",

      justifyContent: "center",

      backgroundColor:
        theme.primary,

      minHeight:
        scaleH(48),
    },

    buttonText: {
      color:
        theme.buttonText ||
        "#fff",

      fontSize: fonts.body,

      fontWeight: "700",

      letterSpacing: 0.5,
    },

    loaderContainer: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "center",

      gap: padding.md,
    },

    resendContainer: {
      alignItems: "center",

      marginVertical:
        scaleH(12),
    },

    timerText: {
      color: theme.primary,

      fontSize: fonts.small,

      fontWeight: "500",
    },

    resendText: {
      color: theme.primary,

      fontSize: fonts.small,

      fontWeight: "600",

      textDecorationLine:
        "underline",
    },

    footer: {
      marginTop:
        scaleH(24),

      alignItems: "center",
    },

    footerButton: {
      flexDirection: "row",

      alignItems: "center",

      gap: padding.sm,

      paddingVertical:
        scaleH(12),

      paddingHorizontal:
        padding.lg,
    },

    footerText: {
      color: theme.primary,

      fontSize: fonts.body,

      fontWeight: "600",
    },
  });
};
