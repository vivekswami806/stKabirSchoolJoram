// import { API_BASE_URL } from '@/config';
// import { Ionicons } from '@expo/vector-icons';
// import axios from 'axios';
// import * as Print from 'expo-print';
// import { router, useLocalSearchParams } from 'expo-router';
// import * as Sharing from 'expo-sharing';
// import React, { useCallback, useEffect, useMemo, useState } from 'react';
// import {
//   ActivityIndicator,
//   FlatList,
//   RefreshControl,
//   SafeAreaView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { ToastService } from 'react-native-toastier';
// import { getAuthHeaders } from './fees';

// interface Installment {
//   installmentId: number;
//   categoryName: string;
//   monthLabel: string;
//   dueDate: string;
//   dueAmount: number;
//   paidThisTime: number;
//   balanceAfter: number;
//   status: string;
//   wasOverdue: boolean;
//   daysOverdue?: number;
//   fullyPaidThisTime: boolean;
//   fromWalletCredit: boolean;
// }

// interface ReceiptRecord {
//   receiptNo: string;
//   admissionNo: string;
//   studentName: string;
//   className: string;
//   classSection: string;
//   fatherName: string;
//   paymentDate: string;
//   createdAt: string;
//   paymentMethod: string;
//   totalAmount: number;
//   amountInWords: string;
//   installments: Installment[];
//   installmentsTotal: number;
//   additionalFees: any[];
//   additionalFeesTotal: number;
//   previousDuesCleared: any[];
//   previousDuesClearedTotal: number;
//   penaltiesPaid: any[];
//   penaltiesTotal: number;
//   walletCreditUsed: number;
//   walletBalanceAfter: number;
//   createdBy: string;
//   verificationTotal: number;
// }

// interface TenantProfile {
//   schoolName?: string;
//   schoolTagLine?: string;
//   schoolType?: string;
//   contactEmail?: string;
//   contactPhone?: string;
//   addressLine1?: string;
//   addressLine2?: string;
//   city?: string;
//   state?: string;
//   pinCode?: string;
//   logo?: string;
// }

// const ReceiptHistoryScreen = () => {
//   const params = useLocalSearchParams<{
//     admissionNo: string;
//     academicYear?: string;
//     studentName?: string;
//     parentPhone?: string;
//     dueAmount?: string;
//   }>();

//   const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
//   const [schoolDetails, setSchoolDetails] = useState<TenantProfile | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [downloadingNo, setDownloadingNo] = useState<string | null>(null);
//   const [sendingNo, setSendingNo] = useState<string | null>(null);

//   const getSchoolDetails = useCallback(async () => {
//     try {
//       const config = await getAuthHeaders();
//       const { data } = await axios.get(
//         `${API_BASE_URL}auth/getTenantProfile`,
//         config
//       );
//       setSchoolDetails(data);
//     } catch (err) {
//       // silently ignore, header will just be skipped
//     }
//   }, []);

//   const getReceipts = useCallback(async () => {
//     try {
//       const config = await getAuthHeaders();
//       const { data } = await axios.get(
//         `${API_BASE_URL}payments/getReceiptByAdmissionNumberOrByReceiptNumber`,
//         {
//           ...config,
//           params: { admissionNo: params.admissionNo },
//         }
//       );
//       setReceipts(Array.isArray(data) ? data : []);
//     } catch (err: any) {
//       ToastService.show({
//         type: 'danger',
//         message: err?.response?.data?.error || 'Failed to load receipts',
//         duration: 3000,
//       });
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, [params.admissionNo]);

//   useEffect(() => {
//     getSchoolDetails();
//     getReceipts();
//   }, []);

//   const onRefresh = () => {
//     setRefreshing(true);
//     getReceipts();
//   };

//   // Outstanding balance, passed in via route params from the fee summary /
//   // student card screen. Hidden if not provided or zero.
//   const dueAmount = useMemo(() => {
//     const n = Number(params.dueAmount);
//     return Number.isFinite(n) ? n : 0;
//   }, [params.dueAmount]);

//   // ─── Share the ACTUAL PDF (not text) for a specific receipt ──────────────
//   // Note: WhatsApp's public client APIs don't support attaching a file AND
//   // pre-targeting a specific phone number at the same time — that combo only
//   // exists via the paid WhatsApp Business Cloud API from a server. The best
//   // we can do on-device is generate the real PDF and open the native share
//   // sheet; the person picks WhatsApp, then picks the parent's chat, and the
//   // actual file (not a text message) is sent.
//   const handleSendReceiptWhatsApp = async (receipt: ReceiptRecord) => {
//     try {
//       setSendingNo(receipt.receiptNo);
//       const html = generateHtml(receipt, schoolDetails);
//       const { uri } = await Print.printToFileAsync({ html });

//       if (await Sharing.isAvailableAsync()) {
//         await Sharing.shareAsync(uri, {
//           mimeType: 'application/pdf',
//           dialogTitle: `Share Receipt ${receipt.receiptNo} via WhatsApp`,
//           UTI: 'com.adobe.pdf',
//         });
//       } else {
//         ToastService.show({
//           type: 'danger',
//           message: 'Sharing is not available on this device',
//           duration: 3000,
//         });
//       }
//     } catch (err) {
//       console.log('Receipt share error:', err);
//       ToastService.show({
//         type: 'danger',
//         message: 'Failed to prepare receipt for sharing',
//         duration: 3000,
//       });
//     } finally {
//       setSendingNo(null);
//     }
//   };

//   const generateHtml = (receipt: ReceiptRecord, school: TenantProfile | null) => {
//     const rows = receipt.installments
//       .map(
//         item => `
//         <tr>
//           <td>${item.categoryName}</td>
//           <td>${item.monthLabel}</td>
//           <td style="text-align:right;">Rs.${item.dueAmount.toLocaleString('en-IN')}</td>
//           <td style="text-align:right;">Rs.${item.paidThisTime.toLocaleString('en-IN')}</td>
//           <td style="text-align:right;">Rs.${item.balanceAfter.toLocaleString('en-IN')}</td>
//         </tr>`
//       )
//       .join('');

//     const addressParts = [
//       school?.addressLine1,
//       school?.addressLine2,
//       [school?.city, school?.state, school?.pinCode].filter(Boolean).join(', '),
//     ].filter(Boolean);

//     const logoSrc = school?.logo ? `data:image/png;base64,${school.logo}` : null;

//     const schoolHeader = `
//       <div class="school-header">
//         ${logoSrc ? `<img class="logo" src="${logoSrc}" />` : ''}
//         <div class="school-info">
//           <div class="school-name">${school?.schoolName ?? ''}</div>
//           ${school?.schoolTagLine ? `<div class="school-tagline">${school.schoolTagLine}</div>` : ''}
//           ${addressParts.length ? `<div class="school-address">${addressParts.join(' | ')}</div>` : ''}
//           <div class="school-contact">
//             ${school?.contactPhone ? `Ph: ${school.contactPhone}` : ''}
//             ${school?.contactEmail ? `${school?.contactPhone ? ' &nbsp;|&nbsp; ' : ''}Email: ${school.contactEmail}` : ''}
//           </div>
//         </div>
//       </div>
//     `;

//     return `
//       <html>
//         <head>
//           <meta name="viewport" content="width=device-width, initial-scale=1" />
//           <style>
//             body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #111827; }
//             .school-header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #3B4FBF; padding-bottom: 12px; margin-bottom: 16px; }
//             .school-header .logo { width: 56px; height: 56px; object-fit: contain; }
//             .school-info { flex: 1; }
//             .school-name { font-size: 18px; font-weight: 800; color: #3B4FBF; }
//             .school-tagline { font-size: 11px; color: #6B7280; font-style: italic; margin-top: 1px; }
//             .school-address { font-size: 11px; color: #374151; margin-top: 4px; }
//             .school-contact { font-size: 11px; color: #374151; margin-top: 2px; }
//             h1 { color: #3B4FBF; font-size: 22px; margin-bottom: 4px; }
//             .sub { color: #6B7280; font-size: 13px; margin-bottom: 24px; }
//             table { width: 100%; border-collapse: collapse; margin-top: 12px; }
//             th, td { padding: 10px 8px; border-bottom: 1px solid #E5E7EB; font-size: 13px; text-align: left; }
//             th { color: #6B7280; text-transform: uppercase; font-size: 11px; letter-spacing: 0.6px; }
//             .total-row td { font-weight: 700; font-size: 15px; border-top: 2px solid #3B4FBF; border-bottom: none; }
//             .meta { margin-top: 16px; font-size: 13px; color: #374151; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
//             .meta b { color: #111827; }
//             .words { margin-top: 14px; font-size: 12px; color: #374151; font-style: italic; }
//             .footer { margin-top: 40px; font-size: 11px; color: #9CA3AF; text-align: center; }
//           </style>
//         </head>
//         <body>
//           ${schoolHeader}

//           <h1>Fee Payment Receipt</h1>
//           <div class="sub">Receipt No: ${receipt.receiptNo}</div>

//           <div class="meta">
//             <div><b>Student Name:</b> ${receipt.studentName}</div>
//             <div><b>Admission No:</b> ${receipt.admissionNo}</div>
//             <div><b>Class:</b> ${receipt.className}-${receipt.classSection}</div>
//             <div><b>Father's Name:</b> ${receipt.fatherName}</div>
//             <div><b>Payment Date:</b> ${receipt.paymentDate}</div>
//             <div><b>Payment Method:</b> ${receipt.paymentMethod}</div>
//           </div>

//           <table>
//             <thead>
//               <tr>
//                 <th>Fee Category</th>
//                 <th>Period</th>
//                 <th style="text-align:right;">Due Amount</th>
//                 <th style="text-align:right;">Paid Amount</th>
//                 <th style="text-align:right;">Balance</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${rows}
//               <tr class="total-row">
//                 <td colspan="3">Total Paid</td>
//                 <td style="text-align:right;" colspan="2">Rs.${receipt.totalAmount.toLocaleString('en-IN')}</td>
//               </tr>
//             </tbody>
//           </table>

//           <div class="words"><b>Amount in Words:</b> ${receipt.amountInWords}</div>

//           <div class="footer">This is a system-generated receipt and does not require a signature.</div>
//         </body>
//       </html>
//     `;
//   };

//   const handleDownload = async (receipt: ReceiptRecord) => {
//     try {
//       setDownloadingNo(receipt.receiptNo);
//       const html = generateHtml(receipt, schoolDetails);
//       const { uri } = await Print.printToFileAsync({ html });

//       if (await Sharing.isAvailableAsync()) {
//         await Sharing.shareAsync(uri, {
//           mimeType: 'application/pdf',
//           dialogTitle: `Receipt - ${receipt.receiptNo}`,
//           UTI: 'com.adobe.pdf',
//         });
//       }
//     } catch (err) {
//       console.log('Receipt download error:', err);
//       ToastService.show({
//         type: 'danger',
//         message: 'Failed to generate receipt',
//         duration: 3000,
//       });
//     } finally {
//       setDownloadingNo(null);
//     }
//   };

//   const renderItem = ({ item }: { item: ReceiptRecord }) => {
//     const monthLabels = item.installments.map(i => i.monthLabel).join(', ');
//     const isDownloading = downloadingNo === item.receiptNo;
//     const isSending = sendingNo === item.receiptNo;

//     return (
//       <View style={styles.card}>
//         <View style={styles.cardTop}>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.receiptNo}>{item.receiptNo}</Text>
//             <Text style={styles.dateText}>
//               {new Date(item.createdAt).toLocaleDateString('en-IN', {
//                 day: '2-digit',
//                 month: 'short',
//                 year: 'numeric',
//               })}
//             </Text>
//           </View>
//           <Text style={styles.amount}>
//             Rs.{item.totalAmount.toLocaleString('en-IN')}
//           </Text>
//         </View>

//         <View style={styles.divider} />

//         <View style={styles.row}>
//           <Text style={styles.label}>Payment Method</Text>
//           <Text style={styles.value}>{item.paymentMethod}</Text>
//         </View>
//         <View style={styles.row}>
//           <Text style={styles.label}>Fee Period</Text>
//           <Text style={styles.value} numberOfLines={1}>
//             {monthLabels}
//           </Text>
//         </View>

//         <View style={styles.btnRow}>
//           <TouchableOpacity
//             style={[styles.downloadBtn, { flex: 1 }]}
//             onPress={() => handleDownload(item)}
//             disabled={isDownloading}
//           >
//             {isDownloading ? (
//               <ActivityIndicator color="#fff" size="small" />
//             ) : (
//               <>
//                 <Ionicons name="download-outline" size={16} color="#fff" />
//                 <Text style={styles.downloadBtnText}>Download</Text>
//               </>
//             )}
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.whatsappSendBtn, { flex: 1 }]}
//             onPress={() => handleSendReceiptWhatsApp(item)}
//             disabled={isSending}
//           >
//             {isSending ? (
//               <ActivityIndicator color="#fff" size="small" />
//             ) : (
//               <>
//                 <Ionicons name="logo-whatsapp" size={16} color="#fff" />
//                 <Text style={styles.downloadBtnText}>Share PDF</Text>
//               </>
//             )}
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="#3B4FBF" barStyle="light-content" />

//       <View style={styles.header}>
//         <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={22} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Payment History</Text>
//         <View style={styles.headerBtn} />
//       </View>

//       {loading ? (
//         <View style={styles.loaderContainer}>
//           <ActivityIndicator color="#3B4FBF" size="large" />
//         </View>
//       ) : (
//         <FlatList
//           data={receipts}
//           keyExtractor={item => item.receiptNo}
//           renderItem={renderItem}
//           contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B4FBF']} />
//           }
//           ListHeaderComponent={
//             dueAmount > 0 ? (
//               <View style={styles.balanceCard}>
//                 <View style={styles.balanceRow}>
//                   <View>
//                     <Text style={styles.balanceLabel}>Balance Still Due</Text>
//                     <Text style={styles.balanceAmount}>
//                       Rs.{dueAmount.toLocaleString('en-IN')}
//                     </Text>
//                   </View>
//                   <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
//                 </View>
//               </View>
//             ) : null
//           }
//           ListEmptyComponent={
//             <View style={styles.emptyContainer}>
//               <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
//               <Text style={styles.emptyText}>No receipts found.</Text>
//             </View>
//           }
//         />
//       )}
//     </SafeAreaView>
//   );
// };

// export default ReceiptHistoryScreen;

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F0F2F8' },
//   loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   header: {
//     backgroundColor: '#3B4FBF',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingTop: 36,
//     paddingBottom: 20,
//   },
//   headerBtn: {
//     width: 38, height: 38, borderRadius: 19,
//     backgroundColor: 'rgba(255,255,255,0.15)',
//     justifyContent: 'center', alignItems: 'center',
//   },
//   headerTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
//   card: {
//     backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
//   },
//   cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
//   receiptNo: { fontSize: 15, fontWeight: '700', color: '#111827' },
//   dateText: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
//   amount: { fontSize: 16, fontWeight: '700', color: '#059669' },
//   divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
//   row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
//   label: { fontSize: 13, color: '#6B7280' },
//   value: { fontSize: 13, fontWeight: '600', color: '#111827', maxWidth: '60%', textAlign: 'right' },

//   btnRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
//   downloadBtn: {
//     backgroundColor: '#3B4FBF', borderRadius: 12,
//     paddingVertical: 11, flexDirection: 'row',
//     alignItems: 'center', justifyContent: 'center', gap: 6,
//   },
//   downloadBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
//   whatsappSendBtn: {
//     backgroundColor: '#25D366', borderRadius: 12,
//     paddingVertical: 11, flexDirection: 'row',
//     alignItems: 'center', justifyContent: 'center', gap: 6,
//   },

//   emptyContainer: { alignItems: 'center', marginTop: 80 },
//   emptyText: { color: '#9CA3AF', fontSize: 14, marginTop: 12 },

//   // Balance banner
//   balanceCard: {
//     backgroundColor: '#FEF2F2',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: '#FECACA',
//   },
//   balanceRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   balanceLabel: { fontSize: 12, color: '#991B1B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
//   balanceAmount: { fontSize: 20, fontWeight: '800', color: '#991B1B', marginTop: 2 },
// });



import { API_BASE_URL } from '@/config';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ToastService } from 'react-native-toastier';
import { getAuthHeaders } from './fees';

interface Installment {
  installmentId: number;
  categoryName: string;
  monthLabel: string;
  dueDate: string;
  dueAmount: number;
  paidThisTime: number;
  balanceAfter: number;
  status: string;
  wasOverdue: boolean;
  daysOverdue?: number;
  fullyPaidThisTime: boolean;
  fromWalletCredit: boolean;
}

interface ReceiptRecord {
  receiptNo: string;
  admissionNo: string;
  studentName: string;
  className: string;
  classSection: string;
  fatherName: string;
  paymentDate: string;
  createdAt: string;
  paymentMethod: string;
  totalAmount: number;
  amountInWords: string;
  installments: Installment[];
  installmentsTotal: number;
  additionalFees: any[];
  additionalFeesTotal: number;
  previousDuesCleared: any[];
  previousDuesClearedTotal: number;
  penaltiesPaid: any[];
  penaltiesTotal: number;
  walletCreditUsed: number;
  walletBalanceAfter: number;
  createdBy: string;
  verificationTotal: number;
}

interface TenantProfile {
  schoolName?: string;
  schoolTagLine?: string;
  schoolType?: string;
  contactEmail?: string;
  contactPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  logo?: string;
}

const ReceiptHistoryScreen = () => {
  const params = useLocalSearchParams<{
    admissionNo: string;
    academicYear?: string;
    studentName?: string;
    parentPhone?: string;
    dueAmount?: string;
  }>();

  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [schoolDetails, setSchoolDetails] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingNo, setDownloadingNo] = useState<string | null>(null);
  const [sendingNo, setSendingNo] = useState<string | null>(null);

  const getSchoolDetails = useCallback(async () => {
    try {
      const config = await getAuthHeaders();
      const { data } = await axios.get(
        `${API_BASE_URL}auth/getTenantProfile`,
        config
      );
      setSchoolDetails(data);
    } catch (err) {
      // silently ignore, header will just be skipped
    }
  }, []);

  const getReceipts = useCallback(async () => {
    try {
      const config = await getAuthHeaders();
      const { data } = await axios.get(
        `${API_BASE_URL}payments/getReceiptByAdmissionNumberOrByReceiptNumber`,
        {
          ...config,
          params: { admissionNo: params.admissionNo },
        }
      );
      setReceipts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      ToastService.show({
        type: 'danger',
        message: err?.response?.data?.error || 'Failed to load receipts',
        duration: 3000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.admissionNo]);

  useEffect(() => {
    getSchoolDetails();
    getReceipts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    getReceipts();
  };

  // Outstanding balance, passed in via route params from the fee summary /
  // student card screen. Hidden if not provided or zero.
  const dueAmount = useMemo(() => {
    const n = Number(params.dueAmount);
    return Number.isFinite(n) ? n : 0;
  }, [params.dueAmount]);

  // ─── Send a specific receipt (whichever card the parent tapped) via WhatsApp ──

  const handleSendReceiptWhatsApp = async (receipt: ReceiptRecord) => {
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
    const monthLabels = receipt.installments.map(i => i.monthLabel).join(', ');
    const paidDate = new Date(receipt.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const itemLines = receipt.installments
      .map(
        inst =>
          `• ${inst.categoryName} (${inst.monthLabel}): Rs.${inst.paidThisTime.toLocaleString('en-IN')}`
      )
      .join('\n');

    const message =
      `Dear Parent,\n\n` +
      `Here are the details of a fee payment received at ${schoolName} for ` +
      `${receipt.studentName} (Admission No: ${receipt.admissionNo}).\n\n` +
      `Receipt No: ${receipt.receiptNo}\n` +
      `Payment Date: ${paidDate}\n` +
      `Payment Method: ${receipt.paymentMethod}\n` +
      (monthLabels ? `Fee Period: ${monthLabels}\n` : '') +
      (itemLines ? `\n${itemLines}\n` : '') +
      `\nTotal Paid: Rs.${receipt.totalAmount.toLocaleString('en-IN')}\n\n` +
      `Thank you for your payment.`;

    const url = `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`;

    try {
      setSendingNo(receipt.receiptNo);
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
      setSendingNo(null);
    }
  };

  const generateHtml = (receipt: ReceiptRecord, school: TenantProfile | null) => {
    const rows = receipt.installments
      .map(
        item => `
        <tr>
          <td>${item.categoryName}</td>
          <td>${item.monthLabel}</td>
          <td style="text-align:right;">Rs.${item.dueAmount.toLocaleString('en-IN')}</td>
          <td style="text-align:right;">Rs.${item.paidThisTime.toLocaleString('en-IN')}</td>
          <td style="text-align:right;">Rs.${item.balanceAfter.toLocaleString('en-IN')}</td>
        </tr>`
      )
      .join('');

    const addressParts = [
      school?.addressLine1,
      school?.addressLine2,
      [school?.city, school?.state, school?.pinCode].filter(Boolean).join(', '),
    ].filter(Boolean);

    const logoSrc = school?.logo ? `data:image/png;base64,${school.logo}` : null;

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
            .meta { margin-top: 16px; font-size: 13px; color: #374151; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
            .meta b { color: #111827; }
            .words { margin-top: 14px; font-size: 12px; color: #374151; font-style: italic; }
            .footer { margin-top: 40px; font-size: 11px; color: #9CA3AF; text-align: center; }
          </style>
        </head>
        <body>
          ${schoolHeader}

          <h1>Fee Payment Receipt</h1>
          <div class="sub">Receipt No: ${receipt.receiptNo}</div>

          <div class="meta">
            <div><b>Student Name:</b> ${receipt.studentName}</div>
            <div><b>Admission No:</b> ${receipt.admissionNo}</div>
            <div><b>Class:</b> ${receipt.className}-${receipt.classSection}</div>
            <div><b>Father's Name:</b> ${receipt.fatherName}</div>
            <div><b>Payment Date:</b> ${receipt.paymentDate}</div>
            <div><b>Payment Method:</b> ${receipt.paymentMethod}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Fee Category</th>
                <th>Period</th>
                <th style="text-align:right;">Due Amount</th>
                <th style="text-align:right;">Paid Amount</th>
                <th style="text-align:right;">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr class="total-row">
                <td colspan="3">Total Paid</td>
                <td style="text-align:right;" colspan="2">Rs.${receipt.totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div class="words"><b>Amount in Words:</b> ${receipt.amountInWords}</div>

          <div class="footer">This is a system-generated receipt and does not require a signature.</div>
        </body>
      </html>
    `;
  };

  const handleDownload = async (receipt: ReceiptRecord) => {
    try {
      setDownloadingNo(receipt.receiptNo);
      const html = generateHtml(receipt, schoolDetails);
      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Receipt - ${receipt.receiptNo}`,
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (err) {
      ToastService.show({
        type: 'danger',
        message: 'Failed to generate receipt',
        duration: 3000,
      });
    } finally {
      setDownloadingNo(null);
    }
  };

  const renderItem = ({ item }: { item: ReceiptRecord }) => {
    const monthLabels = item.installments.map(i => i.monthLabel).join(', ');
    const isDownloading = downloadingNo === item.receiptNo;
    const isSending = sendingNo === item.receiptNo;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.receiptNo}>{item.receiptNo}</Text>
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          <Text style={styles.amount}>
            Rs.{item.totalAmount.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Payment Method</Text>
          <Text style={styles.value}>{item.paymentMethod}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Fee Period</Text>
          <Text style={styles.value} numberOfLines={1}>
            {monthLabels}
          </Text>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.downloadBtn, { flex: 1 }]}
            onPress={() => handleDownload(item)}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={16} color="#fff" />
                <Text style={styles.downloadBtnText}>Share</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.whatsappSendBtn, { flex: 1 }]}
            onPress={() => handleSendReceiptWhatsApp(item)}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                <Text style={styles.downloadBtnText}>Send</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B4FBF" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#3B4FBF" size="large" />
        </View>
      ) : (
        <FlatList
          data={receipts}
          keyExtractor={item => item.receiptNo}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B4FBF']} />
          }
          ListHeaderComponent={
            dueAmount > 0 ? (
              <View style={styles.balanceCard}>
                <View style={styles.balanceRow}>
                  <View>
                    <Text style={styles.balanceLabel}>Balance Still Due</Text>
                    <Text style={styles.balanceAmount}>
                      Rs.{dueAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No receipts found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ReceiptHistoryScreen;

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
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  receiptNo: { fontSize: 15, fontWeight: '700', color: '#111827' },
  dateText: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '700', color: '#059669' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  label: { fontSize: 13, color: '#6B7280' },
  value: { fontSize: 13, fontWeight: '600', color: '#111827', maxWidth: '60%', textAlign: 'right' },

  btnRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  downloadBtn: {
    backgroundColor: '#3B4FBF', borderRadius: 12,
    paddingVertical: 11, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  downloadBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  whatsappSendBtn: {
    backgroundColor: '#25D366', borderRadius: 12,
    paddingVertical: 11, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#9CA3AF', fontSize: 14, marginTop: 12 },

  // Balance banner
  balanceCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: { fontSize: 12, color: '#991B1B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmount: { fontSize: 20, fontWeight: '800', color: '#991B1B', marginTop: 2 },
});