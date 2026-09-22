import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { compressImage } from "@/helper/handleProfilePhotoEditandCrop";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ToastService } from "react-native-toastier";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface StaffAddress {
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  status: boolean;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  adharNumber: number;
  staffBloodGroup: string;
  staffEmergencyContact: number;
  staffJoiningDate: string;
  staffPreviousSchoolName: string;
  staffClass: string;
  staffSection: string;
  teachingSubjects: string;
  educationalQualifications: string;
  certifications: string;
  languagesSpoken: string;
  specializations: string;
  workExperience: string;
  staffAddressDetails: StaffAddress[];
  staffImage?: string;
}

interface Props {
  visible: boolean;
  teacher: Staff | null;
  onClose: () => void;
}

export default function TeacherDetailBottomSheet({
  visible,
  teacher,
  onClose,
}: Props) {
  const themeState = useContext(ThemeContext);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [showModal, setShowModal] = React.useState(visible);
  const [staffImage, setStaffImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      if (teacher) {
        fetchStaffImage();
      }
    } else {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setShowModal(false));
    }
  }, [visible, teacher?.id]);

  const fetchStaffImage = async () => {
    if (!teacher?.id) return;
    try {
      setLoadingImage(true);
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) throw new Error("Auth token missing");

      const response = await fetch(
        `${API_BASE_URL}staff/image/${teacher.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setStaffImage(base64);
        };
        reader.readAsDataURL(blob);
      }
    } catch (err) {
    } finally {
      setLoadingImage(false);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadStaffImage(result.assets[0].uri);
      }
      setShowImageOptions(false);
    } catch (err) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const pickImageFromCamera = async () => {
    try {
      const image = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!image.canceled) {
        const originalUri = image.assets[0].uri;

        // Compress image
        const compressedUri = await compressImage(originalUri);

        // Upload compressed image
        await uploadStaffImage(compressedUri);
      }
      setShowImageOptions(false);
    } catch (err) {
      // Alert.alert("Error", "Failed to access camera");
    }
  };

  const uploadStaffImage = async (imageUri: string) => {
    if (!teacher?.id) return;
    try {
      const compressedUri = await compressImage(imageUri);
      setUploadingImage(true);
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");

      if (!token || !encodedTenant) throw new Error("Auth missing");

      const formData = new FormData();
      formData.append("file", {
        uri: compressedUri,
        type: "image/jpeg",
        name: `staff-${teacher.id}.jpg`,
      } as any);

      const response = await axios.put(
        `${API_BASE_URL}staff/image/${teacher.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": Buffer.from(encodedTenant, "base64").toString("utf-8"),
            "X-Device-ID": await getDeviceId(),
            "Content-Type": "multipart/form-data",
            // Don't set Content-Type manually for FormData.
            // Axios will set the correct multipart/form-data boundary.
          },
        }
      );
      

      if (response.status === 200) {
        ToastService.show({
          type: "success",
          message: "Image updated successfully",
          duration: 2000,
        });
        teacher.staffImage = `data:image/jpeg;base64,${response.data.data}`;

      } else {
        throw new Error("Failed to upload image");
      }
    } catch (err: any) {

      Alert.alert("Error", err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const downloadImage = async (teacher: any) => {
    
    if (!teacher?.staffImage) return;

    try {
      const fileName = `${teacher.name}-${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + fileName;
      let base64Data = teacher.staffImage;
         if (base64Data.startsWith("data:image")) {
           base64Data = base64Data.split(",")[1];
         }
         await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
    
        // Share the file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          ToastService.show({
            type: "success",
            message: "Image saved to device",
            duration: 2000,
          });
        }
    } catch (e) {
      ToastService.show({
        type: "danger",
        message: "failed to download",
        duration: 2000,
      });
    }
  };

  if (!themeState || !teacher || !showModal) return null;

  const { theme } = themeState;
  const isDark = theme.mode === "dark";
  const styles = getStyles(theme);

  const handleCall = () => {
    Linking.openURL(`tel:${teacher.phoneNumber}`);
  };

  const handleSMS = () => {
    Linking.openURL(`sms:${teacher.phoneNumber}`);
  };

  const handleWhatsApp = async () => {
    const cleaned = String(teacher.phoneNumber).replace(/\D/g, "");

    try {
      await Linking.openURL(`whatsapp://send?phone=${cleaned}`);
    } catch {
      try {
        await Linking.openURL(`https://wa.me/${cleaned}`);
      } catch {
        ToastService.show({
          type: "danger",
          message: "WhatsApp not available",
          duration: 3000,
        });
      }
    }
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${teacher.email}`);
  };

  const getClassDisplay = (staffClass: string, staffSection: string) => {
    if (!staffClass || staffClass.trim() === "") {
      return "N/A";
    }
    return staffSection ? `${staffClass} - ${staffSection}` : staffClass;
  };

  const formatValue = (value: any) => {
    if (!value || value === "" || value === null) return "N/A";
    return String(value);
  };

  const getInitials = (name: string) => {
    const names = name.split(" ");
    return names.length > 1
      ? names[0][0] + names[1][0]
      : names[0][0];
  };

  const isValidBase64Image = (str: string | null) => {
    if (!str) return false;
    return str.startsWith("data:image");
  };

  return (
    <Modal visible={showModal} transparent animationType="none" statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.handle} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header Card with Image */}
              <View style={styles.headerCard}>
                {/* Image Container */}
                <View style={styles.imageContainer}>
                  {teacher.staffImage ? (
                    <Image
                      source={{ uri: teacher.staffImage }}
                      style={styles.staffImageFull}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.avatarLarge}>
                      <Text style={styles.avatarTextLarge}>
                        {getInitials(teacher.name)}
                      </Text>
                    </View>
                  )}

                  {/* Image Action Button */}
                  <TouchableOpacity
                    style={styles.imageActionButton}
                    onPress={() => setShowImageOptions(!showImageOptions)}
                  >
                    <Ionicons
                      name="camera"
                      size={20}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>

                {/* Image Options Menu */}
                {showImageOptions && (
                  <View style={styles.imageOptionsMenu}>
                    <TouchableOpacity
                      style={styles.imageOption}
                      onPress={pickImageFromCamera}
                    >
                      <Ionicons name="camera" size={18} color={theme.primary} />
                      <Text style={[styles.imageOptionText, { color: theme.text }]}>
                        Take Photo
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.imageOption}
                      onPress={pickImageFromGallery}
                    >
                      <Ionicons name="image" size={18} color={theme.primary} />
                      <Text style={[styles.imageOptionText, { color: theme.text }]}>
                        Choose from Gallery
                      </Text>
                    </TouchableOpacity>

                    {teacher.staffImage && (
                      <TouchableOpacity
                        style={styles.imageOption}
                        onPress={() => { downloadImage(teacher) }}
                      >
                        <Ionicons name="download" size={18} color={theme.primary} />
                        <Text style={[styles.imageOptionText, { color: theme.text }]}>
                          Download Image
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {uploadingImage && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.uploadingText}>Uploading...</Text>
                  </View>
                )}

                <Text style={styles.name}>{teacher.name}</Text>
                <Text style={styles.role}>{teacher.role || "Staff Member"}</Text>

                <View
                  style={[
                    styles.statusPill,
                    teacher.status ? styles.activePill : styles.inactivePill,
                  ]}
                >
                  <Ionicons
                    name={teacher.status ? "checkmark-circle" : "close-circle"}
                    size={14}
                    color={teacher.status ? "#10B981" : "#EF4444"}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.statusText}>
                    {teacher.status ? "Active" : "Inactive"}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: "#34C759" }]}
                    onPress={handleCall}
                  >
                    <Ionicons name="call" size={20} color="#fff" />
                    <Text style={styles.actionText}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: "#0A84FF" }]}
                    onPress={handleSMS}
                  >
                    <Ionicons name="chatbubble" size={20} color="#fff" />
                    <Text style={styles.actionText}>SMS</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: "#25D366" }]}
                    onPress={handleWhatsApp}
                  >
                    <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                    <Text style={styles.actionText}>WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: "#EA4335" }]}
                    onPress={handleEmail}
                  >
                    <Ionicons name="mail" size={20} color="#fff" />
                    <Text style={styles.actionText}>Email</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Personal Information Section */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="person-circle"
                    size={20}
                    color={theme.primary}
                  />
                  <Text style={styles.sectionTitle}>Personal Information</Text>
                </View>
                <View style={styles.divider} />
                <Info label="Date of Birth" value={formatValue(teacher.dateOfBirth)} isDark={isDark} />
                <Info label="Gender" value={formatValue(teacher.gender)} isDark={isDark} />
                <Info label="Blood Group" value={formatValue(teacher.staffBloodGroup)} isDark={isDark} />
                <Info label="Aadhar Number" value={formatValue(teacher.adharNumber)} isDark={isDark} />
              </View>

              {/* Contact Information Section */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={theme.primary}
                  />
                  <Text style={styles.sectionTitle}>Contact Information</Text>
                </View>
                <View style={styles.divider} />
                <Info label="Phone" value={formatValue(teacher.phoneNumber)} isDark={isDark} />
                <Info label="Email" value={formatValue(teacher.email)} isDark={isDark} />
                <Info label="Emergency Contact" value={formatValue(teacher.staffEmergencyContact)} isDark={isDark} />
              </View>

              {/* Professional Information Section */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="briefcase-outline"
                    size={20}
                    color={theme.primary}
                  />
                  <Text style={styles.sectionTitle}>Professional Information</Text>
                </View>
                <View style={styles.divider} />
                <Info label="Class" value={getClassDisplay(teacher.staffClass, teacher.staffSection)} isDark={isDark} />
                <Info label="Joining Date" value={formatValue(teacher.staffJoiningDate)} isDark={isDark} />
                <Info label="Teaching Subjects" value={formatValue(teacher.teachingSubjects)} isDark={isDark} />
                <Info label="Qualifications" value={formatValue(teacher.educationalQualifications)} isDark={isDark} />
                <Info label="Certifications" value={formatValue(teacher.certifications)} isDark={isDark} />
                <Info label="Languages" value={formatValue(teacher.languagesSpoken)} isDark={isDark} />
                <Info label="Specializations" value={formatValue(teacher.specializations)} isDark={isDark} />
                <Info label="Experience" value={formatValue(teacher.workExperience)} isDark={isDark} />
              </View>

              {/* Address Section */}
              {teacher.staffAddressDetails && teacher.staffAddressDetails.length > 0 && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={theme.primary}
                    />
                    <Text style={styles.sectionTitle}>Address</Text>
                  </View>
                  <View style={styles.divider} />
                  {teacher.staffAddressDetails.map((addr, idx) => (
                    <View key={idx} style={styles.addressCard}>
                      <Ionicons
                        name="home-outline"
                        size={14}
                        color={theme.primary}
                        style={{ marginRight: 8 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.addressText}>{formatValue(addr.streetAddress)}</Text>
                        <Text style={styles.addressText}>
                          {formatValue(addr.city)}, {formatValue(addr.state)} - {formatValue(addr.postalCode)}
                        </Text>
                        <Text style={styles.addressText}>{formatValue(addr.country)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  router.push({
                    pathname: "/staffDashboard/(tabs)/totalattendance",
                    params: { details: JSON.stringify(teacher) },
                  });
                }}
                style={styles.primaryBtn}
              >
                <Ionicons name="bar-chart-outline" size={18} color="#fff" />
                <Text style={styles.primaryText}>View Attendance</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.secondaryBtn}>
                <Text style={styles.secondaryText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Info({
  label,
  value,
  isDark
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  const { theme } = useContext(ThemeContext)!;
  const styles = getStyles(theme);
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.infoValue,
          {
            color: value === "N/A"
              ? isDark ? "#6B7280" : "#9CA3AF"
              : theme.text,
            fontStyle: value === "N/A" ? "italic" : "normal",
          }
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-end",
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    sheet: {
      backgroundColor: isDark ? "#2D2D2D" : "#FFFFFF",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: SCREEN_HEIGHT * 0.90,
      minHeight: SCREEN_HEIGHT * 0.91,
      paddingHorizontal: 16,
      paddingBottom: 0,
      borderTopWidth: 1,
      borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: isDark ? "#4B4B4B" : "#E5E7EB",
      borderRadius: 20,
      alignSelf: "center",
      marginVertical: 12,
    },
    scrollContent: {
      paddingBottom: 20,
      flexGrow: 1,
    },
    headerCard: {
      alignItems: "center",
      paddingVertical: 20,
      marginBottom: 8,
    },
    imageContainer: {
      position: "relative",
      marginBottom: 16,
    },
    staffImageFull: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      borderColor: theme.primary,
      shadowColor: theme.primary,
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    avatarLarge: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "#4C8EF7",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#4C8EF7",
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    avatarTextLarge: {
      fontSize: 48,
      fontWeight: "800",
      color: "#fff",
    },
    loadingContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
      justifyContent: "center",
      alignItems: "center",
    },
    imageActionButton: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: theme.primary || "#4C8EF7",
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: isDark ? "#2D2D2D" : "#FFFFFF",
      shadowColor: theme.primary,
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    },
    imageOptionsMenu: {
      backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F3F4F6",
      borderRadius: 12,
      marginVertical: 12,
      overflow: "hidden",
      borderWidth: isDark ? 1 : 0,
      borderColor: "rgba(255,255,255,0.1)",
    },
    imageOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    },
    imageOptionText: {
      marginLeft: 12,
      fontSize: 14,
      fontWeight: "600",
    },
    uploadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      borderRadius: 60,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    uploadingText: {
      color: "#fff",
      marginTop: 8,
      fontWeight: "600",
    },
    name: {
      fontSize: 24,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
      marginBottom: 4,
    },
    role: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginBottom: 12,
      fontWeight: "500",
    },
    statusPill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      alignSelf: "center",
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    activePill: {
      backgroundColor: isDark ? "rgba(16,185,129,0.2)" : "#D1FAE5",
    },
    inactivePill: {
      backgroundColor: isDark ? "rgba(239,68,68,0.2)" : "#FEE2E2",
    },
    statusText: {
      fontSize: 12,
      fontWeight: "700",
      color: isDark ? "#10B981" : "#059669",
    },
    actionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      gap: 8,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
    actionText: {
      color: "#fff",
      fontWeight: "600",
      marginTop: 6,
      fontSize: 11,
    },
    sectionCard: {
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F9FAFB",
      padding: 16,
      borderRadius: 16,
      marginTop: 12,
      borderWidth: isDark ? 1 : 0,
      borderColor: "rgba(255,255,255,0.1)",
      shadowColor: isDark ? "#000000" : "#4C8EF7",
      shadowOpacity: isDark ? 0.2 : 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: {
      fontWeight: "700",
      marginLeft: 10,
      color: theme.text,
      fontSize: 16,
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB",
      marginBottom: 12,
    },
    infoRow: {
      paddingVertical: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB",
    },
    infoLabel: {
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 20,
    },
    addressCard: {
      backgroundColor: isDark ? "rgba(76, 142, 247, 0.1)" : "rgba(76, 142, 247, 0.08)",
      padding: 12,
      borderRadius: 12,
      marginVertical: 8,
      flexDirection: "row",
      alignItems: "flex-start",
      borderLeftWidth: 3,
      borderLeftColor: theme.primary,
    },
    addressText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "500",
      lineHeight: 18,
    },
    primaryBtn: {
      marginTop: 16,
      backgroundColor: theme.primary || "#4C8EF7",
      padding: 16,
      borderRadius: 14,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      shadowColor: theme.primary,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
      marginLeft: 8,
    },
    secondaryBtn: {
      marginTop: 12,
      marginBottom: 16,
      backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB",
      padding: 14,
      borderRadius: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
    },
    secondaryText: {
      color: theme.text,
      fontWeight: "600",
      fontSize: 16,
    },
  });
}