// import { Ionicons } from "@expo/vector-icons";
// import React, { memo } from "react";
// import { Text, TouchableOpacity, View } from "react-native";

// interface Person {
//   id: string;
//   name: string;
//   avatar: string;
//   isPresent: boolean;
// }

// interface AttendanceRowProps {
//   item: Person;
//   listType: "students" | "teachers";
//   styles: any;
//   toggleAttendance: (id: string, status: boolean) => void;
// }

// const AttendanceRow = memo(({ item, listType, styles, toggleAttendance }: AttendanceRowProps) => {
//   return (
//     <View style={styles.studentRow}>
//       <View style={styles.studentInfo}>
//         <View style={[styles.avatar, { backgroundColor: item.isPresent ? '#e0e7ff' : '#ffe4e6' }]}>
//           <Text style={{fontSize: 18}}>{item.avatar}</Text>
//         </View>
//         <Text style={styles.studentName}>{item.name}</Text>
//       </View>

//       <View style={styles.attendanceButtons}>
//         {/* Present Button */}
//         <TouchableOpacity
//           onPress={() => toggleAttendance(item.id, true)}
//           style={[styles.checkButton, item.isPresent && styles.checkButtonActive]}
//         >
//           {item.isPresent && <Ionicons name="checkmark" size={16} color="white" />}
//         </TouchableOpacity>

//         {/* Spacer */}
//         <View style={{width: 20}} />

//         {/* Absent Button */}
//         <TouchableOpacity
//           onPress={() => toggleAttendance(item.id, false)}
//           style={[styles.checkButton, !item.isPresent && { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' }]}
//         >
//           {!item.isPresent && <Ionicons name="close" size={16} color="white" />}
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// });

// export default AttendanceRow;


import { Ionicons } from "@expo/vector-icons";
import React, { memo, useRef } from "react";
import { Animated, Image, Text, TouchableOpacity, View } from "react-native";
/* ================= TYPES ================= */

interface Person {
  id: string;
  name: string;
  avatar?: string;          // fallback initials
  image?: string | null;    // base64 image
  isPresent: "A" | "P";
  synced?: boolean;
}


interface AttendanceRowProps {
  item: Person;
  listType: "students" | "teachers";
  styles: any;
  toggleAttendance: (id: string, status: "A" | "P") => void;
}

/* ================= COMPONENT ================= */

const AttendanceRow = memo(
  ({ item, listType, styles, toggleAttendance }: AttendanceRowProps) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = (status: "A" | "P") => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      toggleAttendance(item.id, status);
    };

    const isPresent = item.isPresent === "P";

    return (
      <Animated.View
        style={[styles.studentRow, { transform: [{ scale: scaleAnim }] }]}
      >
        {/* ================= STUDENT INFO ================= */}
        <View style={styles.studentInfo}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: isPresent ? "#e0e7ff" : "#ffe4e6" },
            ]}
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ fontSize: 18 }}>
                {item.avatar}
              </Text>
            )}
          </View>


          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>{item.name}</Text>

            {/* Sync Status */}
            {item.synced === false && (
              <View style={styles.syncStatusContainer}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={12}
                  color="#FF9800"
                />
                <Text style={styles.syncStatusText}>Pending sync</Text>
              </View>
            )}

            {item.synced === true && (
              <View style={styles.syncStatusContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={12}
                  color="#4CAF50"
                />
                <Text
                  style={[styles.syncStatusText, { color: "#4CAF50" }]}
                >
                  Synced
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ================= ACTION BUTTONS ================= */}
        <View style={styles.attendanceButtons}>
          {/* Present */}
          <TouchableOpacity
            onPress={() => handlePress("P")}
            style={[
              styles.checkButton,
              isPresent && styles.checkButtonActive,
            ]}
            activeOpacity={0.7}
          >
            {isPresent && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </TouchableOpacity>

          <View style={{ width: 20 }} />

          {/* Absent */}
          <TouchableOpacity
            onPress={() => handlePress("A")}
            style={[
              styles.checkButton,
              !isPresent && {
                backgroundColor: "#FF6B6B",
                borderColor: "#FF6B6B",
              },
            ]}
            activeOpacity={0.7}
          >
            {!isPresent && (
              <Ionicons name="close" size={16} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }
);

export default AttendanceRow;


// Add these styles to your existing styles:
/*
syncStatusContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 4,
  gap: 4,
},
syncStatusText: {
  fontSize: 11,
  color: '#FF9800',
  fontWeight: '500',
},
*/