import { RootState } from '@/action/store';
import { ThemeContext } from '@/action/theme/ThemeContext';
import { Theme } from '@/action/theme/themeReducer';
import LeaveSkeleton from '@/app/adminDashboard/(tabs)/leave/LeaveSkeleton';
import { API_BASE_URL } from '@/config';
import { getDeviceId } from '@/helper/getDeviceId';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';

interface LeaveItem {
  id: number;
  date: string;
  type: string;
  leaveType: string;
  status: 'Waiting' | 'Cancelled' | 'Approved';
}

interface LeaveSection {
  month: string;
  leaves: LeaveItem[];
}
const mapStatus = (status: string): 'Waiting' | 'Cancelled' | 'Approved' => {
  switch (status) {
    case 'PENDING':
      return 'Waiting';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Cancelled';
    default:
      return 'Waiting';
  }
};

/* ===========================
   LEAVE CARD
=========================== */
const LeaveCard = ({
  leave,
  styles,
}: {
  leave: LeaveItem;
  styles: any;
}) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Waiting':
        return styles.statusWaiting;
      case 'Cancelled':
        return styles.statusCancelled;
      case 'Approved':
        return styles.statusApproved;
      default:
        return {};
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'Waiting':
        return styles.statusTextWaiting;
      case 'Cancelled':
        return styles.statusTextCancelled;
      case 'Approved':
        return styles.statusTextApproved;
      default:
        return {};
    }
  };
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{leave.date}</Text>
        <View style={[styles.statusBadge, getStatusStyle(leave.status)]}>
          <Text style={[styles.statusText, getStatusTextStyle(leave.status)]}>
            {leave.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>😊</Text>
          </View>
          <Text style={styles.detailText}>{leave.type}</Text>
        </View>

        <View style={styles.detailItem}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>📄</Text>
          </View>
          <Text style={styles.detailText}>{leave.leaveType}</Text>
        </View>
      </View>
    </View>
  );
};

/* ===========================
   MAIN SCREEN
=========================== */
const LeaveManagementUI = () => {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  const { userDetail } = useSelector((state: RootState) => state.user);

  if (!themeState) return null;

  const { theme } = themeState;
  const styles = getStyles(theme);

  const [rawLeaves, setRawLeaves] = useState<any[]>([]);
  const [leaveSections, setLeaveSections] = useState<LeaveSection[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 10;
  const fetchLeaves = async () => {
    if (loading) return;
  
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();
      if (!token || !encodedTenant) throw new Error('Auth missing');
  
      const tenantId = Buffer.from(encodedTenant, 'base64').toString('utf-8');
  
      const response = await axios.get(
        `${API_BASE_URL}leaves/myLeave`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-ID': tenantId,
            'X-Device-ID': deviceId,
          },
        }
      );
      console.log("---leave|staff", response.data[0] );
      
      const apiLeaves = response.data ?? [];
      const sortedLeaves = apiLeaves.sort(
        (a: any, b: any) =>
          new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime()
      );
      setRawLeaves(sortedLeaves);
      setLeaveSections(groupLeavesByMonth(sortedLeaves));
    } catch (error) {
      console.error('Leave API error:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const handleLoadMore = ({ nativeEvent }: any) => {
    const paddingToBottom = 20;
    const isBottomReached =
      nativeEvent.layoutMeasurement.height +
      nativeEvent.contentOffset.y >=
      nativeEvent.contentSize.height - paddingToBottom;

    // if (isBottomReached) {
    //   fetchLeaves(page + 1);
    // }
  };

  const groupLeavesByMonth = (leaves: any[]): LeaveSection[] => {
    const map: Record<string, LeaveItem[]> = {};
  
    leaves.forEach(item => {
      const month = new Date(item.fromDate).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
  
      if (!map[month]) map[month] = [];
  
      map[month].push({
        id: item.id,
        date: `${item.fromDate} → ${item.toDate}`, // display range
        type: `${item.totalDays} Days`,
        leaveType: item.leaveType,
        status: mapStatus(item.status),
      });
    });
  
    return Object.keys(map).map(month => ({
      month,
      leaves: map[month],
    }));
  };
  
  
  useEffect(() => {
    fetchLeaves();
  }, []);
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/staffDashboard/(tabs)/TeacherLeaveApprovalScreen")}>
          <Ionicons name="arrow-back" size={26} color={styles.icon.color} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Leave</Text>

        <TouchableOpacity onPress={() => router.push("/staffDashboard/(tabs)/addleave")}>
          <Ionicons name="add" size={26} color={styles.icon.color} />
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleLoadMore}
        scrollEventThrottle={16}
      >
        {leaveSections.map((section, i) => (
          <View key={i}>
            <Text style={styles.monthHeader}>{section.month}</Text>
            {section.leaves.map(leave => (
              <LeaveCard key={leave.id} leave={leave} styles={styles} />
            ))}
          </View>
        ))}

        {loading && (
          <LeaveSkeleton isDark={false}/>
        )}
      </ScrollView>

    </View>
  );
};

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  const colors = {
    background: isDark ? "#0B1220" : "#F9FAFB",
    card: isDark ? "#111827" : "#FFFFFF",
    border: isDark ? "#1F2937" : "#E5E7EB",
    textPrimary: isDark ? "#E9EFFC" : "#111827",
    textSecondary: isDark ? "#9CA3AF" : "#6B7280",
    iconBg: isDark ? "#1F2937" : "#F3F4F6",

    // Status colors (dark adjusted)
    waitingBg: isDark ? "#3F2A14" : "#FFF7ED",
    waitingBorder: "#FB923C",
    waitingText: isDark ? "#FDBA74" : "#EA580C",

    cancelledBg: isDark ? "#3B1C1C" : "#FEF2F2",
    cancelledBorder: "#EF4444",
    cancelledText: isDark ? "#FCA5A5" : "#DC2626",

    approvedBg: isDark ? "#123524" : "#F0FDF4",
    approvedBorder: "#22C55E",
    approvedText: isDark ? "#86EFAC" : "#16A34A",
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: Platform.OS === "ios" ? 60 : 40,
    },

    icon: {
      color: colors.textPrimary,
    },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },

    monthHeader: {
      fontSize: 14,
      marginTop: 16,
      marginBottom: 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },

    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },

    dateText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
    },

    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
    },

    statusWaiting: {
      backgroundColor: colors.waitingBg,
      borderColor: colors.waitingBorder,
    },
    statusCancelled: {
      backgroundColor: colors.cancelledBg,
      borderColor: colors.cancelledBorder,
    },
    statusApproved: {
      backgroundColor: colors.approvedBg,
      borderColor: colors.approvedBorder,
    },

    statusText: {
      fontSize: 12,
      fontWeight: "600",
    },
    statusTextWaiting: { color: colors.waitingText },
    statusTextCancelled: { color: colors.cancelledText },
    statusTextApproved: { color: colors.approvedText },

    cardDetails: {
      flexDirection: "row",
      gap: 24,
    },

    detailItem: {
      flexDirection: "row",
      alignItems: "center",
    },

    iconCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.iconBg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },

    iconText: {
      fontSize: 11,
    },

    detailText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
  });
}


export default LeaveManagementUI;