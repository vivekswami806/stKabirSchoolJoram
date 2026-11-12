// import { RootState } from '@/action/store';
// import { ThemeContext } from '@/action/theme/ThemeContext';
// import { Theme } from '@/action/theme/themeReducer';
// import { MONTHS, daysInMonth } from '@/components/CommonUtils';
// import Skeleton from '@/components/Skeleton';
// import { API_BASE_URL } from '@/config';
// import { getDeviceId } from '@/helper/getDeviceId';
// import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { Buffer } from 'buffer';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import moment from 'moment';
// import React, { useContext, useEffect, useState } from 'react';
// import {
//   Image,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   ViewStyle,
// } from 'react-native';
// import { useSelector } from 'react-redux';

// type AttendanceStatusCode = 'P' | 'A' | 'L';

// interface AttendanceRecord {
//   id: string;
//   date: string; // YYYY-MM-DD
//   status: AttendanceStatusCode;
//   ownerId: string;
//   ownerType: 'STAFF';
//   markedAt: string;
//   markedBy: string;
// }
// interface AttendanceMonthlyResponse {
//   present: number;
//   absent: number;
//   leave: number;
//   percentage: string; // "100.00%"
//   month: number;
//   ownerId: string;
//   ownerType: 'STAFF';
//   records: AttendanceRecord[];
// }

// type ParentScreenPath =
//   | "/adminDashboard/(tabs)/teacherinfo/teacherinfo"
//   | "/profile"
//   | "/(auth)/home";

// export default function StaffAttendance() {
//   const [path, setPath] = useState<ParentScreenPath>("/(auth)/home");
//   const [role, setRole] = useState<string | null>(null);
//   const { details } = useLocalSearchParams<{ details?: string }>();
//   useEffect(() => {
//     const loadRole = async () => {
//       const storedRole = await AsyncStorage.getItem("auth_role");
//       setRole(storedRole);

//       if (storedRole === "ADMIN") {
//         setPath("/profile");
//       } else if (storedRole === "STAFF") {
//         setPath("/profile");
//       }
//     };

//     loadRole();
//   }, [details]);
//   const router = useRouter();

//   let userDetail = details ? JSON.parse(details) : useSelector((state: RootState) => state.user.userDetail);
//   // let { userDetail } = useSelector((state: RootState) => state.user);
//   const today = new Date();
//   const [month, setMonth] = useState(today.getMonth());
//   const [year, setYear] = useState(today.getFullYear());

//   const [student, setStudent] = useState<any>(null);
//   const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [attendance, setAttendance] = useState<AttendanceMonthlyResponse | null>(null);

//   const themeState = useContext(ThemeContext);
//   if (!themeState) return null;
//   const { theme } = themeState;
//   const styles = getStyles(theme);

//   /* ---------------- STATUS STYLE ---------------- */
//   const getStatusStyle = (status: string) => {
//     switch (status) {
//       case 'Present':
//         return { color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle' };
//       case 'Absent':
//         return { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle' };
//       case 'Leave':
//         return { color: '#F59E0B', bg: '#FEF3C7', icon: 'time' };
//       default:
//         return { color: '#6B7280', bg: '#F3F4F6', icon: 'help-circle' };
//     }
//   };

//   /* ---------------- STATUS MAPPER ---------------- */
//   const mapStatus = (label: string, status?: string) => {

//     if (label === 'P') return 'Present';
//     if (label === 'A') return 'Absent';
//     if (label === 'L' || label === 'Excused') return 'Leave';
//     return 'None';
//   };

//   /* ---------------- MONTH NAV ---------------- */
//   const nextMonth = () => {
//     if (month === 11) {
//       setMonth(0);
//       setYear(year + 1);
//     } else {
//       setMonth(month + 1);
//     }
//   };

//   const prevMonth = () => {
//     if (month === 0) {
//       setMonth(11);
//       setYear(year - 1);
//     } else {
//       setMonth(month - 1);
//     }
//   };

//   const buildCalendarDays = () => {
//     const firstDayIndex =
//       moment(`${year}-${month + 1}-01`, 'YYYY-M-D').isoWeekday() - 1; // Mon=0

//     const daysInCurrentMonth = daysInMonth(month, year);
//     const daysInPrevMonth = daysInMonth(month - 1 < 0 ? 11 : month - 1, month === 0 ? year - 1 : year);

//     const calendarDays: {
//       day: number;
//       monthType: 'prev' | 'current' | 'next';
//     }[] = [];

//     // PREVIOUS MONTH DAYS
//     for (let i = firstDayIndex - 1; i >= 0; i--) {
//       calendarDays.push({
//         day: daysInPrevMonth - i,
//         monthType: 'prev',
//       });
//     }

//     // CURRENT MONTH DAYS
//     for (let d = 1; d <= daysInCurrentMonth; d++) {
//       calendarDays.push({
//         day: d,
//         monthType: 'current',
//       });
//     }

//     // NEXT MONTH DAYS (fill till 42)
//     const remaining = 42 - calendarDays.length;
//     for (let i = 1; i <= remaining; i++) {
//       calendarDays.push({
//         day: i,
//         monthType: 'next',
//       });
//     }

//     return calendarDays;
//   };


//   /* ---------------- FETCH API ---------------- */
//   useEffect(() => {
//     fetchAttendance();
//   }, [month, year]);

//   const fetchAttendance = async () => {
//     try {
//       setLoading(true);

//       const deviceId = await getDeviceId();
//       const token = await AsyncStorage.getItem('auth_token');
//       const encodedTenant = await AsyncStorage.getItem('auth_tenant');

//       if (!token || !encodedTenant) throw new Error('Auth missing');

//       const tenantId = Buffer.from(encodedTenant, 'base64').toString('utf-8');

//       const res = await axios.get<AttendanceMonthlyResponse>(
//         `${API_BASE_URL}v2/attendance/getAttendanceMonthly`,
//         {
//           params: {
//             ownerType: 'STAFF',
//             month: month + 1,
//             year,
//             ownerId: userDetail.id,
//           },
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'X-Tenant-ID': tenantId,
//             'X-Device-ID': deviceId,
//           },
//         }
//       );
//       console.log(res.data);
      
//       setAttendance(res.data);
//       setStudent(res.data);
//       setAttendanceRecords(res.data.records || []);
//     } catch (err) {
//       console.error('Attendance API error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };


//   /* ---------------- STATS (FROM BACKEND) ---------------- */
//   const presentDays = attendance?.present ?? 0;
//   const absentDays = attendance?.absent ?? 0;
//   const leaveDays = attendance?.leave ?? 0;
//   const attendancePercentage = attendance?.percentage ?? 0;

//   const totalDays = daysInMonth(month, year);

//   /* ---------------- UI ---------------- */
//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       {/* HEADER */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.push(path as any)}>
//           <Ionicons name="arrow-back" size={26} style={styles.headerButton} />
//         </TouchableOpacity>
//         <View />
//         <Text style={styles.headerTitle}>Attendance</Text>
//       </View>

//       {/* STUDENT CARD */}
//       {userDetail ? (
//         <View style={styles.studentCard}>
//           <View style={styles.avatar}>
//             {userDetail.role === "PARENT" ? (
//               userDetail?.studentImage ? (
//                 <Image
//                   source={{ uri: `data:image/png;base64,${userDetail.studentImage}` }}
//                   style={styles.profileImage}
//                 />
//               ) : (
//                 <Image
//                   source={{
//                     uri: `https://ui-avatars.com/api/?name=${userDetail?.studentName || 'User'}&background=8B5CF6&color=fff&size=200&bold=true`,
//                   }}
//                   style={styles.profileImage}
//                 />
//               )
//             ) : userDetail?.staffImage ? (
//               <Image
//                 source={{ uri: `data:image/jpeg;base64,${userDetail.staffImage}` }}
//                 style={styles.profileImage}
//               />
//             ) : (
//               <Image
//                 source={{
//                   uri: `https://ui-avatars.com/api/?name=${userDetail?.name || 'User'}&background=8B5CF6&color=fff&size=200&bold=true`,
//                 }}
//                 style={styles.profileImage}
//               />
//             )}
//           </View>

//           <View style={styles.studentInfo}>
//             <Text style={styles.studentName}>{userDetail.name}</Text>
//             <Text style={styles.studentDetails}>
//               Class: {userDetail.staffClass}{userDetail.staffSection}
//             </Text>
//           </View>
//         </View>
//       ) : (
//         <Skeleton isDark={false} />
//       )}

//       {/* STATS */}
//       <View style={styles.statsRow}>
//         <View style={styles.overallCard}>
//           <Text style={styles.overallLabel}>Overall</Text>
//           <Text style={styles.overallPercent}>{attendancePercentage}</Text>
//           <View style={styles.progressBarBG}>
//             <View
//               style={[
//                 styles.progressBarFill,
//                 { width: `${attendancePercentage}` } as ViewStyle,
//               ]}
//             />
//           </View>
//         </View>

//         <View style={styles.miniStats}>
//           <View style={styles.miniCard}>
//             <Ionicons name="checkmark-circle" size={28} color="#10B981" />
//             <Text style={styles.miniNumber}>{presentDays}</Text>
//             <Text style={styles.miniLabel}>Present</Text>
//           </View>

//           <View style={styles.miniCard}>
//             <Ionicons name="close-circle" size={28} color="#EF4444" />
//             <Text style={styles.miniNumber}>{absentDays}</Text>
//             <Text style={styles.miniLabel}>Absent</Text>
//           </View>

//           {/* <View style={styles.miniCard}>
//             <Ionicons name="time" size={28} color="#F59E0B" />
//             <Text style={styles.miniNumber}>{leaveDays}</Text>
//             <Text style={styles.miniLabel}>Leave</Text>
//           </View> */}
//         </View>
//       </View>

//       {/* MONTH SELECTOR */}
//       <View style={styles.monthSelector}>
//         <TouchableOpacity onPress={prevMonth}>
//           <Ionicons name="chevron-back" size={20} />
//         </TouchableOpacity>
//         <Text style={styles.monthText}>
//           {MONTHS[month]} {year}
//         </Text>
//         <TouchableOpacity onPress={nextMonth}>
//           <Ionicons name="chevron-forward" size={20} />
//         </TouchableOpacity>
//       </View>

//       {/* CALENDAR */}
//       <View style={styles.calendarCard}>
//         <Text style={styles.sectionTitle}>Attendance Calendar</Text>

//         <View style={styles.weekRow}>
//           {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
//             <Text key={d} style={styles.weekDay}>{d}</Text>
//           ))}
//         </View>

//         <View style={styles.calendarGrid}>
//           {buildCalendarDays().map((item, index) => {
//             const { day, monthType } = item;

//             let record = null;

//             if (monthType === 'current') {
//               record = attendanceRecords.find(r => {
//                 const d = moment(r.date, 'YYYY-MM-DD');
//                 return (
//                   d.date() === day &&
//                   d.month() === month &&
//                   d.year() === year
//                 );
//               });
//             }
//             const status =
//               monthType === 'current' && record
//                 ? mapStatus(record.status, record.statusLabel)
//                 : 'None';

//             const styleX = getStatusStyle(status);

//             const isToday =
//               monthType === 'current' &&
//               today.getDate() === day &&
//               today.getMonth() === month &&
//               today.getFullYear() === year;

//             return (
//               <View key={index} style={styles.dayCell}>
//                 <View
//                   style={[
//                     styles.dayInner,
//                     {
//                       backgroundColor:
//                         monthType === 'current' ? styleX.bg : '#F9FAFB',
//                       borderColor:
//                         monthType === 'current' ? styleX.color : '#E5E7EB',
//                       opacity: monthType === 'current' ? 1 : 0.35,
//                       borderWidth: isToday ? 2 : 1,
//                     },
//                   ]}
//                 >
//                   <Text
//                     style={{
//                       fontWeight: '700',
//                       color:
//                         monthType === 'current'
//                           ? styleX.color
//                           : '#9CA3AF',
//                     }}
//                   >
//                     {day}
//                   </Text>

//                   {monthType === 'current' && status !== 'None' && (
//                     <View
//                       style={[
//                         styles.statusDot,
//                         { backgroundColor: styleX.color },
//                       ]}
//                     />
//                   )}
//                 </View>
//               </View>
//             );
//           })}
//         </View>


//       </View>
//     </ScrollView>
//   );
// }

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
//       backgroundColor: "#fff",
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



import { RootState } from '@/action/store';
import { ThemeContext } from '@/action/theme/ThemeContext';
import { Theme } from '@/action/theme/themeReducer';
import { MONTHS, daysInMonth } from '@/components/CommonUtils';
import Skeleton from '@/components/Skeleton';
import { API_BASE_URL } from '@/config';
import { getDeviceId } from '@/helper/getDeviceId';
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
import { useSelector } from 'react-redux';

/* =========================================================
   TYPES
========================================================= */

type AttendanceStatusCode = 'P' | 'A' | 'L';

type ParentScreenPath =
  | '/adminDashboard/(tabs)/teacherinfo/teacherinfo'
  | '/profile'
  | '/(auth)/home';

interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatusCode;
  ownerId: string;
  ownerType: 'STAFF';
  markedAt: string;
  markedBy: string;
}

interface AttendanceMonthlyResponse {
  absent: number;
  leave: number;
  month: number;
  ownerId: string;
  ownerName: string;
  ownerType: 'STAFF';
  percentage: string;
  present: number;
  records: AttendanceRecord[];
  totalRecords: number;
  year: number;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function StaffAttendance() {
  const router = useRouter();

  const { details } = useLocalSearchParams<{
    details?: string;
  }>();

  /* -------------------------------------------------------
     USER
  ------------------------------------------------------- */

  const reduxUserDetail = useSelector(
    (state: RootState) => state.user.userDetail
  );

  const userDetail = details
    ? JSON.parse(details)
    : reduxUserDetail;
  
  const [path, setPath] = useState<ParentScreenPath>('/(auth)/home');

  useEffect(() => {
    const loadRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('auth_role');

        if (storedRole === 'ADMIN') {
          setPath('/profile');
        } else if (storedRole === 'STAFF') {
          setPath('/profile');
        } else {
          setPath('/(auth)/home');
        }
      } catch (error) {
        console.error('Error loading role:', error);
      }
    };

    loadRole();
  }, []);

  /* -------------------------------------------------------
     DATE
  ------------------------------------------------------- */

  const today = new Date();

  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  /* -------------------------------------------------------
     ATTENDANCE
  ------------------------------------------------------- */

  const [attendance, setAttendance] =
    useState<AttendanceMonthlyResponse | null>(null);

  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);

  const [loading, setLoading] = useState(false);

  /* -------------------------------------------------------
     THEME
  ------------------------------------------------------- */

  const themeState = useContext(ThemeContext);

  if (!themeState) {
    return null;
  }

  const { theme } = themeState;

  const styles = getStyles(theme);

  /* =======================================================
     STATUS STYLE
  ======================================================= */

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Present':
        return {
          color: '#10B981',
          bg: '#D1FAE5',
          icon: 'checkmark-circle' as const,
        };

      case 'Absent':
        return {
          color: '#EF4444',
          bg: '#FEE2E2',
          icon: 'close-circle' as const,
        };

      case 'Leave':
        return {
          color: '#F59E0B',
          bg: '#FEF3C7',
          icon: 'time' as const,
        };

      default:
        return {
          color: '#6B7280',
          bg: '#F3F4F6',
          icon: 'help-circle' as const,
        };
    }
  };

  /* =======================================================
     STATUS MAPPER
  ======================================================= */

  const mapStatus = (
    status: AttendanceStatusCode | string
  ) => {
    switch (status) {
      case 'P':
        return 'Present';

      case 'A':
        return 'Absent';

      case 'L':
        return 'Leave';

      default:
        return 'None';
    }
  };

  /* =======================================================
     MONTH NAVIGATION
  ======================================================= */

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(prev => prev + 1);
    } else {
      setMonth(prev => prev + 1);
    }
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(prev => prev - 1);
    } else {
      setMonth(prev => prev - 1);
    }
  };

  /* =======================================================
     CALENDAR
  ======================================================= */

  const buildCalendarDays = () => {
    const firstDayIndex =
      moment(
        `${year}-${month + 1}-01`,
        'YYYY-M-D'
      ).isoWeekday() - 1;

    const daysInCurrentMonth =
      daysInMonth(month, year);

    const previousMonth =
      month === 0 ? 11 : month - 1;

    const previousMonthYear =
      month === 0 ? year - 1 : year;

    const daysInPreviousMonth =
      daysInMonth(
        previousMonth,
        previousMonthYear
      );

    const calendarDays: {
      day: number;
      monthType: 'prev' | 'current' | 'next';
    }[] = [];

    /* Previous month */

    for (
      let i = firstDayIndex - 1;
      i >= 0;
      i--
    ) {
      calendarDays.push({
        day: daysInPreviousMonth - i,
        monthType: 'prev',
      });
    }

    /* Current month */

    for (
      let day = 1;
      day <= daysInCurrentMonth;
      day++
    ) {
      calendarDays.push({
        day,
        monthType: 'current',
      });
    }

    /* Next month */

    const remaining =
      42 - calendarDays.length;

    for (let day = 1; day <= remaining; day++) {
      calendarDays.push({
        day,
        monthType: 'next',
      });
    }

    return calendarDays;
  };

  /* =======================================================
     FETCH ATTENDANCE
  ======================================================= */

  useEffect(() => {
    fetchAttendance();
  }, [month, year, userDetail?.id]);

  const fetchAttendance = async () => {
    if (!userDetail?.id) {
      console.warn(
        'Staff ID missing, cannot fetch attendance'
      );
      return;
    }

    try {
      setLoading(true);

      const deviceId = await getDeviceId();

      const token =
        await AsyncStorage.getItem('auth_token');

      const encodedTenant =
        await AsyncStorage.getItem('auth_tenant');

      if (!token || !encodedTenant) {
        throw new Error('Authentication missing');
      }

      const tenantId =
        Buffer.from(
          encodedTenant,
          'base64'
        ).toString('utf-8');

      const response =
        await axios.get<AttendanceMonthlyResponse>(
          `${API_BASE_URL}v2/attendance/getAttendanceMonthly`,
          {
            params: {
              ownerType: 'STAFF',
              ownerId: userDetail.id,
              month: month + 1,
              year,
            },

            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-ID': tenantId,
              'X-Device-ID': deviceId,
            },
          }
        );

      setAttendance(response.data);

      setAttendanceRecords(
        response.data.records || []
      );
    } catch (error) {
      console.error(
        'Staff attendance API error:',
        error
      );

      setAttendance(null);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     STATS
  ======================================================= */

  const presentDays =
    attendance?.present ?? 0;

  const absentDays =
    attendance?.absent ?? 0;

  const leaveDays =
    attendance?.leave ?? 0;

  const attendancePercentage =
    parseFloat(
      attendance?.percentage?.replace('%', '') || '0'
    );

  /* =======================================================
     STAFF NAME
  ======================================================= */

  const staffName =
    attendance?.ownerName ||
    userDetail?.name ||
    'Staff';

    const getStaffImageUri = (image?: string | null) => {
      if (!image) return null;
    
      // Already a complete data URI
      if (image.startsWith('data:image/')) {
        return image;
      }
    
      // Raw base64
      return `data:image/jpeg;base64,${image}`;
    };
    const staffImage = getStaffImageUri(userDetail?.staffImage);
  /* =======================================================
     UI
  ======================================================= */

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.replace(path as any)
          }
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={26}
            style={styles.headerButton}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Attendance
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* =================================================
          STAFF CARD
      ================================================= */}

      {userDetail ? (
        <View style={styles.studentCard}>
          <View style={styles.avatar}>
          {staffImage ? (
  <Image
    source={{ uri: staffImage }}
    style={styles.profileImage}
  />
) : (
  <Image
    source={{
      uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        staffName
      )}&background=8B5CF6&color=fff&size=200&bold=true`,
    }}
    style={styles.profileImage}
  />
)}
          </View>

          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>
              {staffName}
            </Text>

            <Text style={styles.studentDetails}>
              {userDetail?.staffClass
                ? `Class: ${userDetail.staffClass}${
                    userDetail?.staffSection || ''
                  }`
                : 'Staff Attendance'}
            </Text>
          </View>
        </View>
      ) : (
        <Skeleton isDark={theme.mode === 'dark'} />
      )}

      {/* =================================================
          STATS
      ================================================= */}

      <View style={styles.statsRow}>
        {/* Overall */}

        <View style={styles.overallCard}>
          <View style={styles.overallHeader}>
            <Text style={styles.overallLabel}>
              Overall Attendance
            </Text>

            <Text style={styles.overallPercent}>
              {attendancePercentage.toFixed(2)}%
            </Text>
          </View>

          <View style={styles.progressBarBG}>
            <View
              style={
                [
                  styles.progressBarFill,
                  {
                    width: `${Math.min(
                      Math.max(
                        attendancePercentage,
                        0
                      ),
                      100
                    )}%`,
                  },
                ] as ViewStyle[]
              }
            />
          </View>
        </View>

        {/* Mini Stats */}

        <View style={styles.miniStats}>
          {/* Present */}

          <View style={styles.miniCard}>
            <Ionicons
              name="checkmark-circle"
              size={28}
              color="#10B981"
            />

            <Text style={styles.miniNumber}>
              {presentDays}
            </Text>

            <Text style={styles.miniLabel}>
              Present
            </Text>
          </View>

          {/* Absent */}

          <View style={styles.miniCard}>
            <Ionicons
              name="close-circle"
              size={28}
              color="#EF4444"
            />

            <Text style={styles.miniNumber}>
              {absentDays}
            </Text>

            <Text style={styles.miniLabel}>
              Absent
            </Text>
          </View>

          {/* Leave */}

          <View style={styles.miniCard}>
            <Ionicons
              name="time"
              size={28}
              color="#F59E0B"
            />

            <Text style={styles.miniNumber}>
              {leaveDays}
            </Text>

            <Text style={styles.miniLabel}>
              Leave
            </Text>
          </View>
        </View>
      </View>

      {/* =================================================
          MONTH SELECTOR
      ================================================= */}

      <View style={styles.monthSelector}>
        <TouchableOpacity
          onPress={prevMonth}
          style={styles.monthButton}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={
              theme.mode === 'dark'
                ? '#E9EFFC'
                : '#111827'
            }
          />
        </TouchableOpacity>

        <Text style={styles.monthText}>
          {MONTHS[month]} {year}
        </Text>

        <TouchableOpacity
          onPress={nextMonth}
          style={styles.monthButton}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={
              theme.mode === 'dark'
                ? '#E9EFFC'
                : '#111827'
            }
          />
        </TouchableOpacity>
      </View>

      {/* =================================================
          CALENDAR
      ================================================= */}

      <View style={styles.calendarCard}>
        <Text style={styles.sectionTitle}>
          Attendance Calendar
        </Text>

        {/* Week */}

        <View style={styles.weekRow}>
          {[
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat',
            'Sun',
          ].map(day => (
            <Text
              key={day}
              style={styles.weekDay}
            >
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar */}

        <View style={styles.calendarGrid}>
          {buildCalendarDays().map(
            (item, index) => {
              const {
                day,
                monthType,
              } = item;

              let record:
                | AttendanceRecord
                | undefined;

              /* Find attendance */

              if (
                monthType === 'current'
              ) {
                record =
                  attendanceRecords.find(
                    item => {
                      const recordDate =
                        moment(
                          item.date,
                          'YYYY-MM-DD'
                        );

                      return (
                        recordDate.date() ===
                          day &&
                        recordDate.month() ===
                          month &&
                        recordDate.year() ===
                          year
                      );
                    }
                  );
              }

              /* Status */

              const status =
                monthType === 'current' &&
                record
                  ? mapStatus(
                      record.status
                    )
                  : 'None';

              const styleX =
                getStatusStyle(status);

              /* Today */

              const isToday =
                monthType === 'current' &&
                today.getDate() === day &&
                today.getMonth() ===
                  month &&
                today.getFullYear() ===
                  year;

              return (
                <View
                  key={index}
                  style={styles.dayCell}
                >
                  <View
                    style={[
                      styles.dayInner,
                      {
                        backgroundColor:
                          monthType ===
                          'current'
                            ? styleX.bg
                            : theme.mode ===
                              'dark'
                            ? '#111827'
                            : '#F9FAFB',

                        borderColor:
                          monthType ===
                          'current'
                            ? styleX.color
                            : '#E5E7EB',

                        opacity:
                          monthType ===
                          'current'
                            ? 1
                            : 0.35,

                        borderWidth:
                          isToday ? 2 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontWeight: '700',

                        color:
                          monthType ===
                          'current'
                            ? styleX.color
                            : '#9CA3AF',
                      }}
                    >
                      {day}
                    </Text>

                    {/* Status dot */}

                    {monthType ===
                      'current' &&
                      status !== 'None' && (
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                styleX.color,
                            },
                          ]}
                        />
                      )}
                  </View>
                </View>
              );
            }
          )}
        </View>

        {/* =================================================
            LEGEND
        ================================================= */}

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    '#10B981',
                },
              ]}
            />

            <Text style={styles.legendText}>
              Present
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    '#EF4444',
                },
              ]}
            />

            <Text style={styles.legendText}>
              Absent
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    '#F59E0B',
                },
              ]}
            />

            <Text style={styles.legendText}>
              Leave
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom spacing */}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

/* =========================================================
   STYLES
========================================================= */

function getStyles(theme: Theme) {
  const isDark =
    theme.mode === 'dark';

  const styles = StyleSheet.create({
    /* =====================================================
       CONTAINER
    ===================================================== */

    container: {
      flex: 1,
      backgroundColor:
        theme.background,
    },

    /* =====================================================
       HEADER
    ===================================================== */

    header: {
      paddingTop:
        Platform.OS === 'ios'
          ? 60
          : 50,

      paddingHorizontal: 14,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',
    },

    backButton: {
      width: 45,
      height: 45,

      justifyContent: 'center',
      alignItems: 'center',
    },

    headerButton: {
      color: isDark
        ? '#E9EFFC'
        : '#000104',
    },

    headerTitle: {
      fontSize: 22,
      fontWeight: '700',

      color: isDark
        ? '#E9EFFC'
        : '#000104',
    },

    headerSpacer: {
      width: 45,
    },

    /* =====================================================
       STAFF CARD
    ===================================================== */

    studentCard: {
      marginTop: 13,
      marginHorizontal: 14,

      backgroundColor: isDark
        ? '#000104'
        : '#D6DFDE',

      padding: 13,

      borderRadius: 16,

      flexDirection: 'row',

      alignItems: 'center',

      shadowColor: '#000',
      shadowOpacity: 0.1,

      elevation: 6,
    },

    avatar: {
      width: 60,
      height: 60,

      borderRadius: 30,

      backgroundColor:
        '#2563EB',

      justifyContent:
        'center',

      alignItems: 'center',

      overflow: 'hidden',
    },

    profileImage: {
      width: 56,
      height: 56,

      borderRadius: 28,

      borderWidth: 3,

      borderColor: isDark
        ? 'rgba(139, 92, 246, 0.5)'
        : '#FFFFFF',
    },

    studentInfo: {
      marginLeft: 16,

      flex: 1,
    },

    studentName: {
      fontSize: 18,
      fontWeight: '700',

      color: isDark
        ? '#E9EFFC'
        : '#000104',
    },

    studentDetails: {
      fontSize: 14,

      color: isDark
        ? '#9CA3AF'
        : '#6B7280',

      marginTop: 3,
    },

    /* =====================================================
       STATS
    ===================================================== */

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

      shadowColor: '#000',

      shadowOpacity: 0.08,

      elevation: 5,
    },

    overallHeader: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems: 'center',
    },

    overallLabel: {
      fontSize: 15,

      color: isDark
        ? '#9CA3AF'
        : '#6B7280',
    },

    overallPercent: {
      fontSize: 24,

      fontWeight: '800',

      color: '#2563EB',
    },

    progressBarBG: {
      width: '100%',

      height: 8,

      backgroundColor:
        '#E5E7EB',

      borderRadius: 10,

      marginTop: 10,

      overflow: 'hidden',
    },

    progressBarFill: {
      height: 8,

      backgroundColor:
        '#2563EB',

      borderRadius: 10,
    },

    miniStats: {
      flexDirection: 'row',

      justifyContent:
        'space-between',
    },

    miniCard: {
      width: '30%',

      backgroundColor:
        isDark
          ? '#111827'
          : '#FFFFFF',

      paddingVertical: 8,

      borderRadius: 14,

      alignItems: 'center',

      shadowColor: '#000',

      shadowOpacity: 0.08,

      elevation: 4,
    },

    miniNumber: {
      fontSize: 18,

      fontWeight: '700',

      marginTop: 4,

      color: isDark
        ? '#FFFFFF'
        : '#1F2937',
    },

    miniLabel: {
      fontSize: 13,

      color: isDark
        ? '#9CA3AF'
        : '#6B7280',

      marginTop: 2,
    },

    /* =====================================================
       MONTH
    ===================================================== */

    monthSelector: {
      flexDirection: 'row',

      justifyContent:
        'center',

      alignItems: 'center',

      marginVertical: 20,
    },

    monthButton: {
      width: 38,
      height: 38,

      borderRadius: 10,

      backgroundColor:
        isDark
          ? '#1F2937'
          : '#E5E7EB',

      justifyContent:
        'center',

      alignItems: 'center',
    },

    monthText: {
      fontSize: 16,

      fontWeight: '700',

      marginHorizontal: 14,

      color: isDark
        ? '#E9EFFC'
        : '#000104',
    },

    /* =====================================================
       CALENDAR
    ===================================================== */

    calendarCard: {
      backgroundColor:
        isDark
          ? '#000104'
          : '#FFFFFF',

      padding: 16,

      borderRadius: 18,

      elevation: 6,

      marginBottom: 20,

      marginTop: 10,

      marginHorizontal: 14,
    },

    sectionTitle: {
      fontSize: 18,

      fontWeight: '700',

      marginBottom: 12,

      color: isDark
        ? '#E9EFFC'
        : '#111827',
    },

    weekRow: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      marginBottom: 10,
    },

    weekDay: {
      width: '14.28%',

      textAlign: 'center',

      fontSize: 13,

      fontWeight: '700',

      color: isDark
        ? '#9CA3AF'
        : '#6B7280',
    },

    calendarGrid: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      backgroundColor:
        isDark
          ? '#111827'
          : '#FFFFFF',

      borderRadius: 14,

      padding: 4,
    },

    dayCell: {
      width: '14.28%',

      aspectRatio: 1,

      padding: 3,
    },

    dayInner: {
      flex: 1,

      borderRadius: 12,

      justifyContent:
        'center',

      alignItems: 'center',

      borderWidth: 1,
    },

    statusDot: {
      width: 8,

      height: 8,

      borderRadius: 6,

      marginTop: 4,
    },

    /* =====================================================
       LEGEND
    ===================================================== */

    legend: {
      flexDirection: 'row',

      justifyContent:
        'space-around',

      alignItems: 'center',

      marginTop: 18,

      paddingTop: 12,

      borderTopWidth: 1,

      borderTopColor:
        isDark
          ? '#374151'
          : '#E5E7EB',
    },

    legendItem: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    legendDot: {
      width: 9,

      height: 9,

      borderRadius: 5,

      marginRight: 5,
    },

    legendText: {
      fontSize: 12,

      color: isDark
        ? '#9CA3AF'
        : '#6B7280',
    },
  });

  return styles;
}