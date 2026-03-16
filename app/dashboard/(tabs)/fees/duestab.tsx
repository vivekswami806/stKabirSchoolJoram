import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DueFee } from './constant/dummyData';

interface DuesTabProps {
    fees: DueFee[];
    selectedFees: Set<number>;
    onToggleSelection: (id: number) => void;
    onPayNow: (feeId?: any) => void;
  }
const DuesTab: React.FC<DuesTabProps> = ({ fees, selectedFees, onToggleSelection, onPayNow }) => {
  const totalDues = fees.reduce((sum, fee) => sum + fee.amount, 0);

  return (
    <View>
      <View style={styles.noteContainer}>
        <View style={styles.noteBorder} />
        <View style={styles.noteContent}>
          <Text style={styles.noteText}>
            <Text style={styles.noteBold}>Note:</Text> If amount is not paid on or before due date, then as per norms late fee amount will be applicable.
          </Text>
        </View>
      </View>

      {fees.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
          <Text style={styles.emptyStateText}>No dues pending</Text>
        </View>
      ) : (
        fees.map((fee) => (
          <View key={fee.id} style={styles.feeCard}>
            <View style={styles.feeCardContent}>
              <View style={styles.feeRow}>
                <TouchableOpacity
                  onPress={() => onToggleSelection(fee.id)}
                  style={[
                    styles.checkbox,
                    selectedFees.has(fee.id) && styles.checkboxChecked
                  ]}
                >
                  {selectedFees.has(fee.id) && (
                    <Ionicons name="checkmark" size={18} color="#4F63D2" />
                  )}
                </TouchableOpacity>

                <View style={styles.feeInfo}>
                  <View style={styles.feeHeader}>
                    <Text style={styles.feeMonth}>{fee.month}</Text>
                    <Text style={styles.feeAmount}>₹ {fee.amount}</Text>
                  </View>
                  {fee.dueDate && (
                    <Text style={styles.dueDate}>Due: {fee.dueDate}</Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => onPayNow(fee.id)}
                  style={styles.payNowButton}
                >
                  <Text style={styles.payNowText}>Pay Now</Text>
                </TouchableOpacity>
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
            </View>
          </View>
        ))
      )}

      {fees.length > 0 && (
        <>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Dues</Text>
            <Text style={styles.totalAmount}>₹ {totalDues}</Text>
          </View>

          <TouchableOpacity 
            style={[
              styles.primaryButton,
              selectedFees.size === 0 && styles.primaryButtonDisabled
            ]} 
            onPress={() => onPayNow()}
            disabled={selectedFees.size === 0}
          >
            <Text style={styles.primaryButtonText}>
              Pay Selected ({selectedFees.size})
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  noteBorder: {
    width: 4,
    backgroundColor: '#FB923C',
  },
  noteContent: {
    flex: 1,
    padding: 12,
  },
  noteText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  noteBold: {
    fontWeight: '600',
  },
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
    borderColor: '#4F63D2',
    backgroundColor: '#EFF6FF',
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
  dueDate: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  payNowButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    marginLeft: 8,
  },
  payNowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F63D2',
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
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
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
  primaryButton: {
    backgroundColor: '#4F63D2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DuesTab;
