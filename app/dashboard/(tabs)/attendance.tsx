import { RootState } from '@/action/store';
import { ThemeContext } from '@/action/theme/ThemeContext';
import { Theme } from '@/action/theme/themeReducer';
import { MONTHS, daysInMonth } from '@/app/CommonUtils';
import { API_BASE_URL } from '@/config';
import { getDeviceId } from '@/helper/getDeviceId';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';
import { useRouter } from 'expo-router';
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
import { useSelector } from 'react-redux';

export default function StudentAttendance() {
  const router = useRouter();
  const { userDetail } = useSelector((state: RootState) => state.user);
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const [student, setStudent] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    const loadRole = async () => {
      const storedRole = await AsyncStorage.getItem("auth_role");
      setRole(storedRole);
    };
    loadRole();
  }, []);
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);

  /* ---------------- STATUS STYLE ---------------- */
  const getStatusStyle = (status: string) => {
    if (theme.mode === "dark") {
      switch (status) {
        case 'Present':
          return { color: '#34D399', bg: '#064E3B', icon: 'checkmark-circle' };
        case 'Absent':
          return { color: '#F87171', bg: '#7F1D1D', icon: 'close-circle' };
        case 'Leave':
          return { color: '#FBBF24', bg: '#78350F', icon: 'time' };
        default:
          return { color: '#9CA3AF', bg: '#1F2937', icon: 'help-circle' };
      }
    }
  
    return {
      Present: { color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle' },
      Absent: { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle' },
      Leave: { color: '#F59E0B', bg: '#FEF3C7', icon: 'time' },
    }[status] || { color: '#6B7280', bg: '#F3F4F6', icon: 'help-circle' };
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
        <TouchableOpacity onPress={() => router.push('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={26} style={styles.headerButton} />
        </TouchableOpacity>
        <View />
        <Text style={styles.headerTitle}>Attendance</Text>
      </View>

      {/* STUDENT CARD */}
      {userDetail ? (
        <View style={styles.studentCard}>
                        <View style={styles.avatar}>
                {role === "PARENT" ? (
                userDetail?.studentImage ? (
                  <Image
                    source={{ uri: `data:image/png;base64,${userDetail.studentImage}` }}
                    style={styles.profileImage}
                  />
                ) : (
                  <Image
                    source={{
                      uri: `https://ui-avatars.com/api/?name=${userDetail?.studentName || 'User'}&background=8B5CF6&color=fff&size=200&bold=true`,
                    }}
                    style={styles.profileImage}
                  />
                )
              ) : userDetail?.staffImage ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${userDetail.staffImage}` }}
                  style={styles.profileImage}
                />
              ) : (
                <Image
                  source={{
                    uri: `https://ui-avatars.com/api/?name=${userDetail?.name || 'User'}&background=8B5CF6&color=fff&size=200&bold=true`,
                  }}
                  style={styles.profileImage}
                />
              )}
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

          {/* <View style={styles.miniCard}>
            <Ionicons name="close-circle" size={28} color="#EF4444" />
            <Text style={styles.miniNumber}>{absentDays}</Text>
            <Text style={styles.miniLabel}>Absent</Text>
          </View> */}

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
          <Ionicons name="chevron-back" size={20} color={theme.mode === "dark" ? "#fff": "#000"} />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {MONTHS[month]} {year}
        </Text>
        <TouchableOpacity onPress={nextMonth}>
          <Ionicons name="chevron-forward" size={20} color={theme.mode === "dark" ? "#fff": "#000"}  />
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
  const isDark = theme.mode === "dark";

  /* ---------------- COLOR SYSTEM ---------------- */

  const colors = {
    background: isDark ? "#1e2225" : "#F8FAFC",
    surface: isDark ?  "rgba(30,41,59,0.8)" : "#FFFFFF",
    surfaceSoft: isDark ? "#1F2937" : "#F1F5F9",

    textPrimary: isDark ? "#F9FAFB" : "#0F172A",
    textSecondary: isDark ? "#9CA3AF" : "#64748B",
    textMuted: isDark ? "#6B7280" : "#94A3B8",

    border: isDark ? "rgba(255,255,255,0.2)" : "#E2E8F0",

    primary: "#2563EB",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
  };

  return StyleSheet.create({
    /* ---------------- CONTAINER ---------------- */

    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    /* ---------------- HEADER ---------------- */

    header: {
      paddingTop: Platform.OS === "ios" ? 40 : 40,
      flexDirection: "row",
      alignItems: "center",
      // justifyContent: "space-b",
      paddingHorizontal: 18,
    },

    headerButton: {
      padding: 8,
      color: colors.textPrimary,
    },

    headerTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    /* ---------------- STUDENT CARD ---------------- */

    studentCard: {
      marginTop: 16,
      marginHorizontal: 16,
      padding: 14,
      borderRadius: 24,
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: isDark ? 0 : 6,
    
      borderWidth: 1,
      borderColor: colors.border,
    },

    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },

    profileImage: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: isDark
        ? "rgba(255,255,255,0.1)"
        : "#FFFFFF",
    },

    studentInfo: {
      marginLeft: 16,
    },

    studentName: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    studentDetails: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },

    /* ---------------- STATS ---------------- */

    statsRow: {
      marginTop: 20,
      marginHorizontal: 16,
    },

    overallCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 24,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 12,
      elevation: isDark ? 0 : 4,
    },

    overallLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },

    overallPercent: {
      fontSize: 28,
      fontWeight: "900",
      marginVertical: 6,
      color: colors.primary,
    },
    progressBarBG: {
      width: "100%",
      height: 10,
      backgroundColor: isDark ? "#1F2937" : "#E2E8F0",
      borderRadius: 30,
      marginTop: 8,
      overflow: "hidden",
    },
    
    progressBarFill: {
      height: 10,
      backgroundColor: colors.primary,
      borderRadius: 30,
    },

    /* ---------------- MINI STATS ---------------- */

    miniStats: {
      flexDirection: "row",
      justifyContent: "space-between",
    },

    miniCard: {
      width: "48%",
      backgroundColor: colors.surface,
      paddingVertical: 18,
      borderRadius: 22,
      alignItems: "center",
    
      borderWidth: 1,
      borderColor: colors.border,
    
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.25 : 0.06,
      shadowRadius: 8,
      elevation: isDark ? 0 : 4,
    },

    miniNumber: {
      fontSize: 20,
      fontWeight: "800",
      marginTop: 6,
      color: colors.textPrimary,
    },

    miniLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },

    /* ---------------- MONTH SELECTOR ---------------- */

    monthSelector: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginVertical: 24,
    },

    monthText: {
      fontSize: 17,
      fontWeight: "800",
      marginHorizontal: 16,
      color: colors.textPrimary,
    },

    /* ---------------- CALENDAR ---------------- */

    calendarCard: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 26,
      marginHorizontal: 16,
      marginBottom: 24,
    
      borderWidth: 1,
      borderColor: colors.border,
    
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 14,
      elevation: isDark ? 0 : 6,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 16,
      color: colors.textPrimary,
    },

    weekRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },

    weekDay: {
      width: "14.28%",
      textAlign: "center",
      fontSize: 12,
      fontWeight: "700",
      color: colors.textMuted,
    },

    calendarGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },

    dayCell: {
      width: "14.28%",
      aspectRatio: 1,
      padding: 4,
    },

    dayInner: {
      flex: 1,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },

    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 10,
      marginTop: 4,
    },
  });
}


// function getStyles(theme: Theme) {
//   let isDark = theme.mode === "dark";
//   const styles = StyleSheet.create({
//     container: {
//       flex: 1,
//       // paddingHorizontal: 18,
//       backgroundColor: theme.background,
//     },

//     /* HEADER */
//     header: {
//       // paddingTop: 35,

//       paddingTop: Platform.OS === 'ios' ? 60 : 50,
//       flexDirection: "row",
//       // justifyContent: "space-between",
//       gap: 50,
//       alignItems: "center",
//     },
//     headerButton: {
//       padding: 8,
//       color: !isDark
//         ? '#000104'
//         : '#E9EFFC',
//     },
//     headerTitle: {
//       fontSize: 22,
//       fontWeight: "700",
//       color: !isDark
//         ? '#000104'
//         : '#E9EFFC',
//     },
//     profileImage: {
//       width: 56,
//       height: 56,
//       borderRadius: 28,
//       borderWidth: 3,
//       borderColor: isDark
//         ? 'rgba(139, 92, 246, 0.5)'
//         : '#fff',
//     },

//     /* STUDENT CARD */
//     studentCard: {
//       marginTop: 13,
//       backgroundColor: isDark
//         ? '#000104'
//         : '#D6DFDE',
//       padding: 13,
//       borderRadius: 16,
//       flexDirection: "row",
//       alignItems: "center",
//       shadowColor: isDark
//         ? '#000104'
//         : '#E9EFFC',
//       shadowOpacity: 0.1,
//       elevation: 6,
//       marginHorizontal: 14,
//     },
//     avatar: {
//       width: 60,
//       height: 60,
//       borderRadius: 50,
//       backgroundColor: "#2563EB",
//       justifyContent: "center",
//       alignItems: "center",
//     },
//     avatarText: {
//       color: "#fff",
//       fontSize: 28,
//       fontWeight: "700",
//     },
//     studentInfo: {
//       marginLeft: 16,
//     },
//     studentName: {
//       fontSize: 18,
//       fontWeight: "700",
//       color: !isDark
//         ? '#000104'
//         : '#E9EFFC',
//     },
//     studentDetails: {
//       fontSize: 14,
//       color: "#6B7280",
//       marginTop: 3,
//     },

//     statsRow: {
//       marginTop: 8,
//       marginHorizontal: 14,
//     },

//     overallCard: {
//       backgroundColor: isDark
//         ? '#000104'
//         : '#D6DFDE',
//       padding: 12,
//       borderRadius: 16,
//       marginBottom: 15,
//       shadowColor: "#000",
//       shadowOpacity: 0.08,
//       elevation: 5,

//     },
//     overallLabel: {
//       fontSize: 15,
//       color: "#6B7280",
//     },
//     overallPercent: {
//       fontSize: 24,
//       fontWeight: "800",
//       marginVertical: 4,
//       color: "#2563EB",
//     },
//     progressBarBG: {
//       width: "100%",
//       height: 8,
//       backgroundColor: "#E5E7EB",
//       borderRadius: 10,
//       marginTop: 6,
//     },
//     progressBarFill: {
//       height: 8,
//       backgroundColor: "#2563EB",
//       borderRadius: 10,
//     },

//     miniStats: {
//       flexDirection: "row",
//       justifyContent: "space-around",
//     },
//     miniCard: {
//       width: "28.5%",
//       backgroundColor: isDark ? "#1127" : "#FFFFFF",
//       paddingVertical: 4,
//       borderRadius: 14,
//       alignItems: "center",
//       shadowColor: "#000",
//       shadowOpacity: 0.08,
//       elevation: 4,
//     },
//     miniNumber: {
//       fontSize: 18,
//       fontWeight: "700",
//       marginTop: 4,
//       color: "#1F2937",
//     },
//     miniLabel: {
//       fontSize: 13,
//       color: "#6B7280",
//       marginTop: 2,
//     },
//     monthSelector: {
//       flexDirection: "row",
//       justifyContent: "center",
//       alignItems: "center",
//       marginVertical: 20,
//     },
//     monthBtn: {
//       padding: 8,
//       backgroundColor: "#E5E7EB",
//       borderRadius: 10,
//     },
//     monthText: {
//       fontSize: 16,
//       fontWeight: "700",
//       marginHorizontal: 14,
//       color: !isDark
//         ? '#000104'
//         : '#E9EFFC',
//     },

//     /* LIST */
//     listWrapper: {
//       marginTop: 5,
//       marginHorizontal: 14,
//     },
//     sectionTitle: {
//       fontSize: 18,
//       fontWeight: "700",
//       marginBottom: 12,
//       color: "#111827",
//     },

//     listItem: {
//       flexDirection: "row",
//       alignItems: "center",
//       backgroundColor: "#fff",
//       padding: 16,
//       borderRadius: 14,
//       marginBottom: 14,
//       elevation: 4,
//       marginHorizontal: 14,
//     },

//     dateBlock: {
//       width: 60,
//       alignItems: "center",
//     },
//     dateDay: {
//       fontSize: 22,
//       fontWeight: "800",
//       color: "#111827",
//     },
//     dateMonth: {
//       fontSize: 13,
//       color: "#6B7280",
//     },
//     dateWeekday: {
//       fontSize: 12,
//       color: "#9CA3AF",
//       marginTop: 3,
//     },

//     statusContainer: {
//       flex: 1,
//       paddingLeft: 16,
//     },
//     statusBadge: {
//       flexDirection: "row",
//       alignItems: "center",
//       paddingVertical: 6,
//       paddingHorizontal: 12,
//       borderRadius: 12,
//     },
//     statusText: {
//       marginLeft: 5,
//       fontSize: 14,
//       fontWeight: "600",
//     },

//     dot: {
//       width: 12,
//       height: 12,
//       borderRadius: 10,
//     },

//     calendarWrapper: {
//       marginTop: 10,
//     },

//     calendarGrid: {
//       flexDirection: "row",
//       flexWrap: "wrap",
//       justifyContent: "space-between",
//       backgroundColor: "#fff",
//       padding: 10,
//       borderRadius: 14,
//       elevation: 4,
//     },

//     calendarCell: {
//       width: "13.5%",
//       aspectRatio: 1,
//       marginBottom: 8,
//       borderRadius: 10,
//       borderWidth: 2,
//       justifyContent: "center",
//       alignItems: "center",
//       backgroundColor: "#ffffff",
//       marginHorizontal: 14,
//     },

//     calendarDay: {
//       fontSize: 12,
//       fontWeight: "700",
//     },

//     calendarDot: {
//       width: 8,
//       height: 8,
//       borderRadius: 10,
//       marginBottom: 3,
//     },
//     calendarCard: {
//       backgroundColor: "#ffffff",
//       padding: 16,
//       borderRadius: 18,
//       elevation: 6,
//       marginBottom: 20,
//       marginTop: 10,
//       marginHorizontal: 14,
//     },

//     weekRow: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       marginBottom: 10,
//     },

//     weekDay: {
//       width: "14.28%",
//       textAlign: "center",
//       fontSize: 13,
//       fontWeight: "700",
//       color: "#6B7280",
//     },
//     //  calendarGrid: {
//     //   flexDirection: "row",
//     //   flexWrap: "wrap",
//     // },

//     dayCell: {
//       width: "14.28%",
//       aspectRatio: 1,
//       padding: 3,
//     },

//     dayInner: {
//       flex: 1,
//       borderRadius: 12,
//       justifyContent: "center",
//       alignItems: "center",
//       borderWidth: 1,
//     },

//     statusDot: {
//       width: 8,
//       height: 8,
//       borderRadius: 6,
//       marginTop: 4,
//     },

//   });
//   return styles;
// }
