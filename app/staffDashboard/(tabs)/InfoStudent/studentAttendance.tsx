import { ThemeContext } from '@/action/theme/ThemeContext';
import { Theme } from '@/action/theme/themeReducer';
import { MONTHS, daysInMonth } from '@/components/CommonUtils';
import { API_BASE_URL } from '@/config';
import { getDeviceId } from '@/helper/getDeviceId';
import { getBase64ImageUri } from '@/helper/getImageMimeTypeandURI';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';
import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import {
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
type ParentScreenPath =
  | "/adminDashboard/(tabs)/InfoStudent/parentscreen"
  | "/staffDashboard/(tabs)/InfoStudent/parentscreen"
  | "/(auth)/home";


export default function StudentAttendance() {
    const [path, setPath] = useState<ParentScreenPath>("/(auth)/home");
    const [role, setRole] = useState<string | null>(null);
    
    useEffect(() => {
      const loadRole = async () => {
        const storedRole = await AsyncStorage.getItem("auth_role");
        setRole(storedRole);
    
        if (storedRole === "ADMIN") {
          setPath("/adminDashboard/(tabs)/InfoStudent/parentscreen");
        } else if (storedRole === "STAFF") {
          setPath("/staffDashboard/(tabs)/InfoStudent/parentscreen");
        }
      };
    
      loadRole();
    }, []);
    const router = useRouter();
    const { details } = useLocalSearchParams<{ details?: string }>();  
    const userDetail = details ? JSON.parse(details) : null;
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth());
    const [year, setYear] = useState(today.getFullYear());
    const [student, setStudent] = useState<any>(null);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const themeState = useContext(ThemeContext);
    if (!themeState) return null;
    const { theme } = themeState;
    const styles = getStyles(theme);

    /* ---------------- STATUS STYLE ---------------- */
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Present':
                return { color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle' };
            case 'Absent':
                return { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle' };
            case 'Leave':
                return { color: '#F59E0B', bg: '#FEF3C7', icon: 'time' };
            default:
                return { color: '#6B7280', bg: '#F3F4F6', icon: 'help-circle' };
        }
    };

    /* ---------------- STATUS MAPPER ---------------- */
    const mapStatus = (status: string, label?: string) => {
        if (label === 'Present') return 'Present';
        if (label === 'Absent') return 'Absent';
        if (label === 'Leave' || label === 'Excused') return 'Leave';
        return 'None';
    };

    /* ---------------- MONTH NAV ---------------- */
    const nextMonth = () => {
        if (month === 11) {
            setMonth(0);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    };

    const prevMonth = () => {
        if (month === 0) {
            setMonth(11);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const buildCalendarDays = () => {
        const firstDayIndex =
            moment(`${year}-${month + 1}-01`, 'YYYY-M-D').isoWeekday() - 1; // Mon=0

        const daysInCurrentMonth = daysInMonth(month, year);
        const daysInPrevMonth = daysInMonth(month - 1 < 0 ? 11 : month - 1, month === 0 ? year - 1 : year);

        const calendarDays: {
            day: number;
            monthType: 'prev' | 'current' | 'next';
        }[] = [];

        // PREVIOUS MONTH DAYS
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            calendarDays.push({
                day: daysInPrevMonth - i,
                monthType: 'prev',
            });
        }

        // CURRENT MONTH DAYS
        for (let d = 1; d <= daysInCurrentMonth; d++) {
            calendarDays.push({
                day: d,
                monthType: 'current',
            });
        }

        // NEXT MONTH DAYS (fill till 42)
        const remaining = 42 - calendarDays.length;
        for (let i = 1; i <= remaining; i++) {
            calendarDays.push({
                day: i,
                monthType: 'next',
            });
        }

        return calendarDays;
    };


    /* ---------------- FETCH API ---------------- */
    useEffect(() => {
        fetchAttendance();
    }, [month, year]);

    const fetchAttendance = async () => {
        try {
                 if (!userDetail?.id) {
                console.warn("Student ID missing, cannot fetch attendance");
                return;
              }
            setLoading(true);
            const deviceId = await getDeviceId();
            const token = await AsyncStorage.getItem('auth_token');
            const encodedTenant = await AsyncStorage.getItem('auth_tenant');
            if (!token || !encodedTenant) throw new Error('Auth missing');

            const tenantId = Buffer.from(encodedTenant, 'base64').toString('utf-8');

            const res = await axios.get(
                `${API_BASE_URL}attendance/getStudentAttendanceByMonth/${userDetail.id}?month=${month + 1}&year=${year}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-Tenant-ID': tenantId,
                        'X-Device-ID': deviceId
                    },
                }
            );
            setStudent(res.data);
            setAttendanceRecords(res.data.dailyAttendance || []);
        } catch (err) {
            console.error('Attendance API error:', err);
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- STATS (FROM BACKEND) ---------------- */
    const presentDays = student?.presentDays ?? 0;
    const absentDays = student?.absentDays ?? 0;
    const leaveDays = student?.excusedDays ?? 0;
    const attendancePercentage = student?.attendancePercentage ?? 0;

    const totalDays = daysInMonth(month, year);

    /* ---------------- UI ---------------- */
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace(path as any)}>
                    <Ionicons name="arrow-back" size={26} style={styles.headerButton} />
                </TouchableOpacity>
                <View /> 
                <Text style={styles.headerTitle}>Attendance</Text>
            </View>

            {/* STUDENT CARD */}
            {userDetail ? (
                <View style={styles.studentCard}>
                    <View style={styles.avatar}>
                        <Image
                            source={{ uri: getBase64ImageUri(userDetail.studentImage)! }}
                            style={styles.profileImage}
                        />
                    </View>
                    <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{userDetail.studentName}</Text>
                        <Text style={styles.studentDetails}>
                            Roll No: {userDetail.admissionNumber} • {userDetail.studentClass}
                        </Text>
                    </View>
                </View>
            ) : (
                <Text>Loading student info...</Text>
            )}

            {/* STATS */}
            <View style={styles.statsRow}>
                <View style={styles.overallCard}>
                    <Text style={styles.overallLabel}>Overall</Text>
                    <Text style={styles.overallPercent}>{attendancePercentage}%</Text>
                    <View style={styles.progressBarBG}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${attendancePercentage}%` } as ViewStyle,
                            ]}
                        />
                    </View>
                </View>

                <View style={styles.miniStats}>
                    <View style={styles.miniCard}>
                        <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                        <Text style={styles.miniNumber}>{presentDays}</Text>
                        <Text style={styles.miniLabel}>Present</Text>
                    </View>

                    <View style={styles.miniCard}>
                        <Ionicons name="close-circle" size={28} color="#EF4444" />
                        <Text style={styles.miniNumber}>{absentDays}</Text>
                        <Text style={styles.miniLabel}>Absent</Text>
                    </View>

                    <View style={styles.miniCard}>
                        <Ionicons name="time" size={28} color="#F59E0B" />
                        <Text style={styles.miniNumber}>{leaveDays}</Text>
                        <Text style={styles.miniLabel}>Leave</Text>
                    </View>
                </View>
            </View>

            {/* MONTH SELECTOR */}
            <View style={styles.monthSelector}>
                <TouchableOpacity onPress={prevMonth}>
                    <Ionicons name="chevron-back" size={20} />
                </TouchableOpacity>
                <Text style={styles.monthText}>
                    {MONTHS[month]} {year}
                </Text>
                <TouchableOpacity onPress={nextMonth}>
                    <Ionicons name="chevron-forward" size={20} />
                </TouchableOpacity>
            </View>

            {/* CALENDAR */}
            <View style={styles.calendarCard}>
                <Text style={styles.sectionTitle}>Attendance Calendar</Text>

                <View style={styles.weekRow}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <Text key={d} style={styles.weekDay}>{d}</Text>
                    ))}
                </View>

                <View style={styles.calendarGrid}>
                    {buildCalendarDays().map((item, index) => {
                        const { day, monthType } = item;

                        let record = null;

                        if (monthType === 'current') {
                            record = attendanceRecords.find(r => {
                                const d = moment(r.date, 'DD-MM-YYYY');
                                return (
                                    d.date() === day &&
                                    d.month() === month &&
                                    d.year() === year
                                );
                            });
                        }

                        const status =
                            monthType === 'current' && record
                                ? mapStatus(record.status, record.statusLabel)
                                : 'None';

                        const styleX = getStatusStyle(status);

                        const isToday =
                            monthType === 'current' &&
                            today.getDate() === day &&
                            today.getMonth() === month &&
                            today.getFullYear() === year;

                        return (
                            <View key={index} style={styles.dayCell}>
                                <View
                                    style={[
                                        styles.dayInner,
                                        {
                                            backgroundColor:
                                                monthType === 'current' ? styleX.bg : '#F9FAFB',
                                            borderColor:
                                                monthType === 'current' ? styleX.color : '#E5E7EB',
                                            opacity: monthType === 'current' ? 1 : 0.35,
                                            borderWidth: isToday ? 2 : 1,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={{
                                            fontWeight: '700',
                                            color:
                                                monthType === 'current'
                                                    ? styleX.color
                                                    : '#9CA3AF',
                                        }}
                                    >
                                        {day}
                                    </Text>

                                    {monthType === 'current' && status !== 'None' && (
                                        <View
                                            style={[
                                                styles.statusDot,
                                                { backgroundColor: styleX.color },
                                            ]}
                                        />
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>


            </View>
        </ScrollView>
    );
}

function getStyles(theme: Theme) {
    let isDark = theme.mode === "dark";
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            // paddingHorizontal: 18,
            backgroundColor: theme.background,
        },

        /* HEADER */
        header: {
            // paddingTop: 35,

            paddingTop: Platform.OS === 'ios' ? 60 : 50,
            flexDirection: "row",
            // justifyContent: "space-between",
            gap: 50,
            alignItems: "center",
        },
        headerButton: {
            padding: 8,
            color: !isDark
                ? '#000104'
                : '#E9EFFC',
        },
        headerTitle: {
            fontSize: 22,
            fontWeight: "700",
            color: !isDark
                ? '#000104'
                : '#E9EFFC',
        },
        profileImage: {
            width: 56,
            height: 56,
            borderRadius: 28,
            borderWidth: 3,
            borderColor: isDark
                ? 'rgba(139, 92, 246, 0.5)'
                : '#fff',
        },

        /* STUDENT CARD */
        studentCard: {
            marginTop: 13,
            backgroundColor: isDark
                ? '#000104'
                : '#D6DFDE',
            padding: 13,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: isDark
                ? '#000104'
                : '#E9EFFC',
            shadowOpacity: 0.1,
            elevation: 6,
            marginHorizontal: 14,
        },
        avatar: {
            width: 60,
            height: 60,
            borderRadius: 50,
            backgroundColor: "#2563EB",
            justifyContent: "center",
            alignItems: "center",
        },
        avatarText: {
            color: "#fff",
            fontSize: 28,
            fontWeight: "700",
        },
        studentInfo: {
            marginLeft: 16,
        },
        studentName: {
            fontSize: 18,
            fontWeight: "700",
            color: !isDark
                ? '#000104'
                : '#E9EFFC',
        },
        studentDetails: {
            fontSize: 14,
            color: "#6B7280",
            marginTop: 3,
        },

        statsRow: {
            marginTop: 8,
            marginHorizontal: 14,
        },

        overallCard: {
            backgroundColor: isDark
                ? '#000104'
                : '#D6DFDE',
            padding: 12,
            borderRadius: 16,
            marginBottom: 15,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            elevation: 5,

        },
        overallLabel: {
            fontSize: 15,
            color: "#6B7280",
        },
        overallPercent: {
            fontSize: 24,
            fontWeight: "800",
            marginVertical: 4,
            color: "#2563EB",
        },
        progressBarBG: {
            width: "100%",
            height: 8,
            backgroundColor: "#E5E7EB",
            borderRadius: 10,
            marginTop: 6,
        },
        progressBarFill: {
            height: 8,
            backgroundColor: "#2563EB",
            borderRadius: 10,
        },

        miniStats: {
            flexDirection: "row",
            justifyContent: "space-between",
        },
        miniCard: {
            width: "28.5%",
            backgroundColor: "#fff",
            paddingVertical: 4,
            borderRadius: 14,
            alignItems: "center",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            elevation: 4,
        },
        miniNumber: {
            fontSize: 18,
            fontWeight: "700",
            marginTop: 4,
            color: "#1F2937",
        },
        miniLabel: {
            fontSize: 13,
            color: "#6B7280",
            marginTop: 2,
        },
        monthSelector: {
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginVertical: 20,
        },
        monthBtn: {
            padding: 8,
            backgroundColor: "#E5E7EB",
            borderRadius: 10,
        },
        monthText: {
            fontSize: 16,
            fontWeight: "700",
            marginHorizontal: 14,
            color: !isDark
                ? '#000104'
                : '#E9EFFC',
        },

        /* LIST */
        listWrapper: {
            marginTop: 5,
            marginHorizontal: 14,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: "700",
            marginBottom: 12,
            color: "#111827",
        },

        listItem: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#fff",
            padding: 16,
            borderRadius: 14,
            marginBottom: 14,
            elevation: 4,
            marginHorizontal: 14,
        },

        dateBlock: {
            width: 60,
            alignItems: "center",
        },
        dateDay: {
            fontSize: 22,
            fontWeight: "800",
            color: "#111827",
        },
        dateMonth: {
            fontSize: 13,
            color: "#6B7280",
        },
        dateWeekday: {
            fontSize: 12,
            color: "#9CA3AF",
            marginTop: 3,
        },

        statusContainer: {
            flex: 1,
            paddingLeft: 16,
        },
        statusBadge: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 12,
        },
        statusText: {
            marginLeft: 5,
            fontSize: 14,
            fontWeight: "600",
        },

        dot: {
            width: 12,
            height: 12,
            borderRadius: 10,
        },

        calendarWrapper: {
            marginTop: 10,
        },

        calendarGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            backgroundColor: "#fff",
            padding: 10,
            borderRadius: 14,
            elevation: 4,
        },

        calendarCell: {
            width: "13.5%",
            aspectRatio: 1,
            marginBottom: 8,
            borderRadius: 10,
            borderWidth: 2,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#ffffff",
            marginHorizontal: 14,
        },

        calendarDay: {
            fontSize: 12,
            fontWeight: "700",
        },

        calendarDot: {
            width: 8,
            height: 8,
            borderRadius: 10,
            marginBottom: 3,
        },
        calendarCard: {
            backgroundColor: "#ffffff",
            padding: 16,
            borderRadius: 18,
            elevation: 6,
            marginBottom: 20,
            marginTop: 10,
            marginHorizontal: 14,
        },

        weekRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
        },

        weekDay: {
            width: "14.28%",
            textAlign: "center",
            fontSize: 13,
            fontWeight: "700",
            color: "#6B7280",
        },
        //  calendarGrid: {
        //   flexDirection: "row",
        //   flexWrap: "wrap",
        // },

        dayCell: {
            width: "14.28%",
            aspectRatio: 1,
            padding: 3,
        },

        dayInner: {
            flex: 1,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
        },

        statusDot: {
            width: 8,
            height: 8,
            borderRadius: 6,
            marginTop: 4,
        },

    });
    return styles;
}
