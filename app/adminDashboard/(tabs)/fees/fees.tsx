import { RootState } from '@/action/store';
import { API_BASE_URL } from '@/config';
import { getDeviceId } from '@/helper/getDeviceId';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ToastService } from 'react-native-toastier';
import { useSelector } from 'react-redux';

// ─── Types ────────────────────────────────────────────────────────────────

interface StudentFee {
  number: string;
  admissionNo: string;
  studentName: string;
  rollNumber: string;
  fatherName: string;
  parentPhone?: string;
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  previousDue: number;
  pendingPenalties: number;
  hasTransport: boolean;
  transportRoute?: string;
  transportDue: number;
  walletBalance: number;
  netPayable: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
}

interface ClassFeeSummary {
  className: string;
  classSection: string;
  academicYear: string;
  totalStudents: number;
  classTotalFee: number;
  classTotalPaid: number;
  classTotalDue: number;
  classTotalPreviousDues: number;
  classTotalWallet: number;
  classTotalNetPayable: number;
  students: StudentFee[];
}

interface AcademicYear {
  id: number;
  yearCode: string;
  isActive: boolean;
}

// ─── Static Options (replace with API-driven lists if available) ─────────

const CLASS_OPTIONS = [
 "pre-Nur", 'Nursery', 'LKG', 'UKG',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
];
const SECTION_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

// ─── Status Config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  PAID: { bg: '#D1FAE5', text: '#065F46', label: 'Paid' },
  PARTIAL: { bg: '#FEF3C7', text: '#92400E', label: 'Partial' },
  PENDING: { bg: '#FEE2E2', text: '#991B1B', label: 'Pending' },
};

// ─── Auth Headers Helper ───────────────────────────────────────────────────

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

// ─── Small Building Blocks ─────────────────────────────────────────────────

const StatusPill = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.pillText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
};

const StatBox = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.statBox}>
    <Text style={styles.statNum} numberOfLines={1} adjustsFontSizeToFit>
      Rs.{value.toLocaleString('en-IN')}
    </Text>
    <Text style={styles.statLbl}>{label}</Text>
  </View>
);

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

// ─── Student Card ───────────────────────────────────────────────────────────

const StudentCard = ({
  item,
  academicYear,
  className,
  classSection,
}: {
  item: StudentFee;
  academicYear: string;
  className?: string;
  classSection?: string;
}) => {
  const pct = item.totalFee > 0 ? Math.round((item.paidAmount / item.totalFee) * 100) : 0;

  const handleViewReceipt = (e: any) => {
    e.stopPropagation?.();

    const monthlyReceipt = {
      monthDisplay: `Fee Summary - ${item.studentName}`,
      totalPaid: item.paidAmount,
      items: [
        {
          categoryName: 'Total Fee',
          monthLabel: '-',
          paidAmount: item.paidAmount,
        },
      ],
    };

    router.push({
      pathname: '/adminDashboard/(tabs)/fees/Receipthistory',
      params: {
        receipt: JSON.stringify(monthlyReceipt),
        admissionNo: item.admissionNo,
        academicYear,
        studentName: item.studentName,
        parentPhone: item.number ?? '',
        balanceDue: String(item.dueAmount),
      },
    } as any);
  };

  const handleSendDue = (e: any) => {
    e.stopPropagation?.();

    router.push({
      pathname: '/adminDashboard/(tabs)/fees/Dueamountscreen',
      params: {
        student: JSON.stringify(item),
        className: className ?? '',
        classSection: classSection ?? '',
        academicYear,
      },
    } as any);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.studentCard}
      // onPress={() =>
      //   router.push({
      //     pathname: '/dashboard/(tabs)/fees/StudentFeeDetail',
      //     params: { admissionNo: item.admissionNo },
      //   } as any)
      // }
    >
      <View style={styles.studentHeaderRow}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>
            {item.studentName?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.studentName} numberOfLines={1}>
            {item.studentName}
          </Text>
          <Text style={styles.studentMeta} numberOfLines={1}>
            Adm No: {item.admissionNo}
            {item.rollNumber ? `  •  Roll: ${item.rollNumber}` : ''}
          </Text>
          {!!item.fatherName && (
            <Text style={styles.studentMeta} numberOfLines={1}>
              Father: {item.fatherName}
            </Text>
          )}
        </View>

        <StatusPill status={item.paymentStatus} />
      </View>

      <View style={styles.amountsRow}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Total Fee</Text>
          <Text style={styles.amountValue}>Rs.{item.totalFee.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.amountDivider} />
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Paid</Text>
          <Text style={[styles.amountValue, { color: '#059669' }]}>
            Rs.{item.paidAmount.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.amountDivider} />
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Due</Text>
          <Text
            style={[
              styles.amountValue,
              { color: item.dueAmount > 0 ? '#DC2626' : '#059669' },
            ]}
          >
            Rs.{item.dueAmount.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${pct}%` as any,
              backgroundColor: pct === 100 ? '#059669' : pct > 50 ? '#3B4FBF' : '#F59E0B',
            },
          ]}
        />
      </View>

      <View style={styles.tagsRow}>
        {item.hasTransport && (
          <View style={styles.tag}>
            <Ionicons name="bus-outline" size={12} color="#3B4FBF" />
            <Text style={styles.tagText}>
              {item.transportRoute ?? 'Transport'} · Rs.
              {item.transportDue.toLocaleString('en-IN')}
            </Text>
          </View>
        )}
        {item.previousDue > 0 && (
          <View style={[styles.tag, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time-outline" size={12} color="#92400E" />
            <Text style={[styles.tagText, { color: '#92400E' }]}>
              Prev Due Rs.{item.previousDue.toLocaleString('en-IN')}
            </Text>
          </View>
        )}
        {item.pendingPenalties > 0 && (
          <View style={[styles.tag, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="alert-circle-outline" size={12} color="#991B1B" />
            <Text style={[styles.tagText, { color: '#991B1B' }]}>
              Penalty Rs.{item.pendingPenalties.toLocaleString('en-IN')}
            </Text>
          </View>
        )}
        <View style={styles.netPayableTag}>
          <Text style={styles.netPayableText}>
            Net Payable: Rs.{item.netPayable.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <View style={styles.cardBtnRow}>
        <TouchableOpacity
          style={styles.viewBtn}
          activeOpacity={0.8}
          onPress={handleViewReceipt}
        >
          <Ionicons name="receipt-outline" size={14} color="#3B4FBF" />
          <Text style={styles.viewBtnText}>View</Text>
        </TouchableOpacity>

        {item.dueAmount > 0 && (
          <TouchableOpacity
            style={styles.sendDueBtn}
            activeOpacity={0.8}
            onPress={handleSendDue}
          >
            <Ionicons name="logo-whatsapp" size={14} color="#fff" />
            <Text style={styles.sendDueBtnText}>Send Due</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Filter Modal ───────────────────────────────────────────────────────────

const ChipGroup = ({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
  >
    {options.map(opt => (
      <TouchableOpacity
        key={opt}
        onPress={() => onSelect(opt)}
        style={[styles.chip, selected === opt && styles.chipActive]}
      >
        <Text style={[styles.chipText, selected === opt && styles.chipTextActive]}>
          {opt}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const FilterModal = ({
  visible,
  onClose,
  className,
  section,
  year,
  academicYears,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  className: string;
  section: string;
  year: string;
  academicYears: AcademicYear[];
  onApply: (className: string, section: string, year: string) => void;
}) => {
  const [tmpClass, setTmpClass] = useState(className);
  const [tmpSection, setTmpSection] = useState(section);
  const [tmpYear, setTmpYear] = useState(year);

  useEffect(() => {
    if (visible) {
      setTmpClass(className);
      setTmpSection(section);
      setTmpYear(year);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Filter Fee Summary</Text>

          <Text style={styles.modalLabel}>Class</Text>
          <ChipGroup options={CLASS_OPTIONS} selected={tmpClass} onSelect={setTmpClass} />

          <Text style={styles.modalLabel}>Section</Text>
          <ChipGroup options={SECTION_OPTIONS} selected={tmpSection} onSelect={setTmpSection} />

          <Text style={styles.modalLabel}>Academic Year</Text>
          <ChipGroup
            options={academicYears.map(y => y.yearCode)}
            selected={tmpYear}
            onSelect={setTmpYear}
          />

          <View style={styles.modalBtnRow}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalApplyBtn}
              onPress={() => {
                onApply(tmpClass, tmpSection, tmpYear);
                onClose();
              }}
            >
              <Text style={styles.modalApplyText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ────────────────────────────────────────────────────────────

const FeeDetailScreen = () => {
  const { userDetail } = useSelector((state: RootState) => state.user);

  const [feeData, setFeeData] = useState<ClassFeeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState(
    userDetail?.className ? String(userDetail.className) : '1'
  );
  const [selectedSection, setSelectedSection] = useState(
    userDetail?.section ? String(userDetail.section) : 'A'
  );

  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');

  // fetch class-level fee summary
  const fetchFees = useCallback(
    async (className: string, section: string, yearCode: string) => {
      if (!className || !section || !yearCode) return;
      try {
        const config = await getAuthHeaders();
        const { data } = await axios.get(
          `${API_BASE_URL}fee-summary/getFeeSummaryClass?className=${className}&section=${section}&academicYear=${yearCode}`,
          config
        );
        setFeeData(data);
      } catch (err: any) {
        ToastService.show({
          type: 'danger',
          message: err?.response?.data?.error ?? 'Failed to load fee summary',
          duration: 3000,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // runs ONCE on mount — fetches academic years then loads active year fees
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

        const active = years.find(y => y.isActive) ?? years[0];
        if (active) {
          setSelectedYear(active.yearCode);
          setLoading(true);
          fetchFees(selectedClass, selectedSection, active.yearCode);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        console.log('Academic Year Error:', err?.response?.data ?? err.message);
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilter = (className: string, section: string, year: string) => {
    setSelectedClass(className);
    setSelectedSection(section);
    setSelectedYear(year);
    setLoading(true);
    fetchFees(className, section, year);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFees(selectedClass, selectedSection, selectedYear);
  };

  const filteredStudents = useMemo(() => {
    const list = feeData?.students ?? [];
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      s =>
        s.studentName?.toLowerCase().includes(q) ||
        s.admissionNo?.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q) ||
        s.fatherName?.toLowerCase().includes(q)
    );
  }, [feeData, search]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3B4FBF" />
        <Text style={styles.loadingText}>Loading Fee Summary...</Text>
      </View>
    );
  }

  const overallPct =
    feeData && feeData.classTotalFee > 0
      ? Math.round((feeData.classTotalPaid / feeData.classTotalFee) * 100)
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B4FBF" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Class Fee Summary</Text>
          <Text style={styles.headerSub}>
            {feeData
              ? `Class ${feeData.className}-${feeData.classSection} · ${feeData.academicYear}`
              : `Class ${selectedClass}-${selectedSection} · ${selectedYear}`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.headerBtn, styles.filterBtn]}
          onPress={() => setShowFilter(true)}
        >
          <Ionicons name="filter" size={18} color="#3B4FBF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={item => item.admissionNo}
        renderItem={({ item }) => (
          <StudentCard
            item={item}
            academicYear={feeData?.academicYear ?? selectedYear}
            className={feeData?.className ?? selectedClass}
            classSection={feeData?.classSection ?? selectedSection}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#3B4FBF']} />
        }
        ListHeaderComponent={
          <>
            {/* Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroMeta}>
                <View>
                  <Text style={styles.heroMetaLabel}>Total Students</Text>
                  <Text style={styles.heroMetaValue}>{feeData?.totalStudents ?? 0}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.heroMetaLabel}>Academic Year</Text>
                  <Text style={styles.heroMetaValue}>{feeData?.academicYear ?? '—'}</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <StatBox label="Total Fee" value={feeData?.classTotalFee ?? 0} />
                <View style={styles.statDivider} />
                <StatBox label="Paid" value={feeData?.classTotalPaid ?? 0} />
                <View style={styles.statDivider} />
                <StatBox label="Due" value={feeData?.classTotalDue ?? 0} />
              </View>

              <View style={styles.heroProgressWrap}>
                <View style={styles.heroProgressTrack}>
                  <View style={[styles.heroProgressFill, { width: `${overallPct}%` as any }]} />
                </View>
                <Text style={styles.heroProgressLabel}>{overallPct}% of class fees collected</Text>
              </View>
            </View>

            {/* Extra Class Totals */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Class Overview</Text>
              <View style={styles.infoCard}>
                <InfoRow
                  icon="time-outline"
                  iconColor="#D97706"
                  label="Previous Dues"
                  value={`Rs.${(feeData?.classTotalPreviousDues ?? 0).toLocaleString('en-IN')}`}
                />
                <InfoRow
                  icon="wallet-outline"
                  iconColor="#059669"
                  label="Wallet Balance"
                  value={`Rs.${(feeData?.classTotalWallet ?? 0).toLocaleString('en-IN')}`}
                />
                <InfoRow
                  icon="cash-outline"
                  iconColor="#3B4FBF"
                  label="Net Payable"
                  value={`Rs.${(feeData?.classTotalNetPayable ?? 0).toLocaleString('en-IN')}`}
                />
              </View>
            </View>

            {/* Search */}
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Students</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{filteredStudents.length} shown</Text>
                </View>
              </View>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={16} color="#9CA3AF" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search by name, admission no, roll no..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={{ paddingHorizontal: 16, marginTop: 8 }} />
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {search ? 'No students match your search' : 'No students found for this class'}
            </Text>
          </View>
        }
        ListFooterComponentStyle={{ paddingHorizontal: 16 }}
        columnWrapperStyle={undefined}
        style={{ paddingHorizontal: 16 }}
      />

      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        className={selectedClass}
        section={selectedSection}
        year={selectedYear}
        academicYears={academicYears}
        onApply={handleApplyFilter}
      />
    </SafeAreaView>
  );
};

export default FeeDetailScreen;

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F8' },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 12,
  },
  loadingText: { color: '#6B7280', fontSize: 15 },

  // Header
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
  filterBtn: { backgroundColor: '#fff' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Hero Card
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
  heroMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  heroMetaLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroMetaValue: { fontSize: 15, fontWeight: '600', color: '#fff' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  statBox: { flex: 1, paddingVertical: 14, alignItems: 'center', paddingHorizontal: 4 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statNum: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  statLbl: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroProgressWrap: { marginTop: 16 },
  heroProgressTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 6,
  },
  heroProgressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 99 },
  heroProgressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },

  // Section
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  countBadge: { backgroundColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  countText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#111827', padding: 0 },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 18,
    gap: 10,
    marginHorizontal: 0,
  },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 20 },

  // Info Card
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
  infoLabelRow: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 13, color: '#6B7280' },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#111827' },

  // Status Pill
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  pillText: { fontSize: 11, fontWeight: '700' },

  // Student Card
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  studentHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF0FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#3B4FBF' },
  studentName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  studentMeta: { fontSize: 11, color: '#6B7280', marginTop: 1 },

  amountsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FC',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  amountBox: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  amountDivider: { width: 1, backgroundColor: '#E5E7EB' },
  amountLabel: { fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  amountValue: { fontSize: 13, fontWeight: '700', color: '#111827' },

  progressTrack: {
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 99,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 99 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF0FB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: { fontSize: 10, fontWeight: '600', color: '#3B4FBF' },
  netPayableTag: {
    marginLeft: 'auto',
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  netPayableText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF0FB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewBtnText: { fontSize: 12, fontWeight: '700', color: '#3B4FBF' },
  cardBtnRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  sendDueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sendDueBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Filter Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginTop: 12, marginBottom: 4 },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  modalApplyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#3B4FBF',
    alignItems: 'center',
  },
  modalApplyText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Chips
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#3B4FBF', borderColor: '#3B4FBF' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  chipTextActive: { color: '#fff' },
});

