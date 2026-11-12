import { RootState } from '@/action/store';
import { ThemeContext } from '@/action/theme/ThemeContext';
import { Theme } from '@/action/theme/themeReducer';
import Skeleton from '@/components/Skeleton';
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
  ViewStyle,
} from 'react-native';
import { useSelector } from 'react-redux';

/* ================= TYPES ================= */

interface MonthlySummaryResponse {
  studentClass: string;
  section: string;
  presentDays: number;
  absentDays: number;
  currentMonthAttendanceDays: number;
  lastMonthAttendanceDays: number;
  totalWorkingDays: number;
  percentage: number;
}

/* ================= COMPONENT ================= */

export default function StaffAttendance() {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  const userDetail = useSelector((state: RootState) => state.user.userDetail);

  const [summary, setSummary] = useState<MonthlySummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);

  /* ================= API ================= */

  useEffect(() => {
    fetchMonthlySummary();
  }, [month, year]);

  const fetchMonthlySummary = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('auth_token');
      const encodedTenant = await AsyncStorage.getItem('auth_tenant');
      const deviceId = await getDeviceId();

      if (!token || !encodedTenant || !userDetail) return;

      const tenantId = Buffer.from(encodedTenant, 'base64').toString('utf-8');

      const { data } = await axios.get<MonthlySummaryResponse>(
        `${API_BASE_URL}attendance/monthly-summary-mobile`,
        {
          params: {
            studentClass: userDetail.staffClass,
            section: userDetail.staffSection,
            year,
            month: month + 1,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-ID': tenantId,
            'X-Device-ID': deviceId,
          },
        }
      );
      // console.log("---fetchMonthlySummary", data);
      
      setSummary(data);
    } catch (error) {
      console.error('Monthly summary error:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= MONTH NAV ================= */

  const nextMonth = () => {
    setMonth((prev) => (prev === 11 ? 0 : prev + 1));
    if (month === 11) setYear((y) => y + 1);
  };

  const prevMonth = () => {
    setMonth((prev) => (prev === 0 ? 11 : prev - 1));
    if (month === 0) setYear((y) => y - 1);
  };

  /* ================= UI ================= */

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} style={styles.headerButton} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
      </View>

      {/* SUMMARY */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Monthly Summary</Text>

        {loading ? (
          <Skeleton isDark={theme.mode === 'dark'} />
        ) : summary ? (
          <>
            <View style={styles.summaryRow}>
              <SummaryItem label="Present" value={summary.presentDays} />
              <SummaryItem label="Absent" value={summary.absentDays} />
              <SummaryItem
                label="Attendance"
                value={`${summary.percentage}%`}
              />
            </View>

            <View style={styles.summaryFooter}>
              <Text style={styles.footerText}>
                Working Days: {summary.totalWorkingDays}
              </Text>
              <Text style={styles.footerText}>
                Last Month: {summary.lastMonthAttendanceDays} days
              </Text>
            </View>
          </>
        ) : (
          <Text style={{ color: '#9CA3AF' }}>No data available</Text>
        )}
      </View>

      {/* OVERALL */}
      {summary && (
        <View style={styles.statsRow}>
          <View style={styles.overallCard}>
            <Text style={styles.overallLabel}>Overall</Text>
            <Text style={styles.overallPercent}>
              {summary.percentage}%
            </Text>

            <View style={styles.progressBarBG}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${summary.percentage}%` } as ViewStyle,
                ]}
              />
            </View>
          </View>
        </View>
      )}

      {/* MONTH SELECTOR */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={prevMonth}>
          <Ionicons name="chevron-back" size={20} />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {month + 1}/{year}
        </Text>
        <TouchableOpacity onPress={nextMonth}>
          <Ionicons name="chevron-forward" size={20} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* ================= SMALL COMPONENT ================= */

function SummaryItem({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={{ width: '30%', alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#2563EB' }}>
        {value}
      </Text>
      <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
        {label}
      </Text>
    </View>
  );
}

/* ================= STYLES ================= */

function getStyles(theme: Theme) {
  const isDark = theme.mode === 'dark';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },

    header: {
      paddingTop: Platform.OS === 'ios' ? 60 : 50,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      paddingHorizontal: 14,
    },

    headerButton: {
      color: isDark ? '#E9EFFC' : '#000104',
    },

    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: isDark ? '#E9EFFC' : '#000104',
    },

    summaryCard: {
      backgroundColor: isDark ? '#000104' : '#D6DFDE',
      padding: 16,
      borderRadius: 18,
      margin: 14,
      elevation: 5,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12,
    },

    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    summaryFooter: {
      marginTop: 14,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      paddingTop: 10,
    },

    footerText: {
      fontSize: 13,
      color: '#6B7280',
    },

    statsRow: {
      marginHorizontal: 14,
    },

    overallCard: {
      backgroundColor: isDark ? '#000104' : '#D6DFDE',
      padding: 14,
      borderRadius: 16,
      elevation: 4,
    },

    overallLabel: { color: '#6B7280' },
    overallPercent: { fontSize: 26, fontWeight: '800', color: '#2563EB' },

    progressBarBG: {
      height: 8,
      backgroundColor: '#E5E7EB',
      borderRadius: 10,
      marginTop: 6,
    },

    progressBarFill: {
      height: 8,
      backgroundColor: '#2563EB',
      borderRadius: 10,
    },

    monthSelector: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 20,
    },

    monthText: {
      fontSize: 16,
      fontWeight: '700',
      marginHorizontal: 14,
    },
  });
}
