// import { Ionicons } from "@expo/vector-icons";
// import React, { useState } from "react";
// import { ScrollView, Text, TouchableOpacity, View } from "react-native";

// interface TeacherCalendarProps {
//   styles: any;
//   monthInfo: { days: number; label: string; month: number; year: number; firstDayIndex: number };
//   setCurrentMonth: (d: Date) => void;
// }

// const formatDateLocal = (date: Date) => {
//   const offset = date.getTimezoneOffset();
//   const localDate = new Date(date.getTime() - (offset * 60 * 1000));
//   return localDate.toISOString().split('T')[0];
// };

// export default function TeacherCalendar({
//   styles,
//   monthInfo,
//   setCurrentMonth,
// }: TeacherCalendarProps) {

//   // Generate blank spots for days before the 1st of the month
//   const blanks = Array.from({ length: monthInfo.firstDayIndex });
//   const [teacherStats, setTeacherStats] = useState({ present: 22, absent: 3, event: 5 });
//   const [selectedDateStr, setSelectedDateStr] = useState(formatDateLocal(new Date()));
//   // Generate days
//   const daysArray = Array.from({ length: monthInfo.days }, (_, i) => i + 1);

//   return (
//     <ScrollView contentContainerStyle={{ padding: 16 }}>
//       {/* Header */}
//       <View style={styles.teacherMonthHeader}>
//         <Text style={styles.teacherMonthText}>{monthInfo.label}</Text>
//         <View style={{ flexDirection: "row", gap: 15 }}>
//           <TouchableOpacity onPress={() => setCurrentMonth(new Date(monthInfo.year, monthInfo.month - 1))}>
//             <Ionicons name="chevron-back-circle" size={28} color="#6366f1" />
//           </TouchableOpacity>
//           <TouchableOpacity onPress={() => setCurrentMonth(new Date(monthInfo.year, monthInfo.month + 1))}>
//             <Ionicons name="chevron-forward-circle" size={28} color="#6366f1" />
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Week Header */}
//       <View style={styles.teacherDaysRow}>
//         {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
//           <Text key={d} style={styles.teacherDayName}>{d}</Text>
//         ))}
//       </View>

//       {/* Grid */}
//       <View style={styles.teacherDateGrid}>
//         {/* Render Blanks */}
//         {blanks.map((_, index) => (
//            <View key={`blank-${index}`} style={styles.teacherDateCircle} />
//         ))}

//         {/* Render Days */}
//         {daysArray.map((day) => {
//           // Construct YYYY-MM-DD for comparison
//           const mm = String(monthInfo.month + 1).padStart(2, "0");
//           const dd = String(day).padStart(2, "0");
//           const dateString = `${monthInfo.year}-${mm}-${dd}`;
//           const isSelected = selectedDateStr === dateString;

//           return (
//             <TouchableOpacity
//               key={day}
//               onPress={() => setSelectedDateStr(dateString)}
//               style={[
//                 styles.teacherDateCircle,
//                 isSelected && styles.teacherDateCircleActive,
//               ]}
//             >
//               <Text style={[
//                 styles.teacherDateText,
//                 isSelected && styles.teacherDateTextActive
//               ]}>
//                 {day}
//               </Text>
//             </TouchableOpacity>
//           );
//         })}
//       </View>

//       {/* Stats */}
//       <View style={styles.teacherCardRow}>
//         <StatCard label="Present" value={teacherStats.present} color="#4C8EF7" icon="checkmark-circle" bg="#E6F2FF" />
//         <StatCard label="Absent" value={teacherStats.absent} color="#FF6B6B" icon="close-circle" bg="#FFF1F1" />
//         <StatCard label="Events" value={teacherStats.event} color="#A46BFF" icon="calendar" bg="#F1E9FF" />
//       </View>
//     </ScrollView>
//   );
// }

// const StatCard = ({ label, value, color, icon, bg }: any) => (
//   <View style={{ width: "31%", padding: 15, borderRadius: 12, backgroundColor: bg, alignItems: 'center' }}>
//     <Ionicons name={icon} size={24} color={color} />
//     <Text style={{ marginTop: 5, fontSize: 12, color: '#555' }}>{label}</Text>
//     <Text style={{ fontSize: 18, fontWeight: '700', color: '#000' }}>{value}</Text>
//   </View>
// );


import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface MonthInfo {
  days: number;
  label: string;
  month: number;
  year: number;
  firstDayIndex: number;
}

interface TeacherCalendarProps {
  styles: any;
  monthInfo: MonthInfo;
  setCurrentMonth: (date: Date) => void;
}

interface DayAttendance {
  date: string;
  status: 'present' | 'absent' | 'halfday' | 'holiday' | null;
}

export default function TeacherCalendar({
  styles,
  monthInfo,
  setCurrentMonth,
}: TeacherCalendarProps) {
  const [attendanceData, setAttendanceData] = useState<DayAttendance[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, halfday: 0, holiday: 0 });

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  useEffect(() => {
    loadTeacherAttendance();
  }, [monthInfo]);

  const loadTeacherAttendance = async () => {
    // TODO: Fetch teacher attendance from DB or API
    // For now, using dummy data
    const dummyData: DayAttendance[] = [];
    const presentDays = [1, 2, 3, 5, 6, 8, 9, 10, 12, 13, 15, 16, 17, 19, 20, 22, 23, 24, 26, 27, 29, 30];
    const absentDays = [4, 11, 18];
    const halfDays = [7, 14, 21];
    const holidays = [25, 28]; // Sundays or holidays

    for (let day = 1; day <= monthInfo.days; day++) {
      const dateStr = `${monthInfo.year}-${String(monthInfo.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      let status: DayAttendance['status'] = null;
      if (presentDays.includes(day)) status = 'present';
      else if (absentDays.includes(day)) status = 'absent';
      else if (halfDays.includes(day)) status = 'halfday';
      else if (holidays.includes(day)) status = 'holiday';

      dummyData.push({ date: dateStr, status });
    }

    setAttendanceData(dummyData);
    
    // Calculate stats
    setStats({
      present: presentDays.length,
      absent: absentDays.length,
      halfday: halfDays.length,
      holiday: holidays.length,
    });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(monthInfo.year, monthInfo.month - 1, 1));
  };

  const goToNextMonth = () => {
    const today = new Date();
    const nextMonth = new Date(monthInfo.year, monthInfo.month + 1, 1);
    
    // Don't allow future months
    if (nextMonth <= today) {
      setCurrentMonth(nextMonth);
    }
  };

  const getStatusColor = (status: DayAttendance['status']) => {
    switch (status) {
      case 'present': return '#4CAF50';
      case 'absent': return '#FF6B6B';
      case 'halfday': return '#FF9800';
      case 'holiday': return '#9E9E9E';
      default: return '#E0E0E0';
    }
  };

  const getStatusIcon = (status: DayAttendance['status']) => {
    switch (status) {
      case 'present': return 'checkmark-circle';
      case 'absent': return 'close-circle';
      case 'halfday': return 'time';
      case 'holiday': return 'gift';
      default: return 'ellipse-outline';
    }
  };

  const renderCalendar = () => {
    const calendarDays = [];
    
    // Empty cells before first day of month
    for (let i = 0; i < monthInfo.firstDayIndex; i++) {
      calendarDays.push(
        <View key={`empty-${i}`} style={styles.calendarDay}>
          <View style={styles.emptyDay} />
        </View>
      );
    }
    
    // Days of the month
    for (let day = 1; day <= monthInfo.days; day++) {
      const attendance = attendanceData[day - 1];
      const statusColor = getStatusColor(attendance?.status);
      
      calendarDays.push(
        <View key={`day-${day}`} style={styles.calendarDay}>
          <View style={[styles.dayContainer, { borderColor: statusColor }]}>
            <Text style={styles.dayNumber}>{day}</Text>
            {attendance?.status && (
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            )}
          </View>
        </View>
      );
    }
    
    return calendarDays;
  };

  return (
    <ScrollView 
      style={styles.teacherCalendarContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Month Navigation */}
      <View style={styles.monthNavigation}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.monthLabel}>{monthInfo.label}</Text>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.present}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
          <Ionicons name="close-circle" size={28} color="#FF6B6B" />
          <Text style={styles.statNumber}>{stats.absent}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="time" size={28} color="#FF9800" />
          <Text style={styles.statNumber}>{stats.halfday}</Text>
          <Text style={styles.statLabel}>Half Day</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#F5F5F5' }]}>
          <Ionicons name="gift" size={28} color="#9E9E9E" />
          <Text style={styles.statNumber}>{stats.holiday}</Text>
          <Text style={styles.statLabel}>Holiday</Text>
        </View>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekDaysHeader}>
        {weekDays.map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {renderCalendar()}
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Legend</Text>
        
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Present</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.legendText}>Absent</Text>
          </View>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>Half Day</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9E9E9E' }]} />
            <Text style={styles.legendText}>Holiday</Text>
          </View>
        </View>
      </View>

      {/* Attendance Percentage */}
      <View style={styles.percentageCard}>
        <Text style={styles.percentageTitle}>Attendance Rate</Text>
        <Text style={styles.percentageValue}>
          {Math.round((stats.present / (stats.present + stats.absent + stats.halfday)) * 100) || 0}%
        </Text>
        <Text style={styles.percentageSubtext}>
          {stats.present} out of {stats.present + stats.absent + stats.halfday} working days
        </Text>
      </View>
    </ScrollView>
  );
}

// Add these styles to your existing StyleSheet (or export them if in separate file)
/*
teacherCalendarContainer: {
  flex: 1,
  padding: 16,
},
monthNavigation: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
  paddingHorizontal: 10,
},
navButton: {
  padding: 8,
},
monthLabel: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
},
statsContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 20,
  gap: 8,
},
statCard: {
  flex: 1,
  padding: 12,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
},
statNumber: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#333',
  marginTop: 4,
},
statLabel: {
  fontSize: 11,
  color: '#666',
  marginTop: 2,
},
weekDaysHeader: {
  flexDirection: 'row',
  marginBottom: 8,
},
weekDayCell: {
  flex: 1,
  alignItems: 'center',
  paddingVertical: 8,
},
weekDayText: {
  fontSize: 12,
  fontWeight: '600',
  color: '#666',
},
calendarGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginBottom: 20,
},
calendarDay: {
  width: '14.28%', // 100% / 7 days
  aspectRatio: 1,
  padding: 2,
},
dayContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 8,
  borderWidth: 2,
  backgroundColor: '#fff',
  position: 'relative',
},
emptyDay: {
  flex: 1,
},
dayNumber: {
  fontSize: 14,
  fontWeight: '500',
  color: '#333',
},
statusDot: {
  position: 'absolute',
  bottom: 4,
  width: 6,
  height: 6,
  borderRadius: 3,
},
legendContainer: {
  backgroundColor: '#F9F9F9',
  padding: 16,
  borderRadius: 12,
  marginBottom: 16,
},
legendTitle: {
  fontSize: 14,
  fontWeight: 'bold',
  color: '#333',
  marginBottom: 12,
},
legendRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 8,
},
legendItem: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},
legendDot: {
  width: 12,
  height: 12,
  borderRadius: 6,
  marginRight: 8,
},
legendText: {
  fontSize: 13,
  color: '#666',
},
percentageCard: {
  backgroundColor: '#E3F2FD',
  padding: 20,
  borderRadius: 12,
  alignItems: 'center',
  marginBottom: 20,
},
percentageTitle: {
  fontSize: 14,
  color: '#666',
  marginBottom: 8,
},
percentageValue: {
  fontSize: 42,
  fontWeight: 'bold',
  color: '#1976D2',
},
percentageSubtext: {
  fontSize: 12,
  color: '#666',
  marginTop: 4,
},
*/