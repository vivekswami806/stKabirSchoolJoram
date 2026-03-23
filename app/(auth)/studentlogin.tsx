// screens/auth/StudentLogin.tsx
import { useAppDispatch } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { getDeviceId } from "@/helper/getDeviceId";
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
import { handleLogin, validateLoginForm } from "./loginHandler";

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
  const [slideAnim] = useState(new Animated.Value(scaleH(50)));

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
        mobile: mobileNumber,
        admissionNo: admissionNumber,
        pin: password,
        deviceId: await getDeviceId(),
      };

      await handleLogin(
        params,
        "login-auth/parent/loginV2",
        dispatch,
        () => {
          // Success callback
          // AuthGate will automatically redirect to home
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
      colors={[theme.background, theme.background]}
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
          bounces={false}
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
                  size={scaleFont(20)}
                  color={theme.primary}
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your mobile number"
                  placeholderTextColor={theme.textSecondary}
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
                  size={scaleFont(20)}
                  color={theme.primary}
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter admission number"
                  placeholderTextColor={theme.textSecondary}
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
                  size={scaleFont(20)}
                  color={theme.primary}
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password)
                      setErrors({ ...errors, password: "" });
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
                    size={scaleFont(20)}
                    color={theme.primary}
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
                    ? [theme.primary, theme.primary]
                    : [theme.primary, theme.primary]
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
                <ActivityIndicator color={theme.primary} size="small" />
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
              <Ionicons
                name="arrow-back"
                size={scaleFont(16)}
                color={theme.primary}
              />
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
  const padding = getResponsivePadding();
  const fonts = getResponsiveFontSize();
  const containerWidth = getContainerWidth();
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
      paddingHorizontal: padding.md,
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
      width: scaleW(phoneSize === "XS" ? 80 : 120),
      height: scaleW(phoneSize === "XS" ? 80 : 120),
      borderRadius: scaleW(phoneSize === "XS" ? 40 : 60),
      backgroundColor: theme.background,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: scaleH(20),
    },

    roleImage: {
      width: scaleW(phoneSize === "XS" ? 60 : 80),
      height: scaleW(phoneSize === "XS" ? 60 : 80),
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
      paddingHorizontal: padding.md,
    },

    card: {
      backgroundColor: theme.card,
      borderRadius: scaleW(24),
      padding: padding.lg,
      width: "100%",
      maxWidth: containerWidth,
      alignSelf: "center",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: scaleH(10) },
      shadowOpacity: isDark ? 0.4 : 0.25,
      shadowRadius: scaleW(20),
      elevation: 15,
      marginVertical: scaleH(20),
    },

    cardTitle: {
      fontSize: fonts.h3,
      fontWeight: "700",
      color: theme.primary,
      marginBottom: scaleH(24),
      textAlign: "center",
    },

    inputContainer: {
      marginBottom: scaleH(16),
    },

    label: {
      fontSize: fonts.small,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: scaleH(8),
      marginLeft: scaleW(4),
    },

    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 2,
      borderColor: theme.border || theme.primary,
      borderRadius: scaleW(12),
      paddingHorizontal: padding.md,
      height: scaleH(48),
      backgroundColor: theme.background,
    },

    inputError: {
      borderColor: theme.primary,
    },

    icon: {
      marginRight: padding.sm,
      color: theme.primary,
    },

    input: {
      flex: 1,
      fontSize: fonts.body,
      color: theme.text,
      paddingVertical: 0,
    },

    eyeIcon: {
      padding: scaleW(4),
    },

    errorText: {
      color: theme.errorColor,
      fontSize: fonts.tiny,
      marginTop: scaleH(6),
      marginLeft: scaleW(4),
      fontWeight: "500",
    },

    forgotPassword: {
      alignSelf: "flex-end",
      marginBottom: scaleH(24),
      marginTop: scaleH(-8),
    },

    forgotPasswordText: {
      color: theme.primary,
      fontSize: fonts.small,
      fontWeight: "600",
    },

    button: {
      borderRadius: scaleW(12),
      overflow: "hidden",
      minHeight: scaleH(48),
    },

    buttonDisabled: {
      opacity: 0.7,
    },

    buttonGradient: {
      paddingVertical: scaleH(16),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
      minHeight: scaleH(48),
    },

    buttonText: {
      color: theme.buttonText,
      fontSize: fonts.body,
      fontWeight: "700",
      letterSpacing: 0.5,
    },

    loaderContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: padding.md,
    },

    loadingInfo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: scaleH(16),
      gap: padding.sm,
    },

    infoText: {
      color: theme.primary,
      fontSize: fonts.small,
      fontStyle: "italic",
    },

    footer: {
      marginTop: scaleH(24),
      alignItems: "center",
    },

    footerButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: padding.sm,
      paddingVertical: scaleH(12),
      paddingHorizontal: padding.lg,
    },

    footerText: {
      color: theme.primary,
      fontSize: fonts.body,
      fontWeight: "600",
    },
  });
};
