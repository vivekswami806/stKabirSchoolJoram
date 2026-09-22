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
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ToastService } from "react-native-toastier";

interface Props {
  visible: boolean;
  student: any;
  onClose: () => void;
}

export default function StudentDetail({ visible, student, onClose }: Props) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  if (!student) return null;
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const isDark = theme.mode === "dark";
  const styles = getStyles(theme);

  const isValidBase64Image = (str: string) => {
    if (!str) return false;
    return str.length > 0 && (str.startsWith("data:image") || /^\/9j\//.test(str));
  };

  const formatImageUri = (imageStr: string) => {
    if (!imageStr) return null;
    if (imageStr.startsWith("data:image")) return imageStr;
    return `data:image/jpeg;base64,${imageStr}`;
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
        await uploadStudentImage(result.assets[0].uri);
      }
      setShowImageOptions(false);
    } catch (err) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const pickImageFromCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadStudentImage(result.assets[0].uri);
      }
      setShowImageOptions(false);
    } catch (err) {
      Alert.alert("Error", "Failed to access camera");
    }
  };

  const uploadStudentImage = async (imageUri: string) => {
    if (!student?.id) return;
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
        name: `student-${student.id}.jpg`,
      } as any);

      const response = await axios.put(
        `${API_BASE_URL}student/image/${student.id}`,
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

      if (response.status == 200) {
        ToastService.show({
          type: "success",
          message: "Image updated successfully",
          duration: 3000,
        });
        student.studentImage = `data:image/jpeg;base64,${response.data.data}`;
      } else {
        throw new Error("Failed to upload image");
      }
    } catch (err: any) {console.log(err.message);
      console.log("message:", err.message);
      console.log("code:", err.code);
      console.log("response:", err.response);
      console.log("request:", err.request);
      console.log("config:", err.config);
      console.log("toJSON:", err.toJSON());
      Alert.alert("Error", err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const downloadImage = async () => {
    if (!student.studentImage) return;
    
    try {
      const fileName = `${student.studentName}-${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // Handle base64 data (not a URL)
      let base64Data = student.studentImage;
      
      // Remove data URI prefix if present
      if (base64Data.startsWith("data:image")) {
        base64Data = base64Data.split(",")[1];
      }

      // Write base64 data to file
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
      console.log(e);
      ToastService.show({
        type: "danger",
        message: "Failed to download image",
        duration: 2000,
      });
    }
  };

  const getImageUri = (image?: string) => {
    if (!image) return undefined;
    const trimmed = image.trim();
    if (trimmed.startsWith("data:image")) {
      return trimmed;
    }
    return `data:image/jpeg;base64,${trimmed}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.box} activeOpacity={1}>
          <ScrollView>
            {/* Header */}
            <View style={styles.headerCard}>
              <View style={styles.headerLeft}>
                <Text style={styles.name}>{student.studentName}</Text>
                <Text style={styles.class}>Class {student.studentClass}</Text>

                <View
                  style={[
                    styles.statusPill,
                    student.studentStatus ? styles.activePill : styles.inactivePill,
                  ]}
                >
                  <Text style={styles.statusPillText}>
                    {student.studentStatus ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>

              {/* Avatar Container */}
              <View style={styles.avatarWrapperContainer}>
                <View style={styles.avatarWrapper}>
                  {student.studentImage ? (
                  <Image
                  source={{ uri: getImageUri(student.studentImage) }}
                    style={styles.studentImageFull}
                    resizeMode="cover"
                  />
                  ) : (
                    <View
                      style={[
                        styles.avatar,
                        {
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: "#4C8EF7",
                        },
                      ]}
                    >
                      <Text style={styles.avatarInitials}>
                        {student.studentName?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.statusDot,
                      student.studentStatus ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                </View>

                {/* Camera Button */}
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={() => setShowImageOptions(!showImageOptions)}
                >
                  <Ionicons name="camera" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
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

                {student.studentImage && (
                  <TouchableOpacity
                    style={styles.imageOption}
                    onPress={downloadImage}
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

            {/* Personal Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Info</Text>
              <Text style={styles.infoText}>
                <Text style={styles.label}>DOB: </Text>
                {student.studentDateOfBirth || "N/A"}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.label}>Gender: </Text>
                {student.studentGender || "N/A"}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.label}>Admission No: </Text>
                {student.studentAdmissionNumber || "N/A"}
              </Text>
            </View>

            {/* Parents Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Parents / Guardian</Text>
              <Text style={styles.infoText}>
                <Text style={styles.label}>Father: </Text>
                {student.studentFatherName || "N/A"}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.label}>Mother: </Text>
                {student.studentMotherName || "N/A"}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.label}>Guardian: </Text>
                {student.studentGuardianName || "N/A"}
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                router.push({
                  pathname: "/staffDashboard/(tabs)/InfoStudent/studentAttendance",
                  params: { details: JSON.stringify(student) },
                });
              }}
              style={styles.closeBtn}
            >
              <Ionicons name="bar-chart-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.closeText}>View Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.secondaryBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    box: {
      backgroundColor: theme.background,
      padding: 20,
      borderRadius: 15,
      maxHeight: "90%",
    },
    headerCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: isDark ? "#1F1F1F" : "#F8FAFF",
      padding: 15,
      borderRadius: 16,
      marginBottom: 12,
      elevation: 5,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },

    headerLeft: {
      flex: 1,
      paddingRight: 12,
    },

    name: {
      fontSize: 22,
      fontWeight: "800",
      color: isDark ? "#EAF0FF" : "#0B1220",
    },

    class: {
      fontSize: 15,
      color: isDark ? "#AEB4C2" : "#4B5563",
      marginTop: 2,
    },

    statusPill: {
      marginTop: 8,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 20,
      alignSelf: "flex-start",
    },

    activePill: { backgroundColor: "#D1FAE5" },
    inactivePill: { backgroundColor: "#FEE2E2" },

    statusPillText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#111",
    },

    avatarWrapperContainer: {
      position: "relative",
      alignItems: "center",
    },

    avatarWrapper: {
      position: "relative",
    },

    avatar: {
      width: 86,
      height: 86,
      borderRadius: 43,
      borderWidth: 3,
      borderColor: "#4C8EF7",
      backgroundColor: "#E5E7EB",
    },

    avatarInitials: {
      fontSize: 32,
      fontWeight: "800",
      color: "#fff",
    },

    statusDot: {
      position: "absolute",
      bottom: 4,
      right: 4,
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: "#fff",
    },

    dotActive: { backgroundColor: "#22C55E" },
    dotInactive: { backgroundColor: "#EF4444" },

    cameraButton: {
      position: "absolute",
      bottom: -8,
      right: -8,
      backgroundColor: theme.primary || "#4C8EF7",
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: isDark ? "#1F1F1F" : "#F8FAFF",
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },

    imageOptionsMenu: {
      backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F3F4F6",
      borderRadius: 12,
      marginBottom: 12,
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
      backgroundColor: "rgba(0,0,0,0.7)",
      borderRadius: 12,
      paddingVertical: 24,
      paddingHorizontal: 16,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },

    uploadingText: {
      color: "#fff",
      marginTop: 8,
      fontWeight: "600",
    },

    statusBadge: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginTop: 10,
      alignSelf: "flex-start",
    },
    present: { backgroundColor: "#7FFB8D" },
    absent: { backgroundColor: "#FA5A5A" },
    statusText: { fontWeight: "700", textTransform: "capitalize" },
    section: {
      marginTop: 15,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#555" : "#EEE",
      paddingTop: 10,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 5,
      color: isDark ? "#E9EFFC" : "#000104",
    },
    infoText: {
      fontSize: 14,
      marginVertical: 1,
      color: isDark ? "#C5C7D0" : "#333",
    },
    label: { fontWeight: "600" },
    addressCard: {
      backgroundColor: isDark ? "#2C2C2C" : "#F4F4F4",
      borderRadius: 8,
      padding: 10,
      marginVertical: 5,
    },
    closeBtn: {
      marginTop: 20,
      backgroundColor: "#4C8EF7",
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 10,
      flexDirection: "row",
      justifyContent: "center",
    },
    secondaryBtn: {
      backgroundColor: isDark ? "#444" : "#888",
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 10,
    },
    studentImageFull: {
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
    closeText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  });
}