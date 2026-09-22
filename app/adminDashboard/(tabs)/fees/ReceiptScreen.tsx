import { API_BASE_URL } from '@/config';
import { MonthlyReceipt } from '@/utils/feeReceipts';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
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

interface TenantProfile {
  subdomain?: string;
  schemaName?: string;
  schoolName?: string;
  schoolCode?: string;
  schoolTagLine?: string;
  schoolType?: string;
  contactEmail?: string;
  contactPhone?: string;
  maxStudents?: number;
  maxStaff?: number;
  masterTenantId?: number;
  directorName?: string;
  principalName?: string;
  vicePrincipalName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  logo?: string;
}

const ReceiptScreen = () => {
  const params = useLocalSearchParams<{
    receipt: string;
    admissionNo: string;
    academicYear: string;
    studentName?: string;
    parentPhone?: string;
    balanceDue?: string;
  }>();

  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [schoolDetails, setSchoolDetails] = useState<TenantProfile | null>(null);

  const getSchoolDetails = useCallback(async () => {
    try {
      setLoading(true);
      const config = await getAuthHeaders();
      const { data } = await axios.get(
        `${API_BASE_URL}auth/getTenantProfile`,
        config
      );
      setSchoolDetails(data);
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

  useEffect(()=>{
    getSchoolDetails();
  },[])

  const receipt: MonthlyReceipt | null = useMemo(() => {
    try {
      return params.receipt ? JSON.parse(params.receipt) : null;
    } catch {
      return null;
    }
  }, [params.receipt]);

  // Outstanding balance passed in via route params (e.g. from the fee summary /
  // student card). Falls back to 0 if not provided, in which case the WhatsApp
  // reminder button is hidden.
  const balanceDue = useMemo(() => {
    const n = Number(params.balanceDue);
    return Number.isFinite(n) ? n : 0;
  }, [params.balanceDue]);

  const generateHtml = (data: MonthlyReceipt, school: TenantProfile | null) => {
    const rows = data.items
      .map(
        item => `
        <tr>
          <td>${item.categoryName}</td>
          <td>${item.monthLabel}</td>
          <td style="text-align:right;">Rs.${item.paidAmount.toLocaleString('en-IN')}</td>
        </tr>`
      )
      .join('');

    const addressParts = [
      school?.addressLine1,
      school?.addressLine2,
      [school?.city, school?.state, school?.pinCode].filter(Boolean).join(', '),
    ].filter(Boolean);

    const logoSrc = school?.logo
      ? `data:image/png;base64,${school.logo}`
      : null;

    const schoolHeader = `
      <div class="school-header">
        ${logoSrc ? `<img class="logo" src="${logoSrc}" />` : ''}
        <div class="school-info">
          <div class="school-name">${school?.schoolName ?? ''}</div>
          ${school?.schoolTagLine ? `<div class="school-tagline">${school.schoolTagLine}</div>` : ''}
          ${addressParts.length ? `<div class="school-address">${addressParts.join(' | ')}</div>` : ''}
          <div class="school-contact">
            ${school?.contactPhone ? `Ph: ${school.contactPhone}` : ''}
            ${school?.contactEmail ? `${school?.contactPhone ? ' &nbsp;|&nbsp; ' : ''}Email: ${school.contactEmail}` : ''}
          </div>
        </div>
      </div>
    `;

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #111827; }
            .school-header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #3B4FBF; padding-bottom: 12px; margin-bottom: 16px; }
            .school-header .logo { width: 56px; height: 56px; object-fit: contain; }
            .school-info { flex: 1; }
            .school-name { font-size: 18px; font-weight: 800; color: #3B4FBF; }
            .school-tagline { font-size: 11px; color: #6B7280; font-style: italic; margin-top: 1px; }
            .school-address { font-size: 11px; color: #374151; margin-top: 4px; }
            .school-contact { font-size: 11px; color: #374151; margin-top: 2px; }
            h1 { color: #3B4FBF; font-size: 22px; margin-bottom: 4px; }
            .sub { color: #6B7280; font-size: 13px; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { padding: 10px 8px; border-bottom: 1px solid #E5E7EB; font-size: 13px; text-align: left; }
            th { color: #6B7280; text-transform: uppercase; font-size: 11px; letter-spacing: 0.6px; }
            .total-row td { font-weight: 700; font-size: 15px; border-top: 2px solid #3B4FBF; border-bottom: none; }
            .meta { margin-top: 16px; font-size: 13px; color: #374151; }
            .meta b { color: #111827; }
            .footer { margin-top: 40px; font-size: 11px; color: #9CA3AF; text-align: center; }
          </style>
        </head>
        <body>
          ${schoolHeader}

          <h1>Fee Payment Receipt</h1>
          <div class="sub">${data.monthDisplay}</div>

          <div class="meta">
            <div><b>Admission No:</b> ${params.admissionNo ?? '-'}</div>
            <div><b>Academic Year:</b> ${params.academicYear ?? '-'}</div>
            <div><b>Receipt Period:</b> ${data.monthDisplay}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Fee Category</th>
                <th>Period</th>
                <th style="text-align:right;">Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr class="total-row">
                <td colspan="2">Total Paid</td>
                <td style="text-align:right;">Rs.${data.totalPaid.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">This is a system-generated receipt and does not require a signature.</div>
        </body>
      </html>
    `;
  };

  const handleDownload = async () => {
    if (!receipt) return;
    try {
      setDownloading(true);
      const html = generateHtml(receipt, schoolDetails);
      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Receipt - ${receipt.monthDisplay}`,
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (err) {
      console.log('Receipt download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsAppReminder = async () => {
    const rawPhone = params.parentPhone;
    if (!rawPhone) {
      ToastService.show({
        type: 'warning',
        message: 'No parent phone number available for this student',
        duration: 3000,
      });
      return;
    }

    const digits = rawPhone.replace(/[^0-9]/g, '');
    const phoneWithCountryCode = digits.length === 10 ? `91${digits}` : digits;

    const schoolName = schoolDetails?.schoolName ?? 'the school';
    const studentName = params.studentName ?? 'your ward';

    const message =
      `Dear Parent,\n\n` +
      `This is a reminder from ${schoolName} regarding the pending fee balance ` +
      `for ${studentName} (Admission No: ${params.admissionNo ?? '-'}).\n\n` +
      `Outstanding Balance: Rs.${balanceDue.toLocaleString('en-IN')}\n\n` +
      `Kindly clear the dues at your earliest convenience. Thank you.`;

    const url = `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`;

    try {
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
    }
  };

  if (!receipt) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={{ color: '#6B7280' }}>Receipt data not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B4FBF" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="checkmark-circle" size={40} color="#059669" />
            <Text style={styles.title}>Payment Complete</Text>
            <Text style={styles.subTitle}>{receipt.monthDisplay}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Admission No</Text>
            <Text style={styles.metaValue}>{params.admissionNo}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Academic Year</Text>
            <Text style={styles.metaValue}>{params.academicYear}</Text>
          </View>

          <View style={styles.divider} />

          {receipt.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View>
                <Text style={styles.itemName}>{item.categoryName}</Text>
                <Text style={styles.itemSub}>{item.monthLabel}</Text>
              </View>
              <Text style={styles.itemAmount}>
                Rs.{item.paidAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.itemRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalAmount}>
              Rs.{receipt.totalPaid.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Outstanding balance banner + WhatsApp reminder */}
        {balanceDue > 0 && (
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <View>
                <Text style={styles.balanceLabel}>Balance Still Due</Text>
                <Text style={styles.balanceAmount}>
                  Rs.{balanceDue.toLocaleString('en-IN')}
                </Text>
              </View>
              <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
            </View>

            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={handleWhatsAppReminder}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={styles.whatsappBtnText}>Send Balance Reminder on WhatsApp</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.downloadBtnText}>Download Receipt</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReceiptScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F8' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
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
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardHead: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 8 },
  subTitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  metaLabel: { fontSize: 13, color: '#6B7280' },
  metaValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  itemAmount: { fontSize: 14, fontWeight: '700', color: '#111827' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  totalAmount: { fontSize: 16, fontWeight: '700', color: '#059669' },

  // Balance / WhatsApp
  balanceCard: {
    marginTop: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  balanceLabel: { fontSize: 12, color: '#991B1B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmount: { fontSize: 20, fontWeight: '800', color: '#991B1B', marginTop: 2 },
  whatsappBtn: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  whatsappBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  downloadBtn: {
    marginTop: 20, backgroundColor: '#3B4FBF', borderRadius: 14,
    paddingVertical: 15, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#3B4FBF', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  downloadBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});