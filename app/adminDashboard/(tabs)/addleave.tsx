import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Student {
    id: string;
    name: string;
    rollNumber: string;
}

// Dummy student list – replace with API data
const STUDENTS: Student[] = [
    { id: "1", name: "Aarav Patel", rollNumber: "23" },
    { id: "2", name: "Riya Sharma", rollNumber: "14" },
    { id: "3", name: "Arjun Singh", rollNumber: "05" },
];

export default function AddStudentLeaveScreen() {
    const router = useRouter();
    const themeState = useContext(ThemeContext);
    if (!themeState) return null;
    const { theme } = themeState;
    const styles = getStyles(theme);
    // UI States
    const [studentModal, setStudentModal] = useState(false);
    const [leaveTypeModal, setLeaveTypeModal] = useState(false);
    const [previewModal, setPreviewModal] = useState(false);

    // Data States
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [leaveType, setLeaveType] = useState("");
    const [reason, setReason] = useState("");

    // Date Range
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    // Attachment
    const [attachment, setAttachment] = useState<any>(null);

    const leaveTypes = ["Full Day Leave", "Half Day Leave", "Sick Leave", "Casual Leave"];

    // Pick Image
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setAttachment({ uri: result.assets[0].uri, type: "image" });
        }
    };

    // Pick PDF
    const pickDocument = async () => {
        const res = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });

        // if (res.type === "success") {
        //   setAttachment({ uri: res.uri, type: "pdf" });
        // }
    };

    // Format date
    const formatDate = (d: Date | null) =>
        d ? d.toLocaleDateString("en-GB") : "Select";

    // Submit to Firebase (Example)
    const submitLeave = async () => {
        const payload = {
            studentName: selectedStudent?.name,
            rollNumber: selectedStudent?.rollNumber,
            fromDate: fromDate?.toISOString(),
            toDate: toDate?.toISOString(),
            leaveType,
            reason,
            attachment,
        };

        // console.log("SUBmitting leave:", payload);

        // POST → Firebase/Supabase/Node API here
        // await fetch("YOUR_API_URL", { method: "POST", body: JSON.stringify(payload) })

        setPreviewModal(false);
        router.replace("/staffDashboard/(tabs)/TeacherLeaveApprovalScreen")
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={26}  color={theme.mode === "dark" ? "#E9EFFC" : "#111827"} onPress={() => router.replace("/staffDashboard/(tabs)/TeacherLeaveApprovalScreen")} />
                <Text style={styles.headerText}>Add Leave</Text>
                <View style={{ width: 20 }} />
            </View>

            {/* Select Student */}
            <Text style={styles.label}>Select Student</Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setStudentModal(true)}>
                <Text>
                    {selectedStudent
                        ? `${selectedStudent.name} (Roll ${selectedStudent.rollNumber})`
                        : "Choose Student"}
                </Text>
                <Ionicons name="chevron-down" size={18}  color={theme.mode === "dark" ? "#E9EFFC" : "#111827"}/>
            </TouchableOpacity>

            {/* Student Modal */}
            <Modal transparent visible={studentModal} animationType="fade">
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setStudentModal(false)}
                    style={styles.modalBg}
                >
                    <TouchableOpacity activeOpacity={1} style={styles.modalBox}>
                        {/* Modal content here */}
                        {STUDENTS.map((s) => (
                            <TouchableOpacity
                                key={s.id}
                                style={styles.modalItem}
                                onPress={() => {
                                    setSelectedStudent(s);
                                    setStudentModal(false);
                                }}
                            >
                                <Text>{s.name} (Roll {s.rollNumber})</Text>
                            </TouchableOpacity>
                        ))}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>


            {/* Date From */}
            <Text style={styles.label}>From Date</Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setShowFromPicker(true)}>
                <Text>{formatDate(fromDate)}</Text>
                <Ionicons name="calendar-outline" size={18}  color={theme.mode === "dark" ? "#E9EFFC" : "#111827"} />
            </TouchableOpacity>

            {showFromPicker && (
                <DateTimePicker
                    value={fromDate || new Date()}
                    mode="date"
                    display="calendar"
                    onChange={(e, date) => {
                        setShowFromPicker(false);
                        if (date) setFromDate(date);
                    }}
                />
            )}

            {/* Date To */}
            <Text style={styles.label}>To Date</Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setShowToPicker(true)}>
                <Text>{formatDate(toDate)}</Text>
                <Ionicons name="calendar-outline" size={18}  color={theme.mode === "dark" ? "#E9EFFC" : "#111827"} />
            </TouchableOpacity>

            {showToPicker && (
                <DateTimePicker
                    value={toDate || new Date()}
                    mode="date"
                    display="calendar"
                    onChange={(e, date) => {
                        setShowToPicker(false);
                        if (date) setToDate(date);
                    }}
                />
            )}

            {/* Leave Type */}
            <Text style={styles.label}>Leave Type</Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setLeaveTypeModal(true)}>
                <Text>{leaveType || "Choose Leave Type"}</Text>
                <Ionicons name="chevron-down" size={18}  color={theme.mode === "dark" ? "#E9EFFC" : "#111827"}/>
            </TouchableOpacity>

            {/* Modal */}
            <Modal transparent visible={leaveTypeModal} animationType="fade">
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setLeaveTypeModal(false)}
                    style={styles.modalBg}
                >
                    <TouchableOpacity activeOpacity={1} style={styles.modalBox}>
                        {leaveTypes.map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={styles.modalItem}
                                onPress={() => {
                                    setLeaveType(type);
                                    setLeaveTypeModal(false);
                                }}
                            >
                                <Text>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Reason */}
            <Text style={styles.label}>Reason</Text>
            <TextInput
                style={styles.textArea}
                multiline
                placeholder="Enter reason..."
                value={reason}
                onChangeText={setReason}
            />

            {/* Attachments */}
            <Text style={styles.label}>Attachment</Text>
            <View style={styles.attachmentRow}>
                <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                    <Ionicons name="image-outline" size={20}  color={theme.mode === "dark" ? "#E9EFFC" : "#111827"} />
                    <Text style={{ marginLeft: 6 }}>Image</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.attachBtn} onPress={pickDocument}>
                    <Ionicons name="document-outline" size={20}  color={theme.mode === "dark" ? "#E9EFFC" : "#111827"} />
                    <Text style={{ marginLeft: 6 }}>PDF</Text>
                </TouchableOpacity>
            </View>

            {/* Preview of uploaded file */}
            {
                attachment ? (
                    <View style={styles.previewContainer}>
                        {attachment.type === "image" ? (
                            <Image
                                source={{ uri: attachment.uri }}
                                style={{ width: 100, height: 100, borderRadius: 8 }}
                            />
                        ) : (
                            <Text>📄 PDF Attached</Text>
                        )}
                    </View>
                ) : null
            }

            {/* Submit button */}
            <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => setPreviewModal(true)}
            >
                <Text style={styles.submitText}>Preview & Submit</Text>
            </TouchableOpacity>

            {/* Preview Modal */}
            <Modal transparent visible={previewModal} animationType="slide">
                <View style={styles.previewModalBg}>
                    <View style={styles.previewModalBox}>
                        <Text style={styles.previewTitle}>Confirm Leave</Text>

                        <Text>Student: {selectedStudent?.name}</Text>
                        <Text>Roll No: {selectedStudent?.rollNumber}</Text>
                        <Text>Date: {formatDate(fromDate)} → {formatDate(toDate)}</Text>
                        <Text>Type: {leaveType}</Text>
                        <Text>Reason: {reason}</Text>

                        <TouchableOpacity
                            style={[styles.submitBtn, { marginTop: 20 }]}
                            onPress={submitLeave}
                        >
                            <Text style={styles.submitText}>Submit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setPreviewModal(false)}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </ScrollView >
    );
}

function getStyles(theme: Theme) {
    const isDark = theme.mode === "dark";
  
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
      },
  
      /* ---------- Header ---------- */
      header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        justifyContent: "space-between",
      },
  
      headerText: {
        fontSize: 20,
        fontWeight: "700",
        color: isDark ? "#E9EFFC" : "#111827",
      },
  
      /* ---------- Labels ---------- */
      label: {
        marginTop: 16,
        marginLeft: 16,
        fontWeight: "600",
        fontSize: 14,
        color: isDark ? "#D4D4D8" : "#111827",
      },
  
      /* ---------- Inputs ---------- */
      inputBox: {
        marginHorizontal: 16,
        marginTop: 6,
        padding: 14,
        backgroundColor:"#F7F7F7",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: !isDark ? "#1F2937" : "#DDD",
        flexDirection: "row",
        justifyContent: "space-between",
      },
  
      textArea: {
        marginHorizontal: 16,
        marginTop: 6,
        backgroundColor: "#F7F7F7",
        borderRadius: 10,
        height: 100,
        padding: 14,
        borderWidth: 1,
        borderColor: isDark ? "#1F2937" : "#DDD",
        textAlignVertical: "top",
        color: isDark ? "#F4F4F5" : "#111827",
      },
  
      /* ---------- Modal ---------- */
      modalBg: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
      },
  
      modalBox: {
        width: "80%",
        backgroundColor:"#FFFFFF",
        borderRadius: 10,
        paddingVertical: 12,
      },
  
      modalItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor:"#EEE",
      },
  
      /* ---------- Attachment ---------- */
      attachmentRow: {
        flexDirection: "row",
        marginHorizontal: 16,
        marginTop: 10,
      },
  
      attachBtn: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 16,
        padding: 10,
        backgroundColor:"#EEE",
        borderRadius: 8,
      },
  
      previewContainer: {
        marginTop: 12,
        marginLeft: 16,
      },
  
      /* ---------- Buttons ---------- */
      submitBtn: {
        backgroundColor: "#4C8EF7",
        padding: 16,
        marginTop: 20,
        marginHorizontal: 16,
        alignItems: "center",
        borderRadius: 10,
      },
  
      submitText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
      },
  
      cancelText: {
        marginTop: 12,
        textAlign: "center",
        color: "#EF4444",
      },
  
      /* ---------- Preview Modal ---------- */
      previewModalBg: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
      },
  
      previewModalBox: {
        width: "85%",
        backgroundColor: isDark ? "#111318" : "#FFFFFF",
        padding: 20,
        borderRadius: 10,
      },
  
      previewTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 10,
        color: isDark ? "#F4F4F5" : "#111827",
      },
    });
  }
  
