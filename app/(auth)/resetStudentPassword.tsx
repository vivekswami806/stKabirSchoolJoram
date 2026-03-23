import { ThemeContext } from "@/action/theme/ThemeContext";
import { API_BASE_URL } from "@/config";
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
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useContext, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { ToastService } from "react-native-toastier";

// Common weak PINs to avoid
const WEAK_PINS = [
  "0000",
  "1111",
  "2222",
  "3333",
  "4444",
  "5555",
  "6666",
  "7777",
  "8888",
  "9999",
  "1234",
  "4321",
];

export default function ResetPin() {
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;

  const { theme } = themeState;
  const styles = getStyles(theme);
  const isDark = theme.mode === "dark";
  const [mobileNumber, setMobileNumber] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");
  const [studentDob, setStudentDob] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

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

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (date: Date) => {
    const formattedDate = date.toISOString().split("T")[0];
    setStudentDob(formattedDate);
    if (errors.studentDob) setErrors({ ...errors, studentDob: "" });
    hideDatePicker();
  };

  const validate = () => {
    let temp: any = {};

    // Mobile number validation
    if (!mobileNumber) {
      temp.mobileNumber = "Mobile number is required";
    } else if (!/^\d{10}$/.test(mobileNumber)) {
      temp.mobileNumber = "Mobile number must be 10 digits";
    }

    // Admission number validation
    if (!admissionNo.trim()) {
      temp.admissionNo = "Admission number is required";
    }

    // DOB validation
    if (!studentDob) {
      temp.studentDob = "Date of birth is required";
    }

    // New PIN validation
    if (!newPin) {
      temp.newPin = "New PIN is required";
    } else if (!/^\d{4}$/.test(newPin)) {
      temp.newPin = "PIN must be exactly 4 digits";
    } else if (WEAK_PINS.includes(newPin)) {
      temp.newPin = "Please choose a stronger PIN (avoid 0000, 1234, etc.)";
    }

    // Confirm PIN validation
    if (!confirmPin) {
      temp.confirmPin = "Please confirm your PIN";
    } else if (newPin !== confirmPin) {
      temp.confirmPin = "PINs do not match";
    }

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const resetPinHandler = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const deviceId = await getDeviceId();

      let params = {
        mobileNumber: mobileNumber,
        admissionNo: admissionNo,
        studentDob: studentDob,
        newPin: newPin,
        confirmPin: confirmPin,
        deviceId: deviceId,
      };

      const response = await axios.post(
        API_BASE_URL + "login-auth/parent/reset-pin",
        params
      );

      if (response.data?.success) {
        ToastService.show({
          type: "success",
          message: "PIN successfully reset! Please login with your new PIN.",
          duration: 3000,
        });

        // Clear form
        setMobileNumber("");
        setAdmissionNo("");
        setStudentDob("");
        setNewPin("");
        setConfirmPin("");

        // Navigate to login after a short delay
        setTimeout(() => {
          router.replace("/");
        }, 1500);
      } else {
        // Handle specific error messages from API
        const errorMessage =
          response.data?.message ||
          "Failed to reset PIN. Please check your details.";
        ToastService.show({
          type: "danger",
          message: errorMessage,
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error("Reset PIN error:", error);

      let errorMessage = "An error occurred. Please try again.";

      if (error.response) {
        // Server responded with error
        errorMessage =
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = "Network error. Please check your connection.";
      }

      ToastService.show({
        type: "danger",
        message: errorMessage,
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    if (
      mobileNumber ||
      admissionNo ||
      studentDob ||
      newPin ||
      confirmPin
    ) {
      Alert.alert(
        "Discard Changes?",
        "Are you sure you want to go back? Your entered data will be lost.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go Back",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
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
            <View style={styles.iconContainer}>
              <Ionicons
                name="key-outline"
                size={scaleFont(50)}
                color={theme.primary}
              />
            </View>
            <Text style={styles.welcomeText}>Reset PIN</Text>
            <Text style={styles.subtitle}>
              Enter your details to reset your PIN
            </Text>
          </Animated.View>

          {/* Reset PIN Card */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Ionicons
                name="shield-checkmark"
                size={scaleFont(20)}
                color={theme.primary}
              />
              <Text style={styles.securityText}>
                Choose a strong 4-digit PIN. Avoid simple patterns like 1234 or
                0000.
              </Text>
            </View>

            {/* Mobile Number */}
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
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor={theme.textSecondary}
                  value={mobileNumber}
                  onChangeText={(text) => {
                    // Only allow digits
                    const cleaned = text.replace(/[^0-9]/g, "");
                    setMobileNumber(cleaned);
                    if (errors.mobileNumber)
                      setErrors({ ...errors, mobileNumber: "" });
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!loading}
                />
              </View>
              {errors.mobileNumber && (
                <Text style={styles.errorText}>{errors.mobileNumber}</Text>
              )}
            </View>

            {/* Admission Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Admission Number</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.admissionNo && styles.inputError,
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
                  value={admissionNo}
                  onChangeText={(text) => {
                    setAdmissionNo(text);
                    if (errors.admissionNo)
                      setErrors({ ...errors, admissionNo: "" });
                  }}
                  editable={!loading}
                  autoCapitalize="characters"
                />
              </View>
              {errors.admissionNo && (
                <Text style={styles.errorText}>{errors.admissionNo}</Text>
              )}
            </View>

            {/* Date of Birth */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                onPress={showDatePicker}
                activeOpacity={0.8}
                disabled={loading}
              >
                <View
                  pointerEvents="none"
                  style={[
                    styles.inputWrapper,
                    errors.studentDob && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={scaleFont(20)}
                    color={theme.primary}
                    style={styles.icon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Select date of birth"
                    placeholderTextColor={theme.textSecondary}
                    value={studentDob}
                    editable={false}
                  />
                  <Ionicons
                    name="chevron-down"
                    size={scaleFont(20)}
                    color={theme.primary}
                  />
                </View>
              </TouchableOpacity>
              {errors.studentDob && (
                <Text style={styles.errorText}>{errors.studentDob}</Text>
              )}
            </View>

            {/* New PIN */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>New PIN</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.newPin && styles.inputError,
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
                  placeholder="Enter 4-digit PIN"
                  placeholderTextColor={theme.textSecondary}
                  value={newPin}
                  onChangeText={(text) => {
                    // Only allow digits
                    const cleaned = text.replace(/[^0-9]/g, "");
                    setNewPin(cleaned);
                    if (errors.newPin)
                      setErrors({ ...errors, newPin: "" });
                  }}
                  secureTextEntry={!showNewPin}
                  keyboardType="numeric"
                  maxLength={4}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPin(!showNewPin)}
                  disabled={loading}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showNewPin ? "eye-off-outline" : "eye-outline"}
                    size={scaleFont(20)}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              </View>
              {errors.newPin && (
                <Text style={styles.errorText}>{errors.newPin}</Text>
              )}
            </View>

            {/* Confirm PIN */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm PIN</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.confirmPin && styles.inputError,
                ]}
              >
                <Ionicons
                  name="lock-open-outline"
                  size={scaleFont(20)}
                  color={theme.primary}
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm 4-digit PIN"
                  placeholderTextColor={theme.textSecondary}
                  value={confirmPin}
                  onChangeText={(text) => {
                    // Only allow digits
                    const cleaned = text.replace(/[^0-9]/g, "");
                    setConfirmPin(cleaned);
                    if (errors.confirmPin)
                      setErrors({ ...errors, confirmPin: "" });
                  }}
                  secureTextEntry={!showConfirmPin}
                  keyboardType="numeric"
                  maxLength={4}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPin(!showConfirmPin)}
                  disabled={loading}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={
                      showConfirmPin ? "eye-off-outline" : "eye-outline"
                    }
                    size={scaleFont(20)}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPin && (
                <Text style={styles.errorText}>{errors.confirmPin}</Text>
              )}
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={resetPinHandler}
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
                    <Text style={styles.buttonText}>Resetting...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Reset PIN</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
              onPress={handleBackPress}
              disabled={loading}
              style={styles.backToLogin}
            >
              <Ionicons
                name="arrow-back"
                size={scaleFont(16)}
                color={theme.text}
              />
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
        maximumDate={new Date()}
      />
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
            : 40
          : phoneSize === "XS"
          ? 20
          : 40
      ),
      paddingBottom: padding.sm,
    },

    headerSection: {
      alignItems: "center",
      marginBottom: scaleH(10),
      width: "100%",
      maxWidth: containerWidth,
      alignSelf: "center",
    },

    iconContainer: {
      width: scaleW(100),
      height: scaleW(100),
      borderRadius: scaleW(50),
      justifyContent: "center",
      alignItems: "center",
      marginBottom: scaleH(0),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: scaleH(4) },
      shadowOpacity: isDark ? 0.5 : 0.3,
      shadowRadius: scaleW(8),
      elevation: 8,
    },

    welcomeText: {
      fontSize: fonts.h2,
      fontWeight: "700",
      color: theme.primary,
      marginBottom: scaleH(8),
      textAlign: "center",
    },

    subtitle: {
      fontSize: fonts.small,
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

    securityNotice: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: padding.sm,
      borderRadius: scaleW(8),
      marginBottom: scaleH(16),
      borderLeftWidth: scaleW(5),
      borderLeftColor: theme.primary,
    },

    securityText: {
      flex: 1,
      marginLeft: padding.sm,
      fontSize: fonts.small,
      lineHeight: scaleFont(18),
      color: theme.text,
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

    button: {
      borderRadius: scaleW(12),
      overflow: "hidden",
      shadowOffset: { width: 0, height: scaleH(4) },
      shadowOpacity: isDark ? 0.5 : 0.3,
      shadowRadius: scaleW(8),
      elevation: 6,
      marginTop: scaleH(8),
      minHeight: scaleH(48),
    },

    buttonDisabled: {
      opacity: 0.7,
    },

    buttonGradient: {
      paddingVertical: scaleH(16),
      alignItems: "center",
      justifyContent: "center",
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

    backToLogin: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: padding.sm,
      marginTop: scaleH(16),
      paddingVertical: scaleH(12),
    },

    backToLoginText: {
      color: theme.text,
      fontSize: fonts.body,
      fontWeight: "600",
    },
  });
};