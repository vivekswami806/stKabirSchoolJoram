import { API_BASE_URL } from '@/config';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ToastService } from 'react-native-toastier';
import { getAuthHeaders } from './fees';

// ─── Types ──────────────────────────────────────────────────────────────

interface StudentFee {
  number: any;
  admissionNo: string;
  studentName: string;
  rollNumber?: string;
  fatherName?: string;
  parentPhone?: string;
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  previousDue: number;
  pendingPenalties: number;
  hasTransport?: boolean;
  transportRoute?: string;
  transportDue?: number;
  walletBalance: number;
  netPayable: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
}

interface TenantProfile {
  schoolName?: string;
  contactPhone?: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  PAID: { bg: '#D1FAE5', text: '#065F46', label: 'Paid' },
  PARTIAL: { bg: '#FEF3C7', text: '#92400E', label: 'Partial' },
  PENDING: { bg: '#FEE2E2', text: '#991B1B', label: 'Pending' },
};

// ─── Row helper ─────────────────────────────────────────────────────────

const DueRow = ({
  label,
  value,
  valueColor,
  bold,
}: {
  label: string;
  value: number;
  valueColor?: string;
  bold?: boolean;
}) => (
  <View style={styles.dueRow}>
    <Text style={styles.dueLabel}>{label}</Text>
    <Text
      style={[
        styles.dueValue,
        bold && styles.dueValueBold,
        valueColor ? { color: valueColor } : null,
      ]}
    >
      Rs.{value.toLocaleString('en-IN')}
    </Text>
  </View>
);

// ─── Main Screen ────────────────────────────────────────────────────────

const DueAmountScreen = () => {
  const params = useLocalSearchParams<{
    student?: string; // JSON.stringify(StudentFee)
    className?: string;
    classSection?: string;
    academicYear?: string;
  }>();

  const [schoolDetails, setSchoolDetails] = useState<TenantProfile | null>(null);
  const [sending, setSending] = useState(false);

  const student: StudentFee | null = useMemo(() => {
    try {
      return params.student ? JSON.parse(params.student) : null;
    } catch {
      return null;
    }
  }, [params.student]);

  const getSchoolDetails = useCallback(async () => {
    try {
      const config = await getAuthHeaders();
      const { data } = await axios.get(`${API_BASE_URL}auth/getTenantProfile`, config);
      setSchoolDetails(data);
    } catch (err) {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    getSchoolDetails();
  }, [getSchoolDetails]);

  const handleSendWhatsApp = async () => {
    if (!student) return;

    const rawPhone = student.number;
    
    if (!rawPhone) {
      ToastService.show({
        type: 'warning',
        message: 'No parent phone number available for this student',
        duration: 3000,
      });
      return;
    }

    const digits = String(student.number).replace(/[^0-9]/g, "");
    const phoneWithCountryCode = digits.length === 10 ? `91${digits}` : digits;

    const schoolName = schoolDetails?.schoolName ?? 'the school';
    const classLine =
      params.className && params.classSection
        ? `Class: ${params.className}-${params.classSection}\n`
        : '';
    const yearLine = params.academicYear ? `Academic Year: ${params.academicYear}\n` : '';

    const message =
      `Dear Parent,\n\n` +
      `This is a fee due reminder from ${schoolName} for ${student.studentName} ` +
      `(Admission No: ${student.admissionNo}).\n\n` +
      classLine +
      yearLine +
      `Total Fee: Rs.${student.totalFee.toLocaleString('en-IN')}\n` +
      `Paid: Rs.${student.paidAmount.toLocaleString('en-IN')}\n` +
      (student.previousDue > 0
        ? `Previous Dues: Rs.${student.previousDue.toLocaleString('en-IN')}\n`
        : '') +
      (student.pendingPenalties > 0
        ? `Pending Penalties: Rs.${student.pendingPenalties.toLocaleString('en-IN')}\n`
        : '') +
      (student.hasTransport && (student.transportDue ?? 0) > 0
        ? `Transport Due: Rs.${(student.transportDue ?? 0).toLocaleString('en-IN')}\n`
        : '') +
      `\nOutstanding Balance (Net Payable): Rs.${student.netPayable.toLocaleString('en-IN')}\n\n` +
      `Kindly clear the dues at your earliest convenience. Thank you.`;

    const url = `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`;

    try {
      setSending(true);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        ToastService.show({
          type: 'danger',
          message: 'WhatsApp is not installed on this device',
          duration: 3000,
        });
      }
    } catch (err) {
      console.log('WhatsApp redirect error:', err);
      ToastService.show({
        type: 'danger',
        message: 'Could not open WhatsApp',
        duration: 3000,
      });
    } finally {
      setSending(false);
    }
  };

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#3B4FBF" barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fee Due</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.loaderContainer}>
          <Text style={{ color: '#6B7280' }}>Student fee data not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cfg = STATUS_CONFIG[student.paymentStatus] ?? STATUS_CONFIG.PENDING;
  const hasPhone = !!student.number;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B4FBF" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fee Due Details</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Student Info Card */}
        <View style={styles.studentCard}>
          <View style={styles.studentTop}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>
                {student.studentName?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>{student.studentName}</Text>
              <Text style={styles.studentMeta}>
                Adm No: {student.admissionNo}
                {student.rollNumber ? `  •  Roll: ${student.rollNumber}` : ''}
              </Text>
              {!!student.fatherName && (
                <Text style={styles.studentMeta}>Father: {student.fatherName}</Text>
              )}
              {(params.className || params.classSection) && (
                <Text style={styles.studentMeta}>
                  Class: {params.className}-{params.classSection}
                  {params.academicYear ? `  •  ${params.academicYear}` : ''}
                </Text>
              )}
            </View>
            <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.pillText, { color: cfg.text }]}>{cfg.label}</Text>
            </View>
          </View>
        </View>

        {/* Outstanding Balance Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Outstanding Balance</Text>
          <Text style={styles.heroAmount}>
            Rs.{student.netPayable.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.heroSub}>Net payable (includes dues, penalties & transport)</Text>
        </View>

        {/* Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Fee Breakdown</Text>
          <DueRow label="Total Fee" value={student.totalFee} />
          <DueRow label="Amount Paid" value={student.paidAmount} valueColor="#059669" />
          <DueRow label="Balance Due" value={student.dueAmount} valueColor="#DC2626" />
          {student.previousDue > 0 && (
            <DueRow label="Previous Dues" value={student.previousDue} valueColor="#D97706" />
          )}
          {student.pendingPenalties > 0 && (
            <DueRow label="Pending Penalties" value={student.pendingPenalties} valueColor="#DC2626" />
          )}
          {student.hasTransport && (student.transportDue ?? 0) > 0 && (
            <DueRow
              label={`Transport Due${student.transportRoute ? ` (${student.transportRoute})` : ''}`}
              value={student.transportDue ?? 0}
              valueColor="#D97706"
            />
          )}
          {student.walletBalance > 0 && (
            <DueRow label="Wallet Balance" value={student.walletBalance} valueColor="#059669" />
          )}
          <View style={styles.breakdownDivider} />
          <DueRow label="Net Payable" value={student.netPayable} bold />
        </View>

        {/* WhatsApp Send */}
        <TouchableOpacity
          style={[styles.whatsappBtn, !hasPhone && styles.whatsappBtnDisabled]}
          onPress={handleSendWhatsApp}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.whatsappBtnText}>Send </Text>
            </>
          )}
        </TouchableOpacity>

        {!hasPhone && (
          <Text style={styles.noPhoneHint}>
            No parent phone number on file for this student — add one to enable WhatsApp reminders.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DueAmountScreen;

// ─── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F8' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#3B4FBF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 20,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },

  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  studentTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#EEF0FB', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#3B4FBF' },
  studentName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  studentMeta: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  pillText: { fontSize: 11, fontWeight: '700' },

  heroCard: {
    backgroundColor: '#3B4FBF',
    borderRadius: 20,
    padding: 22,
    marginTop: 14,
    alignItems: 'center',
    shadowColor: '#3B4FBF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
  },
  heroAmount: { fontSize: 30, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 6, textAlign: 'center' },

  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  breakdownTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  dueRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  dueLabel: { fontSize: 13, color: '#6B7280' },
  dueValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  dueValueBold: { fontSize: 15, fontWeight: '800' },
  breakdownDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },

  whatsappBtn: {
    marginTop: 20,
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  whatsappBtnDisabled: { opacity: 0.5 },
  whatsappBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  noPhoneHint: {
    fontSize: 11, color: '#9CA3AF', textAlign: 'center',
    marginTop: 10, paddingHorizontal: 20,
  },
});