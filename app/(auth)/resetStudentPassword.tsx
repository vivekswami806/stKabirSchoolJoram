
import { ThemeContext } from "@/action/theme/ThemeContext";
import { API_BASE_URL } from "@/config";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as Application from "expo-application";
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
    View
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { ToastService } from "react-native-toastier";

// Common weak PINs to avoid
const WEAK_PINS = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321'];

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

    const getDeviceId = async () => {
        if (Platform.OS === "android") {
            return "android-" + Application.getAndroidId();
        }
        if (Platform.OS === "ios") {
            return "ios-" + (await Application.getIosIdForVendorAsync());
        }
        return "unknown-device";
    };

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
                const errorMessage = response.data?.message || "Failed to reset PIN. Please check your details.";
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
                errorMessage = error.response.data?.message ||
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
        if (mobileNumber || admissionNo || studentDob || newPin || confirmPin) {
            Alert.alert(
                "Discard Changes?",
                "Are you sure you want to go back? Your entered data will be lost.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Go Back",
                        style: "destructive",
                        onPress: () => router.back()
                    }
                ]
            );
        } else {
            router.back();
        }
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
                        <View style={styles.iconContainer}>
                            <Ionicons name="key-outline" size={50} color="#fff" />
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
                            <Ionicons name="shield-checkmark" size={20} color="#667eea" />
                            <Text style={styles.securityText}>
                                Choose a strong 4-digit PIN. Avoid simple patterns like 1234 or 0000.
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
                                    size={20}
                                    color={errors.mobileNumber ? "#e74c3c" : styles.accentColor.color}
                                    style={styles.icon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter 10-digit mobile number"
                                    placeholderTextColor="#a0a0a0"
                                    value={mobileNumber}
                                    onChangeText={(text) => {
                                        // Only allow digits
                                        const cleaned = text.replace(/[^0-9]/g, '');
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
                                    size={20}
                                    color={errors.admissionNo ? "#e74c3c" : styles.accentColor.color}
                                    style={styles.icon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter admission number"
                                    placeholderTextColor="#a0a0a0"
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
                                        size={20}
                                        color={errors.studentDob ? "#e74c3c" : styles.accentColor.color}
                                        style={styles.icon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Select date of birth"
                                        placeholderTextColor="#a0a0a0"
                                        value={studentDob}
                                        editable={false}
                                    />
                                    <Ionicons
                                        name="chevron-down"
                                        size={20}
                                        color="#667eea"
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
                                    size={20}
                                    color={errors.newPin ? "#e74c3c" : styles.accentColor.color}
                                    style={styles.icon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter 4-digit PIN"
                                    placeholderTextColor="#a0a0a0"
                                    value={newPin}
                                    onChangeText={(text) => {
                                        // Only allow digits
                                        const cleaned = text.replace(/[^0-9]/g, '');
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
                                        size={20}
                                        color="#667eea"
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
                                    size={20}
                                    color={errors.confirmPin ? "#e74c3c" : styles.accentColor.color}
                                    style={styles.icon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm 4-digit PIN"
                                    placeholderTextColor="#a0a0a0"
                                    value={confirmPin}
                                    onChangeText={(text) => {
                                        // Only allow digits
                                        const cleaned = text.replace(/[^0-9]/g, '');
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
                                        size={20}
                                        color="#667eea"
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
                                        ? ["#a0a0a0", "#808080"]
                                        : ["#667eea", "#667eea"]
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
                            <Ionicons name="arrow-back" size={16} color="#667eea" />
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
  
    const colors = {
      card: isDark ? "#1e293b" : "#ffffff",
      textPrimary: isDark ? "#f1f5f9" : "#333",
      textSecondary: isDark ? "#cbd5e1" : "#555",
      inputBg: isDark ? "#334155" : "#f8f9fa",
      inputBorder: isDark ? "#475569" : "#e0e0e0",
      placeholder: isDark ? "#94a3b8" : "#a0a0a0",
      securityBg: isDark ? "#1e293b" : "#f0f4ff",
      securityBorder: isDark ? "#6366f1" : "#667eea",
      securityText: isDark ? "#cbd5e1" : "#555",
      backText: isDark ? "#93c5fd" : "#667eea",
      errorBg: isDark ? "#3f1d1d" : "#fff5f5",
      accent: isDark ? "#818cf8" : "#667eea",
    };
  
    return StyleSheet.create({
      accentColor: {
        color: colors.accent,
      },
      placeholder: {
        color: colors.placeholder,
      },
      container: {
        flex: 1,
      },
      keyboardView: {
        flex: 1,
        width: "100%",
      },
      scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 10,
        paddingTop: Platform.OS === "ios" ? 60 : 33,
        paddingBottom: 10,
      },
      headerSection: {
        alignItems: "center",
        marginBottom: 10,
      },
      iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 60,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.5 : 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
      welcomeText: {
        fontSize: 26,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 0,
      },
      subtitle: {
        fontSize: 12,
        color: "rgba(255,255,255,0.9)",
        textAlign: "center",
      },
      card: {
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 18,
        width: "100%",
        maxWidth: 440,
        alignSelf: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: isDark ? 0.4 : 0.25,
        shadowRadius: 20,
        elevation: 15,
      },
      securityNotice: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: colors.securityBg,
        padding: 8,
        borderRadius: 8,
        marginBottom: 11,
        borderLeftWidth: 5,
        borderLeftColor: colors.securityBorder,
      },
      securityText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        color: colors.securityText,
        lineHeight: 18,
      },
      inputContainer: {
        marginBottom: 2,
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
        height: 48,
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
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.5 : 0.3,
        shadowRadius: 8,
        elevation: 6,
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
      backToLogin: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 10,
        paddingVertical: 2,
      },
      backToLoginText: {
        color: colors.backText,
        fontSize: 15,
        fontWeight: "600",
      },
    });
  };
  