import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PaidFee } from './constant/dummyData';


interface PaidTabProps {
    fees: PaidFee[];
    onDownloadReceipt: (transactionId: string) => void;
  }
const PaidTab: React.FC<PaidTabProps>  = ({ fees, onDownloadReceipt }) => {
  const totalPaid = fees.reduce((sum, fee) => sum + fee.amount, 0);

  return (
    <View>
      {fees.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No payments yet</Text>
        </View>
      ) : (
        <>
          {fees.map((fee) => (
            <View key={fee.id} style={styles.feeCard}>
              <View style={styles.paidIndicator} />
              <View style={styles.feeCardContent}>
                <View style={styles.feeRow}>
                  <View style={[styles.checkbox, styles.checkboxChecked]}>
                    <Ionicons name="checkmark" size={18} color="#10B981" />
                  </View>

                  <View style={styles.feeInfo}>
                    <View style={styles.feeHeader}>
                      <Text style={styles.feeMonth}>{fee.month}</Text>
                      <Text style={styles.feeAmount}>₹ {fee.amount}</Text>
                    </View>
                    <Text style={styles.paidDate}>Paid on {fee.paidDate}</Text>
                    <Text style={styles.transactionId}>TXN: {fee.transactionId}</Text>
                  </View>

                  <View style={styles.paymentBadge}>
                    <Text style={styles.paymentBadgeText}>{fee.paymentMethod}</Text>
                  </View>
                </View>

                {fee.breakdown && fee.breakdown.length > 0 && (
                  <View style={styles.breakdown}>
                    {fee.breakdown.map((item, idx) => (
                      <View key={idx} style={styles.breakdownRow}>
                        <Text style={styles.breakdownItem}>{item.item}</Text>
                        <Text style={styles.breakdownItemAmount}>₹ {item.amount}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.downloadButton}
                  onPress={() => onDownloadReceipt(fee.transactionId)}
                >
                  <Ionicons name="download-outline" size={16} color="#4F63D2" />
                  <Text style={styles.downloadButtonText}>Download Receipt</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalAmount}>₹ {totalPaid}</Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  feeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paidIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#10B981',
  },
  feeCardContent: {
    padding: 16,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  feeInfo: {
    flex: 1,
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeMonth: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  paidDate: {
    fontSize: 13,
    color: '#10B981',
    marginTop: 4,
  },
  transactionId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  paymentBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  paymentBadgeText: {
    fontSize: 11,
    color: '#4F63D2',
    fontWeight: '500',
  },
  breakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownItem: {
    fontSize: 14,
    color: '#6B7280',
  },
  breakdownItemAmount: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  downloadButtonText: {
    fontSize: 14,
    color: '#4F63D2',
    fontWeight: '500',
    marginLeft: 6,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
});

export default PaidTab;

