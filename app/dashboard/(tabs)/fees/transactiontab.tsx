import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Transaction } from './constant/dummyData';


interface TransactionsTabProps {
    transactions: Transaction[];
    onDownloadReceipt: (transactionId: string) => void;
  }
const TransactionsTab: React.FC<TransactionsTabProps>  = ({ transactions, onDownloadReceipt }) => {
  return (
    <View>
      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No transactions</Text>
        </View>
      ) : (
        transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionCard}>
            <View style={styles.transactionHeader}>
              <View style={styles.transactionIcon}>
                <Ionicons 
                  name={transaction.status === 'Success' ? 'checkmark-circle' : 'close-circle'} 
                  size={24} 
                  color={transaction.status === 'Success' ? '#10B981' : '#EF4444'} 
                />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionMonth}>{transaction.feeMonth} Fee</Text>
                <Text style={styles.transactionDate}>
                  {transaction.date} at {transaction.time}
                </Text>
              </View>
              <Text style={styles.transactionAmount}>₹ {transaction.amount}</Text>
            </View>

            <View style={styles.transactionDetails}>
              <View style={styles.transactionDetailRow}>
                <Text style={styles.transactionDetailLabel}>Transaction ID</Text>
                <Text style={styles.transactionDetailValue}>{transaction.id}</Text>
              </View>
              <View style={styles.transactionDetailRow}>
                <Text style={styles.transactionDetailLabel}>Payment Method</Text>
                <Text style={styles.transactionDetailValue}>{transaction.method}</Text>
              </View>
              <View style={styles.transactionDetailRow}>
                <Text style={styles.transactionDetailLabel}>Status</Text>
                <View style={[
                  styles.statusBadge,
                  transaction.status === 'Success' ? styles.successBadge : styles.failedBadge
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    transaction.status === 'Success' ? styles.successText : styles.failedText
                  ]}>
                    {transaction.status}
                  </Text>
                </View>
              </View>
            </View>

            {transaction.status === 'Success' && (
              <TouchableOpacity 
                style={styles.downloadButton}
                onPress={() => onDownloadReceipt(transaction.id)}
              >
                <Ionicons name="download-outline" size={16} color="#4F63D2" />
                <Text style={styles.downloadButtonText}>Download Receipt</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
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
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  transactionDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  transactionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  transactionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  transactionDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  successBadge: {
    backgroundColor: '#D1FAE5',
  },
  failedBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  successText: {
    color: '#065F46',
  },
  failedText: {
    color: '#991B1B',
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
});

export default TransactionsTab;
