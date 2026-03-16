import { ThemeContext } from '@/action/theme/ThemeContext';
import { Theme } from '@/action/theme/themeReducer';
import { API_BASE_URL } from '@/config';
import { getDeviceId } from '@/helper/getDeviceId';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';
import { useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { ToastService } from "react-native-toastier";
import { ResultsResponse, StudentResult } from './api';

const { width } = Dimensions.get('window');

interface TabOption {
    id: 'schedule' | 'results' | 'analytics';
    label: string;
    icon: string;
}

const ExamUI: React.FC = () => {
    const router = useRouter();
    const themeState = useContext(ThemeContext);
    const [activeTab, setActiveTab] = useState<'schedule' | 'results' | 'analytics'>('results');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [resultsData, setResultsData] = useState<StudentResult | null>(null);
    const [classResults, setClassResults] = useState<ResultsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!themeState) return null;
    const { theme } = themeState;
    const styles = getStyles(theme);

    const tabs: TabOption[] = [
        { id: 'schedule', label: 'Schedule', icon: 'calendar' },
        { id: 'results', label: 'My Results', icon: 'trophy' },
        { id: 'analytics', label: 'Analytics', icon: 'stats-chart' },
    ];

    const fetchData = useCallback(
        async (isRefresh = false) => {
          if (loading) return;
          isRefresh ? setRefreshing(true) : setLoading(true);
    
          try {
            const [token, encodedTenant, deviceId] = await Promise.all([
              AsyncStorage.getItem('auth_token'),
              AsyncStorage.getItem('auth_tenant'),
              getDeviceId(),
            ]);
    
            if (!token || !encodedTenant) throw new Error('Auth missing');
            console.log("---datacalled");
            
            const tenantId = Buffer.from(encodedTenant, 'base64').toString('utf-8');
            const { data } = await axios.get(`${API_BASE_URL}results/V2/class?className=1&section=A&examTerm=FIRST_TERM&academicYear=2025-26`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'X-Tenant-ID': tenantId,
                'X-Device-ID': deviceId,
              },
            });
            console.log("---Data|result", data);
            
            setClassResults(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
            setError(errorMessage);
            setLoading(false);
            console.log("eerr|", err);
            
            ToastService.show({
                type: 'danger',
                message: errorMessage,
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    },[]);

    useEffect(() => {
        // fetchData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        // await fetchData();
        setRefreshing(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/(tabs)/home')}>
                    <Ionicons
                        name="arrow-back"
                        size={26}
                        color={theme.mode === 'dark' ? '#E5E7EB' : '#000'}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Examination</Text>
                <TouchableOpacity onPress={() => router.push('/dashboard/(tabs)/exam/Examdetails')}>
                    <Ionicons
                        name="settings-outline"
                        size={26}
                        color={theme.mode === 'dark' ? '#E5E7EB' : '#000'}
                    />
                </TouchableOpacity>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[
                            styles.tab,
                            activeTab === tab.id && styles.activeTab,
                        ]}
                        onPress={() => setActiveTab(tab.id)}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={20}
                            color={activeTab === tab.id ? '#6366f1' : '#9CA3AF'}
                            style={styles.tabIcon}
                        />
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === tab.id && styles.activeTabText,
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>Exam schedule will be announced soon....</Text>
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle" size={48} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Text style={styles.loadingText}>Exam schedule will be announced soon...</Text>
                // <FlatList
                //     data={[{ id: 'content' }]}
                //     keyExtractor={(item) => item.id}
                //     refreshControl={
                //         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                //     }
                //     renderItem={() => (
                //         <>
                //             {activeTab === 'schedule' && resultsData && (
                //                 <ExamScheduleContent data={resultsData} styles={styles} />
                //             )}
                //             {activeTab === 'results' && resultsData && (
                //                 <ResultsContent data={resultsData} styles={styles} />
                //             )}
                //             {activeTab === 'analytics' && classResults && (
                //                 <AnalyticsContent data={classResults} styles={styles} />
                //             )}
                //         </>
                //     )}
                //     ListEmptyComponent={
                //         <View style={styles.emptyContainer}>
                //           <Text style={styles.emptyText}>No students found</Text>
                //         </View>
                //       }

                // />
            )}
        </SafeAreaView>
    );
};

// Schedule Content Component
const ExamScheduleContent: React.FC<{
    data: StudentResult;
    styles: ReturnType<typeof getStyles>;
}> = ({ data, styles }) => {
    const items = data.subjectMarks.map((subject, idx) => ({
        id: `${idx}`,
        subjectName: subject.subjectName,
        totalMarks: subject.totalMarks,
        passingMarks: subject.passingMarks,
        date: new Date().toLocaleDateString(),
        time: '09:00 AM - 12:00 PM',
    }));

    return (
        <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Upcoming Exams</Text>
            <FlatList
                scrollEnabled={false}
                data={items}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ExamCard exam={item} styles={styles} />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyText}>No upcoming exams</Text>
                    </View>
                }
            />
        </View>
    );
};

// Results Content Component
const ResultsContent: React.FC<{
    data: StudentResult;
    styles: ReturnType<typeof getStyles>;
}> = ({ data, styles }) => {
    return (
        <View style={styles.contentContainer}>
            {/* Overall Card */}
            <View style={styles.overallCard}>
                <View style={styles.overallInfo}>
                    <Text style={styles.overallLabel}>Overall Score</Text>
                    <Text style={styles.overallScore}>
                        {data.totalMarksObtained}/{data.totalMaxMarks}
                    </Text>
                    <Text style={styles.overallPercentage}>
                        {data.percentage.toFixed(1)}%
                    </Text>
                </View>
                <View style={styles.overallCircle}>
                    <View style={styles.circleProgress}>
                        <Text style={styles.circlePercentage}>
                            {Math.round(data.percentage)}%
                        </Text>
                    </View>
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <StatCard
                    icon="medal"
                    label="Division"
                    value={data.division}
                    color="#6366f1"
                    styles={styles}
                />
                <StatCard
                    icon="ranking"
                    label="Class Rank"
                    value={`#${data.classRank}`}
                    color="#06b6d4"
                    styles={styles}
                />
                <StatCard
                    icon="star"
                    label="CGPA"
                    value={data.cgpa.toFixed(2)}
                    color="#f59e0b"
                    styles={styles}
                />
                <StatCard
                    icon="checkmark-circle"
                    label="Status"
                    value={data.status}
                    color={data.status === 'PASS' ? '#10b981' : '#ef4444'}
                    styles={styles}
                />
            </View>

            {/* Subject Marks */}
            <Text style={styles.sectionTitle}>Subject Scores</Text>
            <FlatList
                scrollEnabled={false}
                data={data.subjectMarks}
                keyExtractor={(item) => item.subjectCode}
                renderItem={({ item }) => (
                    <SubjectCard subject={item} styles={styles} />
                )}
            />
        </View>
    );
};

// Analytics Content Component
const AnalyticsContent: React.FC<{
    data: any;
    styles: ReturnType<typeof getStyles>;
}> = ({ data, styles }) => {
    return (
        <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Class Performance</Text>
            
            {data.results && data.results.length > 0 && (
                <>
                    {/* Performance Distribution */}
                    <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsTitle}>Performance Distribution</Text>
                        <View style={styles.performanceChartContainer}>
                            {[
                                { range: 'Below 40%', count: 2, color: '#ef4444' },
                                { range: '40-60%', count: 5, color: '#f97316' },
                                { range: '60-80%', count: 8, color: '#fbbf24' },
                                { range: 'Above 80%', count: 3, color: '#10b981' },
                            ].map((item, idx) => (
                                <View key={idx} style={styles.performanceBar}>
                                    <View style={styles.performanceBarLabel}>
                                        <Text style={styles.performanceLabel}>{item.range}</Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.performanceBarFill,
                                            {
                                                width: `${(item.count / 18) * 100}%`,
                                                backgroundColor: item.color,
                                            },
                                        ]}
                                    />
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Top Performers */}
                    <Text style={styles.sectionTitle}>Top Performers</Text>
                    <FlatList
                        scrollEnabled={false}
                        data={data.results.slice(0, 5)}
                        keyExtractor={(item) => item.studentId}
                        renderItem={({ item, index }) => (
                            <View style={styles.performerCard}>
                                <View style={styles.rankCircle}>
                                    <Text style={styles.rankText}>#{index + 1}</Text>
                                </View>
                                <View style={styles.performerInfo}>
                                    <Text style={styles.performerName}>{item.studentName}</Text>
                                    <Text style={styles.performerScore}>
                                        {item.percentage.toFixed(1)}%
                                    </Text>
                                </View>
                                <View style={styles.performerBadge}>
                                    <Text style={styles.badgeText}>
                                        {item.totalMarksObtained}/{item.totalMaxMarks}
                                    </Text>
                                </View>
                            </View>
                        )}
                    />
                </>
            )}
        </View>
    );
};

// Exam Card Component
const ExamCard: React.FC<{
    exam: any;
    styles: ReturnType<typeof getStyles>;
}> = ({ exam, styles }) => {
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.subjectBadge}>
                    <Text style={styles.subjectBadgeText}>
                        {exam.subjectName.slice(0, 3)}
                    </Text>
                </View>
                <Text style={styles.cardTitle}>{exam.subjectName}</Text>
            </View>

            <View style={styles.cardInfo}>
                <InfoItem
                    icon="document-text"
                    label="Total Marks"
                    value={exam.totalMarks.toString()}
                    styles={styles}
                />
                <InfoItem
                    icon="checkmark-circle"
                    label="Pass Marks"
                    value={exam.passingMarks.toString()}
                    styles={styles}
                />
            </View>

            <View style={styles.cardInfo}>
                <InfoItem
                    icon="calendar"
                    label={exam.date}
                    value=""
                    styles={styles}
                />
                <InfoItem
                    icon="time"
                    label={exam.time}
                    value=""
                    styles={styles}
                />
            </View>
        </View>
    );
};

// Subject Card Component
const SubjectCard: React.FC<{
    subject: any;
    styles: ReturnType<typeof getStyles>;
}> = ({ subject, styles }) => {
    const percentage = (subject.marksObtained / subject.totalMarks) * 100;
    const isPass = subject.status === 'PASS';

    return (
        <View style={styles.card}>
            <View style={styles.subjectCardHeader}>
                <View>
                    <Text style={styles.subjectName}>{subject.subjectName}</Text>
                    <Text style={styles.subjectCode}>{subject.subjectCode}</Text>
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: isPass ? '#10b98133' : '#ef444433' },
                    ]}
                >
                    <Text
                        style={[
                            styles.statusBadgeText,
                            { color: isPass ? '#10b981' : '#ef4444' },
                        ]}
                    >
                        {subject.status}
                    </Text>
                </View>
            </View>

            <View style={styles.scoreBar}>
                <View style={styles.scoreInfo}>
                    <Text style={styles.scoreText}>
                        {subject.marksObtained}/{subject.totalMarks}
                    </Text>
                    <Text style={styles.scorePercentage}>{percentage.toFixed(1)}%</Text>
                </View>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                                width: `${percentage}%`,
                                backgroundColor: isPass ? '#10b981' : '#ef4444',
                            },
                        ]}
                    />
                </View>
            </View>

            {subject.optional && (
                <Text style={styles.optionalLabel}>Optional Subject</Text>
            )}
        </View>
    );
};

// Stat Card Component
const StatCard: React.FC<{
    icon: string;
    label: string;
    value: string;
    color: string;
    styles: ReturnType<typeof getStyles>;
}> = ({ icon, label, value, color, styles }) => {
    return (
        <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon as any} size={24} color={color} />
            </View>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
        </View>
    );
};

// Info Item Component
const InfoItem: React.FC<{
    icon: string;
    label: string;
    value?: string;
    styles: ReturnType<typeof getStyles>;
}> = ({ icon, label, value, styles }) => {
    return (
        <View style={styles.infoItem}>
            <Ionicons name={icon as any} size={16} color="#6366f1" />
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                {value && <Text style={styles.infoValue}>{value}</Text>}
            </View>
        </View>
    );
};

function getStyles(theme: Theme) {
    const dark = theme.mode === 'dark';

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: dark ? '#0B1220' : '#F9FAFB',
            paddingTop: Platform.OS === 'ios' ? 40 : 30,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: dark ? '#1F2937' : '#E5E7EB',
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: dark ? '#E5E7EB' : '#000',
        },
        tabContainer: {
            flexDirection: 'row',
            backgroundColor: dark ? '#111827' : '#FFF',
            borderBottomWidth: 1,
            borderBottomColor: dark ? '#1F2937' : '#E5E7EB',
            paddingHorizontal: 8,
        },
        tab: {
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 8,
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomWidth: 3,
            borderBottomColor: 'transparent',
        },
        activeTab: {
            borderBottomColor: '#6366f1',
        },
        tabIcon: {
            marginBottom: 4,
        },
        tabText: {
            fontSize: 12,
            color: dark ? '#9CA3AF' : '#6B7280',
            fontWeight: '500',
        },
        activeTabText: {
            color: '#6366f1',
            fontWeight: '600',
        },
        centerContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 16,
        },
        loadingText: {
            marginTop: 12,
            fontSize: 16,
            color: dark ? '#fff' : '#6B7280',
            textAlign:"center", paddingTop: "50%"
        },
        errorText: {
            marginTop: 12,
            fontSize: 16,
            color: '#ef4444',
            textAlign: 'center',
        },
        retryButton: {
            marginTop: 16,
            paddingHorizontal: 24,
            paddingVertical: 10,
            backgroundColor: '#6366f1',
            borderRadius: 8,
        },
        retryButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: '600',
        },
        contentContainer: {
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        card: {
            backgroundColor: dark ? '#111827' : '#FFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: dark ? '#1F2937' : '#E5E7EB',
        },
        cardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
        },
        subjectBadge: {
            width: 44,
            height: 44,
            borderRadius: 8,
            backgroundColor: '#6366f120',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
        },
        subjectBadgeText: {
            fontSize: 12,
            fontWeight: '700',
            color: '#6366f1',
        },
        cardTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: dark ? '#E5E7EB' : '#000',
            flex: 1,
        },
        cardInfo: {
            flexDirection: 'row',
            marginBottom: 12,
        },
        infoItem: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
        },
        infoContent: {
            marginLeft: 8,
            flex: 1,
        },
        infoLabel: {
            fontSize: 12,
            color: dark ? '#9CA3AF' : '#6B7280',
        },
        infoValue: {
            fontSize: 14,
            fontWeight: '600',
            color: dark ? '#E5E7EB' : '#000',
        },
        emptyContainer: {
            alignItems: 'center',
            paddingVertical: 40,
        },
        emptyText: {
            marginTop: 12,
            fontSize: 16,
            color: dark ? '#9CA3AF' : '#6B7280',
        },
        // Overall Card Styles
        overallCard: {
            backgroundColor: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 8,
        },
        overallInfo: {
            flex: 1,
        },
        overallLabel: {
            fontSize: 14,
            color: '#ffffff99',
            marginBottom: 4,
        },
        overallScore: {
            fontSize: 28,
            fontWeight: '700',
            color: '#fff',
            marginBottom: 4,
        },
        overallPercentage: {
            fontSize: 18,
            fontWeight: '600',
            color: '#fbbf24',
        },
        overallCircle: {
            width: 100,
            height: 100,
            marginLeft: 16,
        },
        circleProgress: {
            width: '100%',
            height: '100%',
            borderRadius: 50,
            borderWidth: 3,
            borderColor: '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.1)',
        },
        circlePercentage: {
            fontSize: 20,
            fontWeight: '700',
            color: '#fff',
        },
        statsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginBottom: 24,
            justifyContent: 'space-between',
        },
        statCard: {
            width: '48%',
            backgroundColor: dark ? '#111827' : '#FFF',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginBottom: 12,
            borderWidth: 1,
            borderColor: dark ? '#1F2937' : '#E5E7EB',
        },
        statIcon: {
            width: 44,
            height: 44,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
        },
        statLabel: {
            fontSize: 12,
            color: dark ? '#9CA3AF' : '#6B7280',
            marginBottom: 4,
        },
        statValue: {
            fontSize: 18,
            fontWeight: '700',
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: dark ? '#E5E7EB' : '#000',
            marginTop: 12,
            marginBottom: 12,
        },
        // Subject Card Styles
        subjectCardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12,
        },
        subjectName: {
            fontSize: 16,
            fontWeight: '600',
            color: dark ? '#E5E7EB' : '#000',
        },
        subjectCode: {
            fontSize: 12,
            color: dark ? '#9CA3AF' : '#6B7280',
            marginTop: 2,
        },
        statusBadge: {
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 6,
        },
        statusBadgeText: {
            fontSize: 12,
            fontWeight: '600',
        },
        scoreBar: {
            marginBottom: 8,
        },
        scoreInfo: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 8,
        },
        scoreText: {
            fontSize: 14,
            fontWeight: '600',
            color: dark ? '#E5E7EB' : '#000',
        },
        scorePercentage: {
            fontSize: 14,
            fontWeight: '600',
            color: dark ? '#E5E7EB' : '#000',
        },
        progressBar: {
            height: 8,
            borderRadius: 4,
            backgroundColor: dark ? '#1F2937' : '#E5E7EB',
            overflow: 'hidden',
        },
        progressFill: {
            height: '100%',
            borderRadius: 4,
        },
        optionalLabel: {
            fontSize: 11,
            color: '#f97316',
            marginTop: 8,
            fontWeight: '500',
        },
        // Analytics Styles
        analyticsCard: {
            backgroundColor: dark ? '#111827' : '#FFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: dark ? '#1F2937' : '#E5E7EB',
        },
        analyticsTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: dark ? '#E5E7EB' : '#000',
            marginBottom: 16,
        },
        performanceChartContainer: {
            gap: 12,
        },
        performanceBar: {
            marginBottom: 12,
        },
        performanceBarLabel: {
            marginBottom: 6,
        },
        performanceLabel: {
            fontSize: 12,
            color: dark ? '#9CA3AF' : '#6B7280',
            fontWeight: '500',
        },
        performanceBarFill: {
            height: 24,
            borderRadius: 6,
            minWidth: 24,
        },
        performerCard: {
            backgroundColor: dark ? '#111827' : '#FFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: dark ? '#1F2937' : '#E5E7EB',
        },
        rankCircle: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#6366f1',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
        },
        rankText: {
            fontSize: 14,
            fontWeight: '700',
            color: '#fff',
        },
        performerInfo: {
            flex: 1,
        },
        performerName: {
            fontSize: 14,
            fontWeight: '600',
            color: dark ? '#E5E7EB' : '#000',
        },
        performerScore: {
            fontSize: 12,
            color: dark ? '#9CA3AF' : '#6B7280',
            marginTop: 2,
        },
        performerBadge: {
            backgroundColor: '#6366f120',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 6,
        },
        badgeText: {
            fontSize: 12,
            fontWeight: '600',
            color: '#6366f1',
        },
    });
}

export default ExamUI;