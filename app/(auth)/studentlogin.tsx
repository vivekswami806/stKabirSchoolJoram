// screens/auth/StudentLogin.tsx
import { useAppDispatch } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { getDeviceId } from "@/helper/getDeviceId";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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
import { handleLogin, validateLoginForm } from "./loginHandler";
const { width } = Dimensions.get("window");
export default function StudentLogin() {

  const themeState = useContext(ThemeContext);
if (!themeState) return null;
const { theme } = themeState;
const styles = getStyles(theme);
const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();
  const { role } = useLocalSearchParams();
  const roleParam = Array.isArray(role) ? role[0] : role || "studentlogin";
  // Form state
  const [mobileNumber, setMobileNumber] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
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
  }, []);

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
  const handleLoginPress = async () => {
    const { isValid, errors: validationErrors } = validateLoginForm({
      mobileNumber,
      admissionNumber,
      password,
    });

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // let params = {
      //   "mobile": "9876543215",
      //   "admissionNo": "BRS/005/Class1/11-11-2025",
      //   "pin": "4327",
      //   "deviceId": await getDeviceId()
      // };

      //    let params = {
      //   "mobile": "9090909098",  // 2003-01-27
      //   "admissionNo": "ADM-2026-990225", ADM-2026-336400
      //   "pin": "4328",
      //   "deviceId": await getDeviceId()
      // };
      let params = {
        "mobile": mobileNumber,
        "admissionNo": admissionNumber,
        "pin": password,
        "deviceId": await getDeviceId()
      };

      await handleLogin(
        params,
        "login-auth/parent/loginV2",
        dispatch,
        () => {
          // Success callback
          // console.log("✓ Login and profile fetch successful");
          // AuthGate will automatically redirect to home
          // No need to navigate here
        },
        (error) => {
          // Error callback
          console.error("❌ Login failed:", error);
          setLoading(false); // Allow user to retry
        }
      );
    } catch (error) {
      console.error("❌ Unexpected error:", error);
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    router.push("/resetStudentPassword");
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <LinearGradient
      colors={isDark
        ? ["#0f172a", "#1e293b", "#111827"]
        : ["#EC4899", "#EC4899", "#EC4899"]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <Animated.View
            style={[
              styles.headerSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.imageContainer}>
              <Image source={roleImages[roleParam]} style={styles.roleImage} />
            </View>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.subtitle}>{roleSubtitles[roleParam]}</Text>
          </Animated.View>

          {/* Login Card */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.cardTitle}>{roleTitles[roleParam]}</Text>

            {/* Mobile Number Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mobile Number</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.mobileNumber && styles.inputError,
                ]}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={errors.mobileNumber ? "#e74c3c" : "#667eea"}
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your mobile number"
                  placeholderTextColor="#a0a0a0"
                  value={mobileNumber}
                  onChangeText={(text) => {
                    setMobileNumber(text);
                    if (errors.mobileNumber)
                      setErrors({ ...errors, mobileNumber: "" });
                  }}
                  keyboardType="phone-pad"
                  editable={!loading}
                  maxLength={10}
                />
              </View>
              {errors.mobileNumber && (
                <Text style={styles.errorText}>{errors.mobileNumber}</Text>
              )}
            </View>

            {/* Admission Number Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Admission Number</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.admissionNumber && styles.inputError,
                ]}
              >
                <Ionicons
                  name="id-card-outline"
                  size={20}
                  color={errors.admissionNumber ? "#e74c3c" : "#667eea"}
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter admission number"
                  placeholderTextColor="#a0a0a0"
                  value={admissionNumber}
                  onChangeText={(text) => {
                    setAdmissionNumber(text);
                    if (errors.admissionNumber)
                      setErrors({ ...errors, admissionNumber: "" });
                  }}
                  editable={!loading}
                  autoCapitalize="characters"
                />
              </View>
              {errors.admissionNumber && (
                <Text style={styles.errorText}>{errors.admissionNumber}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.password && styles.inputError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={errors.password ? "#e74c3c" : "#667eea"}
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#a0a0a0"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: "" });
                  }}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#667eea"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={loading}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLoginPress}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  loading
                    ? ["#a0a0a0", "#808080"]
                    : ["#f9a8d4", "#f9a8d4"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.buttonText}>Logging in...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {loading && (
              <View style={styles.loadingInfo}>
                <ActivityIndicator color="#667eea" size="small" />
                <Text style={styles.infoText}>
                  Fetching your profile data...
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleBackPress}
              disabled={loading}
              style={styles.footerButton}
            >
              <Ionicons name="arrow-back" size={16} color="#fff" />
              <Text style={styles.footerText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
const getStyles = (theme: any) => {
  const isDark = theme.mode === "dark";

  const colors = {
    card: isDark ? "#1e293b" : "#ffffff",
    textPrimary: isDark ? "#F472B6" : "#333",
    textSecondary: isDark ? "#FBCFE8" : "#555",
    inputBg: isDark ? "#334155" : "#fff0f6",
    inputBorder: isDark ? "#475569" : "#f9a8d4",
    placeholder: isDark ? "#94a3b8" : "#9ca3af",
    infoText: "#EC4899",
    errorBg: isDark ? "#3f1d1d" : "#fff5f7",
    gradientButton: ["#EC4899", "#DB2777"],
  };

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
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "ios" ? 60 : 40,
      paddingBottom: 30,
    },

    headerSection: {
      alignItems: "center",
      marginBottom: 10,
    },

    imageContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },

    roleImage: {
      width: 80,
      height: 80,
      resizeMode: "contain",
    },

    welcomeText: {
      fontSize: 32,
      fontWeight: "700",
      color: "#fff",
      marginBottom: 8,
    },

    subtitle: {
      fontSize: 16,
      color: "rgba(255,255,255,0.85)",
      textAlign: "center",
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 28,
      width: "100%",
      maxWidth: 440,
      alignSelf: "center",
      shadowColor: "#EC4899",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.4 : 0.25,
      shadowRadius: 20,
      elevation: 15,
    },

    cardTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: "#EC4899",
      marginBottom: 24,
      textAlign: "center",
    },

    inputContainer: {
      marginBottom: 10,
    },

    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 8,
      marginLeft: 4,
    },

    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.inputBg,
      height: 50,
    },

    inputError: {
      borderColor: "#EF4444",
      backgroundColor: colors.errorBg,
    },

    icon: {
      marginRight: 12,
      color: "#EC4899",
    },

    input: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
      paddingVertical: 0,
    },

    eyeIcon: {
      padding: 4,
    },

    errorText: {
      color: "#EF4444",
      fontSize: 12,
      marginTop: 6,
      marginLeft: 4,
      fontWeight: "500",
    },

    forgotPassword: {
      alignSelf: "flex-end",
      marginBottom: 24,
      marginTop: -8,
    },

    forgotPasswordText: {
      color: "#EC4899",
      fontSize: 14,
      fontWeight: "600",
    },

    button: {
      borderRadius: 12,
      overflow: "hidden",
    },

    buttonDisabled: {
      opacity: 0.7,
    },

    buttonGradient: {
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#EC4899",
    },

    buttonText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: 0.5,
    },

    loaderContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },

    loadingInfo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 16,
      gap: 8,
    },

    infoText: {
      color: colors.infoText,
      fontSize: 13,
      fontStyle: "italic",
    },

    footer: {
      marginTop: 24,
      alignItems: "center",
    },

    footerButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },

    footerText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
    },
  });
};

// const getStyles = (theme: any) => {
//   const isDark = theme.mode === "dark";

//   const colors = {
//     card: isDark ? "#1e293b" : "#EC4899",
//     textPrimary: isDark ? "#EC4899" : "#333",
//     textSecondary: isDark ? "#cbd5e1" : "#555",
//     inputBg: isDark ? "#334155" : "#f8f9fa",
//     inputBorder: isDark ? "#475569" : "#e0e0e0",
//     placeholder: isDark ? "#94a3b8" : "#a0a0a0",
//     infoText: isDark ? "#EC4899" : "#EC4899",
//     errorBg: isDark ? "#3f1d1d" : "#fff5f5",
//     gradientButton: isDark
//       ? ["#06b6d4", "#0891b2"]
//       : ["#667eea", "#764ba2"],
//   };

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
//       paddingHorizontal: 20,
//       paddingTop: Platform.OS === "ios" ? 60 : 40,
//       paddingBottom: 30,
//     },
//     headerSection: {
//       alignItems: "center",
//       marginBottom: 10,
//     },
//     imageContainer: {
//       width: 120,
//       height: 120,
//       borderRadius: 60,
//       backgroundColor: "rgba(255,255,255,0.15)",
//       justifyContent: "center",
//       alignItems: "center",
//       marginBottom: 20,
//     },
//     roleImage: {
//       width: 80,
//       height: 80,
//       resizeMode: "contain",
//     },
//     welcomeText: {
//       fontSize: 32,
//       fontWeight: "700",
//       color: "#fff",
//       marginBottom: 8,
//     },
//     subtitle: {
//       fontSize: 16,
//       color: "rgba(255,255,255,0.85)",
//       textAlign: "center",
//     },
//     card: {
//       backgroundColor: colors.card,
//       borderRadius: 24,
//       padding: 28,
//       width: "100%",
//       maxWidth: 440,
//       alignSelf: "center",
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 10 },
//       shadowOpacity: isDark ? 0.4 : 0.25,
//       shadowRadius: 20,
//       elevation: 15,
//     },
//     cardTitle: {
//       fontSize: 24,
//       fontWeight: "700",
//       color: colors.textPrimary,
//       marginBottom: 24,
//       textAlign: "center",
//     },
//     inputContainer: {
//       marginBottom: 10,
//     },
//     label: {
//       fontSize: 14,
//       fontWeight: "600",
//       color: colors.textSecondary,
//       marginBottom: 8,
//       marginLeft: 4,
//     },
//     inputWrapper: {
//       flexDirection: "row",
//       alignItems: "center",
//       borderWidth: 2,
//       borderColor: colors.inputBorder,
//       borderRadius: 12,
//       paddingHorizontal: 16,
//       backgroundColor: colors.inputBg,
//       height: 50,
//     },
//     inputError: {
//       borderColor: "#e74c3c",
//       backgroundColor: colors.errorBg,
//     },
//     icon: {
//       marginRight: 12,
//     },
//     input: {
//       flex: 1,
//       fontSize: 16,
//       color: colors.textPrimary,
//       paddingVertical: 0,
//     },
//     eyeIcon: {
//       padding: 4,
//     },
//     errorText: {
//       color: "#e74c3c",
//       fontSize: 12,
//       marginTop: 6,
//       marginLeft: 4,
//       fontWeight: "500",
//     },
//     forgotPassword: {
//       alignSelf: "flex-end",
//       marginBottom: 24,
//       marginTop: -8,
//     },
//     forgotPasswordText: {
//       color: theme.primary || "#667eea",
//       fontSize: 14,
//       fontWeight: "600",
//     },
//     button: {
//       borderRadius: 12,
//       overflow: "hidden",
//     },
//     buttonDisabled: {
//       opacity: 0.7,
//     },
//     buttonGradient: {
//       paddingVertical: 16,
//       alignItems: "center",
//       justifyContent: "center",
//     },
//     buttonText: {
//       color: "#fff",
//       fontSize: 17,
//       fontWeight: "700",
//       letterSpacing: 0.5,
//     },
//     loaderContainer: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "center",
//       gap: 12,
//     },
//     loadingInfo: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "center",
//       marginTop: 16,
//       gap: 8,
//     },
//     infoText: {
//       color: colors.infoText,
//       fontSize: 13,
//       fontStyle: "italic",
//     },
//     footer: {
//       marginTop: 24,
//       alignItems: "center",
//     },
//     footerButton: {
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 8,
//       paddingVertical: 12,
//       paddingHorizontal: 20,
//     },
//     footerText: {
//       color: "#fff",
//       fontSize: 15,
//       fontWeight: "600",
//     },
//   });
// };
