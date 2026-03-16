import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
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

export default function ResetStaffPassword() {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    const validatePasswordStrength = (password: string) => {
        // At least 6 characters
        if (password.length < 6) return "Password must be at least 6 characters";
        
        // Check for at least one letter and one number (basic strength)
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        
        if (!hasLetter || !hasNumber) {
            return "Password should contain both letters and numbers";
        }
        
        return null;
    };

    const validate = () => {
        let temp: any = {};

        // Old password validation
        if (!oldPassword.trim()) {
            temp.oldPassword = "Old password is required";
        }

        // New password validation
        if (!newPassword.trim()) {
            temp.newPassword = "New password is required";
        } else {
            const strengthError = validatePasswordStrength(newPassword);
            if (strengthError) {
                temp.newPassword = strengthError;
            }
        }

        // Check if new password is same as old
        if (oldPassword && newPassword && oldPassword === newPassword) {
            temp.newPassword = "New password must be different from old password";
        }

        // Confirm password validation
        if (!confirmPassword.trim()) {
            temp.confirmPassword = "Please confirm your password";
        } else if (newPassword !== confirmPassword) {
            temp.confirmPassword = "Passwords do not match";
        }

        setErrors(temp);
        return Object.keys(temp).length === 0;
    };

    const resetPasswordHandler = async () => {
        if (!validate()) return;

        setLoading(true);

        try {
            const deviceId = await getDeviceId();
            const token = await AsyncStorage.getItem("auth_token");
            const encodedTenant = await AsyncStorage.getItem("auth_tenant");
            
            if (!token || !encodedTenant) {
                throw new Error("Authentication credentials not found. Please login again.");
            }

            const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

            const params = {
                oldPassword,
                newPassword,
                confirmPassword,
            };

            const response = await axios.post(
                API_BASE_URL + "login-auth/staff/change-password",
                params,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "X-Device-ID": deviceId,
                    },
                }
            );

            if (response.status === 200) {
                // Clear form
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
                
                Alert.alert(
                    "Success",
                    "Your password has been updated successfully. Please login with your new password.",
                    [
                        { 
                            text: "OK", 
                            onPress: async () => {
                                // Optionally clear auth and force re-login
                                // await AsyncStorage.removeItem("auth_token");
                                // router.replace("/");
                                router.replace("/(tabs)/home");
                            }
                        }
                    ]
                );
            }
        } catch (error: any) {
            console.error("Password change error:", error);

            let errorMessage = "Failed to change password. Please try again.";

            if (error.response) {
                // Server responded with error
                errorMessage = error.response.data?.message || 
                              `Server error (${error.response.status})`;
                
                // Handle specific error codes
                if (error.response.status === 401) {
                    errorMessage = "Your session has expired. Please login again.";
                    // Optionally redirect to login
                    setTimeout(() => {
                        router.replace("/");
                    }, 2000);
                } else if (error.response.status === 400) {
                    errorMessage = error.response.data?.message || 
                                 "Old password is incorrect or new password is invalid.";
                }
            } else if (error.request) {
                errorMessage = "Network error. Please check your connection.";
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleBackPress = () => {
        if (oldPassword || newPassword || confirmPassword) {
            Alert.alert(
                "Discard Changes?",
                "Are you sure you want to go back? Your entered data will be lost.",
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Go Back", 
                        style: "destructive",
                        onPress: () => router.replace("/(tabs)/home")
                    }
                ]
            );
        } else {
            router.replace("/(tabs)/home");
        }
    };

    return (
        <LinearGradient
            colors={["#667eea", "#5851db", "#5851db"]}
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
                            <Ionicons name="shield-checkmark-outline" size={50} color="#fff" />
                        </View>
                        <Text style={styles.welcomeText}>Change Password</Text>
                        <Text style={styles.subtitle}>
                            Update your password to keep your account secure
                        </Text>
                    </Animated.View>

                    {/* Change Password Card */}
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
                            <Ionicons name="information-circle" size={20} color="#667eea" />
                            <Text style={styles.securityText}>
                                Password must be at least 6 characters with letters and numbers.
                            </Text>
                        </View>

                        {/* Old Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Current Password</Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    errors.oldPassword && styles.inputError,
                                ]}
                            >
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color={errors.oldPassword ? "#e74c3c" : "#667eea"}
                                    style={styles.icon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter current password"
                                    placeholderTextColor="#a0a0a0"
                                    value={oldPassword}
                                    onChangeText={(text) => {
                                        setOldPassword(text);
                                        if (errors.oldPassword)
                                            setErrors({ ...errors, oldPassword: "" });
                                    }}
                                    secureTextEntry={!showOldPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowOldPassword(!showOldPassword)}
                                    disabled={loading}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons
                                        name={showOldPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#667eea"
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.oldPassword && (
                                <Text style={styles.errorText}>{errors.oldPassword}</Text>
                            )}
                        </View>

                        {/* New Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>New Password</Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    errors.newPassword && styles.inputError,
                                ]}
                            >
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color={errors.newPassword ? "#e74c3c" : "#667eea"}
                                    style={styles.icon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter new password"
                                    placeholderTextColor="#a0a0a0"
                                    value={newPassword}
                                    onChangeText={(text) => {
                                        setNewPassword(text);
                                        if (errors.newPassword)
                                            setErrors({ ...errors, newPassword: "" });
                                    }}
                                    secureTextEntry={!showNewPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                    disabled={loading}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons
                                        name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#667eea"
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.newPassword && (
                                <Text style={styles.errorText}>{errors.newPassword}</Text>
                            )}
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirm New Password</Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    errors.confirmPassword && styles.inputError,
                                ]}
                            >
                                <Ionicons
                                    name="lock-open-outline"
                                    size={20}
                                    color={errors.confirmPassword ? "#e74c3c" : "#667eea"}
                                    style={styles.icon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm new password"
                                    placeholderTextColor="#a0a0a0"
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        if (errors.confirmPassword)
                                            setErrors({ ...errors, confirmPassword: "" });
                                    }}
                                    secureTextEntry={!showConfirmPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={loading}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#667eea"
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && (
                                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                            )}
                        </View>

                        {/* Change Password Button */}
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={resetPasswordHandler}
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
                                        <Text style={styles.buttonText}>Updating...</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.buttonText}>Change Password</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Back to Profile */}
                        <TouchableOpacity
                            onPress={handleBackPress}
                            disabled={loading}
                            style={styles.backToProfile}
                        >
                            <Ionicons name="arrow-back" size={16} color="#667eea" />
                            <Text style={styles.backToProfileText}>Back to Profile</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
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
        paddingTop: Platform.OS === "ios" ? 60 : 40,
        paddingBottom: 30,
    },
    headerSection: {
        alignItems: "center",
        marginBottom: 0,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 30,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    welcomeText: {
        fontSize: 32,
        fontWeight: "700",
        color: "#fff",
        // marginBottom: 8,
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.9)",
        textAlign: "center",
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 18,
        width: "100%",
        maxWidth: 440,
        alignSelf: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
    },
    securityNotice: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#f0f4ff",
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderLeftWidth: 6,
        borderLeftColor: "#667eea",
    },
    securityText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        color: "#555",
        lineHeight: 18,
    },
    inputContainer: {
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#555",
        marginBottom: 4,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#e0e0e0",
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: "#f8f9fa",
        height: 48,
    },
    inputError: {
        borderColor: "#e74c3c",
        backgroundColor: "#fff5f5",
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#333",
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
        shadowColor: "#667eea",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
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
    backToProfile: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 20,
        paddingVertical: 12,
    },
    backToProfileText: {
        color: "#667eea",
        fontSize: 15,
        fontWeight: "600",
    },
});