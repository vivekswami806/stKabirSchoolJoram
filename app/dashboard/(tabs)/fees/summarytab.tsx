import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Summary } from "./constant/dummyData";

interface SummaryTabProps {
  summary: Summary | null;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ summary }) => {
  if (!summary) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="analytics-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyStateText}>No summary available</Text>
      </View>
    );
  }

  const progressPercentage =
    summary.totalFees === 0
      ? 0
      : (summary.totalPaid / summary.totalFees) * 100;

  return (
    <View>
      {/* Summary Cards */}
      <View style={styles.summaryCards}>
        <View style={[styles.summaryCard, styles.totalCard]}>
          <Ionicons name="wallet-outline" size={24} color="#4F63D2" />
          <Text style={styles.summaryCardLabel}>Total Fees</Text>
          <Text style={styles.summaryCardAmount}>₹ {summary.totalFees}</Text>
        </View>

        <View style={[styles.summaryCard, styles.paidCard]}>
          <Ionicons
            name="checkmark-circle-outline"
            size={24}
            color="#10B981"
          />
          <Text style={styles.summaryCardLabel}>Total Paid</Text>
          <Text style={styles.summaryCardAmount}>₹ {summary.totalPaid}</Text>
        </View>

        <View style={[styles.summaryCard, styles.dueCard]}>
          <Ionicons name="time-outline" size={24} color="#EF4444" />
          <Text style={styles.summaryCardLabel}>Total Due</Text>
          <Text style={styles.summaryCardAmount}>₹ {summary.totalDue}</Text>
        </View>
      </View>

      {/* Monthly Breakdown */}
      <Text style={styles.sectionTitle}>Monthly Breakdown</Text>

      {summary.monthlyBreakdown.map((month, idx) => (
        <View key={idx} style={styles.summaryRow}>
          <View style={styles.summaryRowLeft}>
            <Text style={styles.summaryMonth}>{month.month}</Text>

            <View
              style={[
                styles.summaryStatusBadge,
                month.status === "Paid"
                  ? styles.summaryPaidBadge
                  : styles.summaryDueBadge,
              ]}
            >
              <Text
                style={[
                  styles.summaryStatusText,
                  month.status === "Paid"
                    ? styles.summaryPaidText
                    : styles.summaryDueText,
                ]}
              >
                {month.status}
              </Text>
            </View>
          </View>

          <Text style={styles.summaryAmount}>₹ {month.amount}</Text>
        </View>
      ))}

      {/* Payment Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Payment Progress</Text>
          <Text style={styles.progressPercentage}>
            {progressPercentage.toFixed(0)}%
          </Text>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercentage}%` },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          ₹ {summary.totalPaid} of ₹ {summary.totalFees} completed
        </Text>
      </View>
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
  summaryCards: {
    marginBottom: 20,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  totalCard: {
    backgroundColor: '#EFF6FF',
  },
  paidCard: {
    backgroundColor: '#D1FAE5',
  },
  dueCard: {
    backgroundColor: '#FEE2E2',
  },
  summaryCardLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryCardAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  summaryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryMonth: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginRight: 12,
  },
  summaryStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  summaryPaidBadge: {
    backgroundColor: '#D1FAE5',
  },
  summaryDueBadge: {
    backgroundColor: '#FEF3C7',
  },
  summaryStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryPaidText: {
    color: '#065F46',
  },
  summaryDueText: {
    color: '#92400E',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default SummaryTab;