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
import { useDispatch } from 'react-redux';
import { handleLogin, validateLoginForm } from "./loginHandler";

const { width } = Dimensions.get("window");

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

    //  let params = {
    //       "username": "Vk15",
    //       "password": "Vk15@1234",
    //       "deviceId": deviceId
    //     }

    // let params = {
    //   "username": "staff66",
    //   "password": "Swami@1234",
    //   "deviceId": deviceId
    // }

    let params = {
      username: username,
      password: password,
      deviceId: deviceId
    }

    try {
      await handleLogin(
        params,
        "login-auth/staff/loginV2",
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
      colors={ isDark
        ? ["#0f172a", "#1e293b", "#111827"]
        : ["#667eea", "#5851db", "#5851db"]}
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
                  size={20}
                  color={errors.username ? "#e74c3c" : "#667eea"}
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor="#a0a0a0"
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
                    : ["#667eea", "#5851db"]
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
    textPrimary: isDark ? "#f1f5f9" : "#333",
    textSecondary: isDark ? "#cbd5e1" : "#555",
    inputBg: isDark ? "#334155" : "#f8f9fa",
    inputBorder: isDark ? "#475569" : "#e0e0e0",
    placeholder: isDark ? "#94a3b8" : "#a0a0a0",
    infoText: isDark ? "#cbd5e1" : "#666",
    errorBg: isDark ? "#3f1d1d" : "#fff5f5",
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
      marginBottom: 30,
    },
    imageContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "rgba(255,255,255,0.15)",
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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.4 : 0.25,
      shadowRadius: 20,
      elevation: 15,
    },
    cardTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 24,
      textAlign: "center",
    },
    inputContainer: {
      marginBottom: 20,
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
      height: 56,
    },
    inputError: {
      borderColor: "#e74c3c",
      backgroundColor: colors.errorBg,
    },
    icon: {
      marginRight: 12,
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
      color: "#e74c3c",
      fontSize: 12,
      marginTop: 6,
      marginLeft: 4,
      fontWeight: "500",
    },
    button: {
      borderRadius: 12,
      overflow: "hidden",
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonGradient: {
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
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
