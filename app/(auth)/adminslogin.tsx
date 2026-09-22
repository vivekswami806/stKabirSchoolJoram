import { ThemeContext } from "@/action/theme/ThemeContext";
import { getDeviceId } from "@/helper/getDeviceId";
import {
  getContainerWidth,
  getDeviceType,
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
import { useDispatch } from "react-redux";
import { handleLogin, validateLoginForm } from "../../utils/loginHandler";

export default function Login() {
  const dispatch = useDispatch();
  const { role } = useLocalSearchParams();
  const roleParam = Array.isArray(role) ? role[0] : role;
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);
  const isDark = theme.mode === "dark";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animation values
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
    const deviceId = await getDeviceId();
    const { isValid, errors: validationErrors } = validateLoginForm({
      username,
      password,
    });

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    let params = {
      username: username,
      password: password,
      deviceId: deviceId,
    };

    try {
      await handleLogin(
        params,
        "login-auth/admin/loginV2",
        dispatch,
        () => {
          // Success callback
        },
        (error) => {
          console.error("❌ Login failed:", error);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("❌ Unexpected error:", error);
      setLoading(false);
    }
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

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.username && styles.inputError,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={scaleFont(20)}
                  color={theme.primary}
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor={theme.textSecondary}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (errors.username) setErrors({ ...errors, username: "" });
                  }}
                  editable={!loading}
                  autoCapitalize="none"
                />
              </View>
              {errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
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
  const deviceType = getDeviceType();

  return StyleSheet.create({
    // ===== CONTAINER & LAYOUT =====
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

    // ===== HEADER SECTION =====
    headerSection: {
      alignItems: "center",
      marginBottom: scaleH(20),
      width: "100%",
      maxWidth: containerWidth,
      alignSelf: "center",
    },

    imageContainer: {
      width: scaleW(phoneSize === "XS" ? 80 : 120),
      height: scaleW(phoneSize === "XS" ? 80 : 120),
      borderRadius: scaleW(phoneSize === "XS" ? 40 : 60),
      backgroundColor: theme.cardBackground || theme.background,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: scaleH(20),
      borderWidth: 2,
      borderColor: theme.background,
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
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: scaleFont(20),
      paddingHorizontal: padding.md,
    },

    // ===== LOGIN CARD =====
    card: {
      backgroundColor: theme.cardBackground || theme.background,
      borderRadius: scaleW(24),
      padding: padding.lg,
      width: "100%",
      maxWidth: containerWidth,
      alignSelf: "center",
      borderWidth: 1,
      borderColor: theme.border || "transparent",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: scaleH(10) },
      shadowOpacity: isDark ? 0.4 : 0.15,
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

    // ===== INPUT FIELDS =====
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
      borderColor: theme.errorColor || "#FF6B6B",
    },

    icon: {
      marginRight: padding.sm,
      color: theme.primary,
    },

    input: {
      flex: 1,
      fontSize: fonts.body,
      color: theme.text,
      paddingVertical: scaleH(0),
    },

    eyeIcon: {
      padding: scaleW(4),
      marginLeft: padding.sm,
    },

    errorText: {
      color: theme.errorColor || "#FF6B6B",
      fontSize: fonts.tiny,
      marginTop: scaleH(6),
      marginLeft: scaleW(4),
      fontWeight: "500",
    },

    // ===== BUTTON =====
    button: {
      borderRadius: scaleW(12),
      overflow: "hidden",
      marginTop: scaleH(8),
      minHeight: scaleH(48),
    },

    buttonDisabled: {
      opacity: 0.7,
    },

    buttonGradient: {
      paddingVertical: scaleH(14),
      paddingHorizontal: padding.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
      minHeight: scaleH(48),
    },

    buttonText: {
      color: theme.buttonText || "#fff",
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
      paddingHorizontal: padding.md,
    },

    infoText: {
      color: theme.textSecondary,
      fontSize: fonts.small,
      fontStyle: "italic",
    },

    // ===== FOOTER =====
    footer: {
      marginTop: "auto",
      alignItems: "center",
      paddingBottom: scaleH(155),
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