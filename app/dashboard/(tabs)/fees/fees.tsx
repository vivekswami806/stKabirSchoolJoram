import { RootState } from '@/action/store';
import { API_BASE_URL } from '@/config';
import { getDeviceId } from '@/helper/getDeviceId';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ToastService } from "react-native-toastier";
import { useSelector } from 'react-redux';

import { getMonthlyReceipts, MonthlyReceipt } from '@/utils/feeReceipts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Installment {
  id: number;
  monthLabel: string;
  dueDate: string;
  dueAmount: number;
  paidAmount: number;
  balance: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'UPCOMING';
  visible: boolean;
}

interface FeeCategory {
  assignmentId: number;
  categoryName: string;
  billingType: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
  totalDue: number;
  totalPaid: number;
  balance: number;
  installments: Installment[];
}

interface FeeData {
  admissionNo: string;
  academicYear: string;
  categories: FeeCategory[];
  pendingPenalties: number;
  previousDuesPending: number;
  walletBalance: number;
}

interface AcademicYear {
  id: number;
  yearCode: string;
  isActive: boolean;
}

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  PAID: { bg: '#D1FAE5', text: '#065F46', label: 'Paid' },
  PARTIAL: { bg: '#FEF3C7', text: '#92400E', label: 'Partial' },
  PENDING: { bg: '#FEE2E2', text: '#991B1B', label: 'Pending' },
  UPCOMING: { bg: '#EDE9FE', text: '#4C1D95', label: 'Upcoming' },
};

const getBillingIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    MONTHLY: 'calendar-outline',
    TRANSPORT: 'bus-outline',
    QUARTERLY: 'layers-outline',
    YEARLY: 'ribbon-outline',
  };
  return map[type?.toUpperCase()] ?? 'cash-outline';
};

// ─── Auth Headers Helper ───────────────────────────────────────────────────────

export const getAuthHeaders = async () => {
  const [token, encodedTenant, deviceId] = await Promise.all([
    AsyncStorage.getItem('auth_token'),
    AsyncStorage.getItem('auth_tenant'),
    getDeviceId(),
  ]);
  if (!token || !encodedTenant) throw new Error('Missing auth credentials');
  const tenantId = Buffer.from(encodedTenant, 'base64').toString('utf-8');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-ID': tenantId,
      'X-Device-ID': deviceId,
    },
  };
};

// ─── StatusPill ───────────────────────────────────────────────────────────────

const StatusPill = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.pillText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
};

// ─── ProgressBar ──────────────────────────────────────────────────────────────

const ProgressBar = ({ paid, due }: { paid: number; due: number }) => {
  const pct = due > 0 ? Math.min((paid / due) * 100, 100) : 0;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const barColor = pct === 100 ? '#059669' : pct > 50 ? '#3B4FBF' : '#F59E0B';

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width, backgroundColor: barColor }]} />
    </View>
  );
};

// ─── AmountBox ────────────────────────────────────────────────────────────────

const AmountBox = ({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: number;
  valueColor?: string;
}) => (
  <View style={styles.amountBox}>
    <Text style={styles.amountLabel}>{label}</Text>
    <Text style={[styles.amountValue, valueColor ? { color: valueColor } : null]}>
      Rs.{value.toLocaleString('en-IN')}
    </Text>
  </View>
);

// ─── InfoRow ──────────────────────────────────────────────────────────────────

const InfoRow = ({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabelRow}>
      <Ionicons name={icon} size={15} color={iconColor} style={{ marginRight: 6 }} />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

// ─── FeeCard ──────────────────────────────────────────────────────────────────

const FeeCard = ({ item }: { item: FeeCategory }) => {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    setExpanded(prev => !prev);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const pct = item.totalDue > 0 ? Math.round((item.totalPaid / item.totalDue) * 100) : 0;


  return (
    <View style={styles.feeCard}>
      <TouchableOpacity activeOpacity={0.85} onPress={toggle}>
        {/* Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.categoryIconWrap}>
              <Ionicons name={getBillingIcon(item.billingType)} size={18} color="#3B4FBF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryName} numberOfLines={1}>
                {item.categoryName}
              </Text>
              <Text style={styles.billingType}>
                {item.billingType.charAt(0) + item.billingType.slice(1).toLowerCase()} billing
              </Text>
            </View>
          </View>
          <StatusPill status={item.status} />
        </View>

        {/* Amount Grid */}
        <View style={styles.amountsRow}>
          <AmountBox label="Total Due" value={item.totalDue} />
          <View style={styles.amountDivider} />
          <AmountBox label="Paid" value={item.totalPaid} valueColor="#059669" />
          <View style={styles.amountDivider} />
          <AmountBox
            label="Balance"
            value={item.balance}
            valueColor={item.balance > 0 ? '#DC2626' : '#059669'}
          />
        </View>

        {/* Progress */}
        <ProgressBar paid={item.totalPaid} due={item.totalDue} />
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>{pct}% paid</Text>
          <Text style={styles.progressLabel}>{item.installments.length} installments</Text>
        </View>

        {/* Expand Toggle */}
        <View style={styles.expandRow}>
          <Text style={styles.expandText}>
            {expanded ? 'Hide Installments' : 'View Installments'}
          </Text>
          {/* <Text style={styles.expandText} onPress={()=>{router.push("/dashboard/(tabs)/fees/ReceiptScreen")}}>

          </Text> */}
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="chevron-down" size={16} color="#3B4FBF" />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Installments List */}
      {expanded && (
        <View style={styles.installmentContainer}>
          {item.installments.map((inst, idx) => {
            const cfg = STATUS_CONFIG[inst.status] ?? STATUS_CONFIG.PENDING;
            const isLast = idx === item.installments.length - 1;
            return (
              <View
                key={inst.id}
                style={[styles.installmentRow, isLast && { borderBottomWidth: 0 }]}
              >
                <View style={styles.instLeft}>
                  <Text style={styles.instMonth}>{inst.monthLabel}</Text>
                  <Text style={styles.instDate}>Due: {inst.dueDate}</Text>
                  {inst.paidAmount > 0 && inst.status !== 'PAID' && (
                    <Text style={styles.instPaidHint}>
                      Paid: Rs.{inst.paidAmount.toLocaleString('en-IN')}
                    </Text>
                  )}
                </View>
                <View style={styles.instRight}>
                  <Text style={styles.instAmount}>
                    Rs.{inst.dueAmount.toLocaleString('en-IN')}
                  </Text>
                  <View style={[styles.instPill, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.instPillText, { color: cfg.text }]}>
                      {cfg.label}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const FeeDetailScreen = () => {
  const { userDetail } = useSelector((state: RootState) => state.user);

  const [feeData, setFeeData] = useState<FeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [showYearFilter, setShowYearFilter] = useState(false);


  // fetch fee data for a given admission + year
  const fetchFees = useCallback(async (admNo: string, yearCode: string) => {
    try {
      setLoading(true);
      const config = await getAuthHeaders();
      const { data } = await axios.get(
        `${API_BASE_URL}payments/get-fee-statement?admissionNo=${admNo}&academicYear=${yearCode}`,
        config
      );

      setFeeData(data);
    } catch (err: any) {

      ToastService.show({
        type: "danger",
        message: err.response.data.error,
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // runs ONCE on mount — fetches years then loads active year fees
  useEffect(() => {
    const init = async () => {
      try {
        const config = await getAuthHeaders();
        const { data } = await axios.get(
          `${API_BASE_URL}v2/academic-years/getAllAcademicYears`,
          config
        );
        const years: AcademicYear[] = Array.isArray(data) ? data : [];
        setAcademicYears(years);

        const active = years.find(y => y.isActive);
        if (active) {
          setSelectedYear(active.yearCode);
          fetchFees(userDetail.studentAdmissionNumber, active.yearCode);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        console.log('Academic Year Error:', err?.response?.data ?? err.message);
        setLoading(false);
      }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const handleYearSelect = (year: AcademicYear) => {
    setSelectedYear(year.yearCode);
    setShowYearFilter(false);
    fetchFees(userDetail.studentAdmissionNumber, year.yearCode);
  };

  const totalPaid = feeData?.categories?.reduce((s, c) => s + c.totalPaid, 0) ?? 0;
  const totalDue = feeData?.categories?.reduce((s, c) => s + c.totalDue, 0) ?? 0;
  const totalDueCount = Math.abs(totalPaid - totalDue);
  const overallPct = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

  const monthlyReceipts: MonthlyReceipt[] = feeData?.categories
    ? getMonthlyReceipts(feeData.categories)
    : [];
  // Loading
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3B4FBF" />
        <Text style={styles.loadingText}>Loading Fee Details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B4FBF" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push('/(tabs)/home')}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Fee Details</Text>
          {selectedYear ? (
            <Text style={styles.headerSub}>{selectedYear}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.headerBtn,
            styles.filterBtn,
            showYearFilter && styles.filterBtnActive,
          ]}
          onPress={() => setShowYearFilter(v => !v)}
        >
          <Ionicons
            name="filter"
            size={18}
            color={showYearFilter ? '#fff' : '#3B4FBF'}
          />
        </TouchableOpacity>
      </View>

      {/* Year Filter Chips (slides in below header) */}
      {showYearFilter && (
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {academicYears.map(year => (
              <TouchableOpacity
                key={year.id}
                onPress={() => handleYearSelect(year)}
                style={[
                  styles.yearChip,
                  selectedYear === year.yearCode && styles.activeYearChip,
                ]}
              >
                {year.isActive && <View style={styles.activeDot} />}
                <Text
                  style={[
                    styles.yearChipText,
                    selectedYear === year.yearCode && styles.activeYearChipText,
                  ]}
                >
                  {year.yearCode}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroMeta}>
            <View>
              <Text style={styles.heroMetaLabel}>Admission No</Text>
              <Text style={styles.heroMetaValue}>{feeData?.admissionNo ?? '—'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.heroMetaLabel}>Academic Year</Text>
              <Text style={styles.heroMetaValue}>{feeData?.academicYear ?? '—'}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>Rs.{totalPaid.toLocaleString('en-IN')}</Text>
              <Text style={styles.statLbl}>Total Paid</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>Rs.{totalDueCount.toLocaleString('en-IN')}</Text>
              <Text style={styles.statLbl}>Total Due</Text>
            </View>
          </View>

          {/* Overall Progress */}
          <View style={styles.heroProgressWrap}>
            <View style={styles.heroProgressTrack}>
              <View style={[styles.heroProgressFill, { width: `${overallPct}%` as any }]} />
            </View>
            <Text style={styles.heroProgressLabel}>{overallPct}% of total fees paid</Text>
          </View>
        </View>

        {/* Fee Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Fee Categories</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {feeData?.categories?.length ?? 0} categories
              </Text>
            </View>
          </View>

          {feeData?.categories?.length ? (
            feeData.categories.map(item => (
              <FeeCard key={item.assignmentId} item={item} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No fee data for this year</Text>
            </View>
          )}
        </View>
{/* 
        {monthlyReceipts.length > 0 && (
  <View style={styles.section}>
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>Receipts</Text>
      <TouchableOpacity
        style={styles.countBadge}
        onPress={() =>
          router.push({
            pathname: '/dashboard/(tabs)/fees/Receipthistory',
            params: {
              admissionNo: feeData?.admissionNo,
              academicYear: feeData?.academicYear,
            },
          })
        }
      >
        <Text style={styles.countText}>View All</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.infoCard}>
      {monthlyReceipts.map((receipt, idx) => (
                <View
                  key={receipt.monthKey}
                  style={[
                    styles.infoRow,
                    idx === monthlyReceipts.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.infoLabelRow}>
                    <Ionicons name="receipt-outline" size={15} color="#3B4FBF" style={{ marginRight: 6 }} />
                    <View>
                      <Text style={styles.infoLabel}>{receipt.monthDisplay}</Text>
                      <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        Rs.{receipt.totalPaid.toLocaleString('en-IN')} paid
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.receiptBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/dashboard/(tabs)/fees/ReceiptScreen',
                        params: {
                          receipt: JSON.stringify(receipt),
                          admissionNo: feeData?.admissionNo,
                          academicYear: feeData?.academicYear,
                        },
                      })
                    }
                  >
                    <Text style={styles.receiptBtnText}>View</Text>
                    <Ionicons name="chevron-forward" size={14} color="#3B4FBF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )} */}

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
            Additional Info
          </Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon="alert-circle-outline"
              iconColor="#DC2626"
              label="Pending Penalties"
              value={`Rs.${(feeData?.pendingPenalties ?? 0).toLocaleString('en-IN')}`}
            />
            <InfoRow
              icon="time-outline"
              iconColor="#D97706"
              label="Previous Dues"
              value={`Rs.${(feeData?.previousDuesPending ?? 0).toLocaleString('en-IN')}`}
            />
            <InfoRow
              icon="wallet-outline"
              iconColor="#059669"
              label="Wallet Balance"
              value={`Rs.${(feeData?.walletBalance ?? 0).toLocaleString('en-IN')}`}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FeeDetailScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F8' },

  loaderContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff', gap: 12,
  },
  loadingText: { color: '#6B7280', fontSize: 15 },

  // Header ──────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#3B4FBF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 28,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  filterBtn: { backgroundColor: '#fff' },
  filterBtnActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  // Year Filter ─────────────────────────────────────────────────────────────
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  yearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeYearChip: { backgroundColor: '#3B4FBF', borderColor: '#3B4FBF' },
  yearChipText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  activeYearChipText: { color: '#fff' },
  activeDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#10B981',
  },

  // Hero Card ───────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: '#3B4FBF',
    marginHorizontal: 16,
    marginTop: -14,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#3B4FBF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroMeta: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18,
  },
  heroMetaLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
  },
  heroMetaValue: { fontSize: 15, fontWeight: '600', color: '#fff' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, overflow: 'hidden',
  },
  statBox: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statNum: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  statLbl: {
    fontSize: 11, color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase', letterSpacing: 0.7,
  },
  heroProgressWrap: { marginTop: 16 },
  heroProgressTrack: {
    height: 5, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 99, overflow: 'hidden', marginBottom: 6,
  },
  heroProgressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 99 },
  heroProgressLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.65)', textAlign: 'center',
  },

  // Section ─────────────────────────────────────────────────────────────────
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  countBadge: {
    backgroundColor: '#E5E7EB', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 20,
  },
  countText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  // Empty State ─────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center', paddingVertical: 40,
    backgroundColor: '#fff', borderRadius: 18, gap: 10,
  },
  emptyText: { fontSize: 14, color: '#9CA3AF' },

  // Fee Card ────────────────────────────────────────────────────────────────
  feeCard: {
    backgroundColor: '#fff', borderRadius: 18, marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16, paddingBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, flex: 1, marginRight: 10,
  },
  categoryIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#EEF0FB', justifyContent: 'center', alignItems: 'center',
  },
  categoryName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  billingType: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  pillText: { fontSize: 11, fontWeight: '700' },

  // Amount Grid ─────────────────────────────────────────────────────────────
  amountsRow: {
    flexDirection: 'row', marginHorizontal: 16,
    backgroundColor: '#F8F9FC', borderRadius: 12,
    marginBottom: 14, overflow: 'hidden',
  },
  amountBox: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  amountDivider: { width: 1, backgroundColor: '#E5E7EB' },
  amountLabel: {
    fontSize: 10, color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5,
  },
  amountValue: { fontSize: 14, fontWeight: '700', color: '#111827' },

  // Progress Bar ────────────────────────────────────────────────────────────
  progressTrack: {
    height: 5, backgroundColor: '#E5E7EB', borderRadius: 99,
    marginHorizontal: 16, marginBottom: 6, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 99 },
  progressLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 4,
  },
  progressLabel: { fontSize: 11, color: '#9CA3AF' },

  // Expand Toggle ───────────────────────────────────────────────────────────
  expandRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 12, marginHorizontal: 16,
    borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 4,
  },
  expandText: { color: '#3B4FBF', fontWeight: '600', fontSize: 13 },

  // Installments ────────────────────────────────────────────────────────────
  installmentContainer: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  installmentRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  instLeft: { flex: 1 },
  instMonth: { fontSize: 14, fontWeight: '600', color: '#111827' },
  instDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  instPaidHint: { fontSize: 11, color: '#059669', marginTop: 2 },
  instRight: { alignItems: 'flex-end' },
  instAmount: { fontSize: 14, fontWeight: '700', color: '#111827' },
  instPill: { marginTop: 5, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  instPillText: { fontSize: 10, fontWeight: '700' },

  // Info Card ───────────────────────────────────────────────────────────────
  infoCard: {
    backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  infoLabelRow: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 13, color: '#6B7280' },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#111827' },

  // Pay Button ──────────────────────────────────────────────────────────────
  payBtn: {
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: '#3B4FBF', borderRadius: 14,
    paddingVertical: 15, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#3B4FBF', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  payBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#EEF0FB',
  },
  receiptBtnText: { color: '#3B4FBF', fontWeight: '700', fontSize: 12 },
});


// ─── Styles ────────────────────────────────────────────────────────────────────

const styles2 = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F8',
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 12,
  },

  loadingText: {
    color: '#6B7280',
    fontSize: 15,
  },

  // ── Header
  header: {
    backgroundColor: '#3B4FBF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 28,
  },

  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  walletBtn: {
    backgroundColor: '#fff',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },

  // ── Hero Card
  heroCard: {
    backgroundColor: '#3B4FBF',
    marginHorizontal: 16,
    marginTop: -14,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#3B4FBF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  heroMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  heroMetaLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  heroMetaValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    overflow: 'hidden',
  },

  statBox: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },

  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  statNum: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },

  statLbl: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  // ── Section
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  countBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  countText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // ── Fee Card
  feeCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },

  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },

  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEF0FB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  billingType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },

  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Amount Row
  amountsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#F8F9FC',
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },

  amountBox: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },

  amountDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },

  amountLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 5,
  },

  amountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  // ── Progress Bar
  progressTrack: {
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 99,
    marginHorizontal: 16,
    marginBottom: 6,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#3B4FBF',
    borderRadius: 99,
  },

  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 4,
  },

  progressLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  // ── Expand Toggle
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 4,
  },

  expandText: {
    color: '#3B4FBF',
    fontWeight: '600',
    fontSize: 13,
  },

  // ── Installments
  installmentContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  installmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },

  instLeft: {
    flex: 1,
  },

  instMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  instDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },

  instPaidHint: {
    fontSize: 11,
    color: '#059669',
    marginTop: 2,
  },

  instRight: {
    alignItems: 'flex-end',
  },

  instAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  instPill: {
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },

  instPillText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // ── Info Card
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
  },

  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },

  // ── Pay Button
  payBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#3B4FBF',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#3B4FBF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },

  payBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  filterBtn: {
    backgroundColor: '#fff',
  },

  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  yearChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    marginRight: 10,
  },

  activeYearChip: {
    backgroundColor: '#3B4FBF',
  },

  yearChipText: {
    color: '#3B4FBF',
    fontWeight: '600',
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#EEF0FB',
  },
  receiptBtnText: { color: '#3B4FBF', fontWeight: '700', fontSize: 12 },
});