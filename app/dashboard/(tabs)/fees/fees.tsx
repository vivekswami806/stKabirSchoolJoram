import LeaveSkeleton from '@/app/adminDashboard/(tabs)/leave/LeaveSkeleton';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { ToastService } from 'react-native-toastier';
import { downloadReceipt, fetchAllFees, payFees } from './feeservices';

const FeeDetailScreen = () => {
  const [activeTab, setActiveTab] = useState('Dues');
  const [duesFees, setDuesFees] = useState([]);
  const [paidFees, setPaidFees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFees, setSelectedFees] = useState<any>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllFees("ADM-2026-336400", "2025-2026");
      setDuesFees(data.dues || []);
      setPaidFees(data.paid || []);
      setTransactions(data.transactions || []);
      setSummary(data.summary || null);
    } catch (error) {
      ToastService.show({
        type: "danger",
        message: 'Failed to fetch fee data. Please try again.',
        duration: 1300,
        contentContainerStyle: { flex: 1 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (feeId = null) => {
    const feesToPay = feeId ? [feeId] : Array.from(selectedFees);
    
    if (feesToPay.length === 0) {
      Alert.alert('No Selection', 'Please select at least one fee to pay.');
      return;
    }

    try {
      const result = await payFees(feesToPay);
      Alert.alert(
        'Success', 
        result.message || 'Payment processed successfully',
        [{ text: 'OK', onPress: () => fetchData() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Payment failed. Please try again.');
    }
  };

  const toggleFeeSelection = (id: unknown) => {
    const newSelected = new Set(selectedFees);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFees(newSelected);
  };

  const handleDownloadReceipt = async (transactionId: unknown) => {
    try {
      const result = await downloadReceipt(transactionId);
      Alert.alert('Success', 'Receipt downloaded successfully');
      // In production, handle actual file download
    } catch (error) {
      Alert.alert('Error', 'Failed to download receipt. Please try again.');
    }
  };

  if (loading) {
    return (<LeaveSkeleton isDark={false}/>);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F63D2" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={()=>router.replace("/(tabs)/home")}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Fee Detail</Text>
        
        <View style={styles.profileIcon}>
          <Ionicons name="person" size={20} color="#4F63D2" />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['Dues', 'Paid', 'Transactions', 'Summary'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={{textAlign:"center", paddingTop: "50%"}}>Fee Details will be announced soon...</Text>
        {/* {activeTab === 'Dues' && (
          <DuesTab
            fees={duesFees}
            selectedFees={selectedFees}
            onToggleSelection={toggleFeeSelection}
            onPayNow={handlePayNow}
          />
        )}
        {activeTab === 'Paid' && (
          <PaidTab fees={paidFees} onDownloadReceipt={handleDownloadReceipt} />
        )}
        {activeTab === 'Transactions' && (
          <TransactionsTab 
            transactions={transactions} 
            onDownloadReceipt={handleDownloadReceipt} 
          />
        )} */}
        {/* {activeTab === 'Summary' && <SummaryTab summary={summary} />} */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4f354',
    paddingTop: Platform.OS === 'ios' ? 50 : 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4F63D2',
    padding: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#3D50B8',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  activeTabText: {
    color: '#4F63D2',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default FeeDetailScreen;