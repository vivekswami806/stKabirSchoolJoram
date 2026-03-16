import { ThemeContext } from '@/action/theme/ThemeContext';
import { Theme } from '@/action/theme/themeReducer';
import ErrorRetry from '@/app/adminDashboard/(tabs)/components/ErrorRetry';
import LeaveSkeleton from '@/app/adminDashboard/(tabs)/leave/LeaveSkeleton';
import Skeleton from '@/components/Skeleton';
import { API_BASE_URL } from '@/config';
import { getDeviceId } from '@/helper/getDeviceId';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';
import { useRouter } from 'expo-router';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

/* ===========================
   TYPES
=========================== */
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

/* ===========================
   HELPERS
=========================== */
const mapStatus = (status: string): LeaveItem['status'] => {
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

const formatMonth = (date: string) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

/* ===========================
   LEAVE CARD
=========================== */
const LeaveCard = React.memo(
  ({ leave, styles }: { leave: LeaveItem; styles: any }) => {
    const statusStyleMap = {
      Waiting: [styles.statusWaiting, styles.statusTextWaiting],
      Cancelled: [styles.statusCancelled, styles.statusTextCancelled],
      Approved: [styles.statusApproved, styles.statusTextApproved],
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{leave.date}</Text>

          <View style={[styles.statusBadge, statusStyleMap[leave.status][0]]}>
            <Text style={[styles.statusText, statusStyleMap[leave.status][1]]}>
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
  }
);

/* ===========================
   MAIN SCREEN
=========================== */
const LeaveManagementUI = () => {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  // const { userDetail } = useSelector((state: RootState) => state.user);
  const [error, setError] = useState<string | null>(null);
  if (!themeState) return null;

  const { theme } = themeState;
  const styles = useMemo(() => getStyles(theme), [theme]);
  const isDark = theme.mode === "dark";
  const [leaveSections, setLeaveSections] = useState<LeaveSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const groupLeavesByMonth = useCallback((leaves: any[]): LeaveSection[] => {
    const map: Record<string, LeaveItem[]> = {};

    leaves.forEach(item => {
      const month = formatMonth(item.fromDate);

      if (!map[month]) map[month] = [];

      map[month].push({
        id: item.id,
        date: `${item.fromDate} → ${item.toDate}`,
        type: `${item.totalDays} Days`,
        leaveType: item.leaveType,
        status: mapStatus(item.status),
      });
    });

    return Object.entries(map).map(([month, leaves]) => ({
      month,
      leaves,
    }));
  }, []);

  const fetchLeaves = useCallback(
    async (isRefresh = false) => {
      if (loading) return;

      isRefresh ? setRefreshing(true) : setLoading(true);

      try {
        const [token, encodedTenant, deviceId] = await Promise.all([
          AsyncStorage.getItem('auth_token'),
          AsyncStorage.getItem('auth_tenant'),
          getDeviceId(),
        ]);

        if (!token || !encodedTenant) throw new Error('Auth missing');

        const tenantId = Buffer.from(encodedTenant, 'base64').toString('utf-8');

        const { data } = await axios.get(`${API_BASE_URL}leaves/myLeave`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-ID': tenantId,
            'X-Device-ID': deviceId,
          },
        });

        // ✅ Latest first
        const sortedLeaves = (data ?? []).sort(
          (a: any, b: any) =>
            new Date(b.fromDate).getTime() -
            new Date(a.fromDate).getTime()
        );

        setLeaveSections(groupLeavesByMonth(sortedLeaves));
      } catch (error) {
        setError("Error")
        setLoading(false);
        console.error('Leave API error:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [groupLeavesByMonth]
  );


  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={26} color={styles.icon.color} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Leave</Text>

        <TouchableOpacity
          onPress={() => router.push('/dashboard/(tabs)/addleave')}
        >
          <Ionicons name="add" size={26} color={styles.icon.color} />
        </TouchableOpacity>
      </View>
      {loading && (<LeaveSkeleton isDark={isDark} />)}

{/* LIST */}
{!loading && error ? (
  <ErrorRetry
    message={error}
    isDark={isDark}
    loading={loading}
    onRetry={() => fetchLeaves()}
  />
) : leaveSections.length === 0 ? (
  <View style={styles.emptyContainer}>
    <Ionicons
      name="document-text-outline"
      size={80}
      color={"#6B7280"}
      style={styles.emptyIcon}
    />
    <Text style={styles.emptyTitle}>No Leave</Text>
    <Text style={styles.emptySubtitle}>There are no Leave to show.</Text>
  </View>
) :
      <FlatList
        data={leaveSections}
        keyExtractor={item => item.month}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View>
            <Text style={styles.monthHeader}>{item.month}</Text>
            {item.leaves.map(leave => (
              <LeaveCard key={leave.id} leave={leave} styles={styles} />
            ))}
          </View>
        )}
        refreshing={refreshing}                 // 👈 pull state
        onRefresh={() => fetchLeaves(true)}      // 👈 pull action
        ListFooterComponent={loading ? <Skeleton isDark={isDark} /> : null}
        showsVerticalScrollIndicator={false}
      />
      }
    </View>
  );
};

/* ===========================
   STYLES (UNCHANGED DESIGN)
=========================== */
function getStyles(theme: Theme) {
  const isDark = theme.mode === 'dark';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? theme.background : '#F9FAFB',
      paddingTop: Platform.OS === 'ios' ? 40 : 30,
    },
    icon: {
      color: isDark ? '#E9EFFC' : '#111827',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: isDark ? '#111827' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1F2937' : '#E5E7EB',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#E9EFFC' : '#111827',
    },
    monthHeader: {
      fontSize: 14,
      marginTop: 16,
      marginBottom: 12,
      fontWeight: '600',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    card: {
      backgroundColor: isDark ? '#111827' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    dateText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#E9EFFC' : '#111827',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
    },
    statusWaiting: {
      backgroundColor: '#FFF7ED',
      borderColor: '#FB923C',
    },
    statusCancelled: {
      backgroundColor: '#FEF2F2',
      borderColor: '#EF4444',
    },
    statusApproved: {
      backgroundColor: '#F0FDF4',
      borderColor: '#22C55E',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    statusTextWaiting: { color: '#EA580C' },
    statusTextCancelled: { color: '#DC2626' },
    statusTextApproved: { color: '#16A34A' },
    cardDetails: {
      flexDirection: 'row',
      gap: 24,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    iconText: {
      fontSize: 10,
    },
    detailText: {
      fontSize: 13,
      color: isDark ? '#9CA3AF' : '#6B7280',
    }, emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    emptyIcon: {
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: isDark ? "#F3F4F6" : "#111827",
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: isDark ? "#A1A1AA" : "#6B7280",
      textAlign: "center",
    },
  });
}

export default LeaveManagementUI;
