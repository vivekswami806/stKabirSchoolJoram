import { RootState } from '@/action/store';
import { ThemeContext } from '@/action/theme/ThemeContext';
import { Theme } from '@/action/theme/themeReducer';
import Skeleton from '@/components/Skeleton';
import { API_BASE_URL } from '@/config';
import { getDeviceId } from '@/helper/getDeviceId';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';
import { useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Platform,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { ToastService } from 'react-native-toastier';
import { useSelector } from 'react-redux';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubjectMark {
    subjectName: string;
    subjectCode: string;
    marksObtained: number;
    totalMarks: number;
    passingMarks: number;
    status: 'PASS' | 'FAIL';
    examTerm: string;
    optional: boolean;
    hasPractical: boolean;
    theoryMarksObtained?: number;
    theoryMaxMarks?: number;
    theoryPassingMarks?: number;
    theoryStatus?: 'PASS' | 'FAIL';
    practicalMarksObtained?: number;
    practicalMaxMarks?: number;
    practicalPassingMarks?: number;
    practicalStatus?: 'PASS' | 'FAIL';
}

interface StudentResult {
    studentId: string;
    admissionNumber: string;
    studentName: string;
    className: string;
    section: string;
    rollNumber: string;
    examTerm: string;
    totalMarksObtained: number;
    totalMaxMarks: number;
    percentage: number;
    cgpa: number;
    division: string;
    classRank: number;
    status: 'PASS' | 'FAIL';
    academicYear: string;
    subjectMarks: SubjectMark[];
}

interface ResultsResponse {
    result: StudentResult;
    success: boolean;
}

const { width } = Dimensions.get('window');

interface TabOption {
    id: 'schedule' | 'results' | 'analytics';
    label: string;
    icon: string;
}

// ─── Auth Headers Helper ───────────────────────────────────────────────────────

const getAuthHeaders = async () => {
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

// ─── Main Exam Screen ─────────────────────────────────────────────────────────

const ExamUI: React.FC = () => {
    const router = useRouter();
    const themeState = useContext(ThemeContext);
    const { userDetail } = useSelector((state: RootState) => state.user);

    const [activeTab, setActiveTab] = useState<'results'>('results');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [resultsData, setResultsData] = useState<StudentResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [animationValue] = useState(new Animated.Value(0));

    // Filter states
    const [selectedExamTerm, setSelectedExamTerm] = useState('FIRST_TERM');
    const [examTerms] = useState([
        { label: 'First Term', value: 'FIRST_TERM' },
        { label: 'Mid Term', value: 'MID_TERM' },
        { label: 'Final Term', value: 'FINAL_TERM' },
    ]);

    const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025-26');
    const [academicYears] = useState(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 2; i <= currentYear + 2; i++) {
            years.push({
                label: `${i}-${(i + 1).toString().slice(-2)}`,
                value: `${i}-${(i + 1).toString().slice(-2)}`,
            });
        }
        return years;
    });

    if (!themeState) return null;
    const { theme } = themeState;
    const styles = getStyles(theme);

    // Fetch results data
    const fetchData = useCallback(
        async (term: string, year: string, isRefresh = false) => {
            if (loading && !isRefresh) return;
            isRefresh ? setRefreshing(true) : setLoading(true);

            try {
                const [token, encodedTenant, studentId, deviceId] = await Promise.all([
                    AsyncStorage.getItem('auth_token'),
                    AsyncStorage.getItem('auth_tenant'),
                    AsyncStorage.getItem('auth_login_id'),
                    getDeviceId(),
                ]);

                if (!token || !encodedTenant) throw new Error('Auth missing');

                const tenantId = Buffer.from(encodedTenant, 'base64').toString('utf-8');

                const { data } = await axios.get<ResultsResponse>(
                    `${API_BASE_URL}results/term/by-student-id?studentId=${studentId}&examTerm=${term}&academicYear=${year}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'X-Tenant-ID': tenantId,
                            'X-Device-ID': deviceId,
                        },
                    }
                );
                // console.log("---data|", data.result,);
                // console.log("---data|data.result.subjectMarks[1]", data.result.subjectMarks[1]);

                if (data.success && data.result) {
                    setResultsData(data.result);
                    setError(null);

                    // Trigger animation
                    Animated.timing(animationValue, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: false,
                    }).start();
                } else {
                    setResultsData(null);
                    ToastService.show({
                        type: 'info',
                        message: 'No results found for the selected filters.',
                        duration: 3000,
                    });
                }
            } catch (err: any) {
                const errorMsg = err?.response?.data?.message || err.message || 'Failed to fetch results';
                setError(errorMsg);
                setResultsData(null);

                if (!isRefresh) {
                    ToastService.show({
                        type: 'danger',
                        message: errorMsg,
                        duration: 3000,
                    });
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [loading, animationValue]
    );

    // Initial fetch on mount and when filters change
    useEffect(() => {
        if (userDetail?.id) {
            fetchData(selectedExamTerm, selectedAcademicYear);
        }
    }, []);

    const onRefresh = useCallback(() => {
        if (userDetail?.id) {
            fetchData(selectedExamTerm, selectedAcademicYear, true);
        }
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/(tabs)/home')}>
                    <Ionicons
                        name="arrow-back"
                        size={26}
                        color={theme.mode === 'dark' ? theme.text : theme.text}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Exam Results</Text>
                <TouchableOpacity onPress={onRefresh} disabled={loading || refreshing}>
                    <Ionicons
                        name="refresh"
                        size={24}
                        color={theme.mode === 'dark' ? theme.text : theme.text}
                        style={{ opacity: loading || refreshing ? 0.5 : 1 }}
                    />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            {/* Filters */}
            <View style={styles.filterContainer}>

                {/* Exam Term Dropdown */}
                <View style={styles.dropdownWrapper}>
                    <Dropdown
                        style={styles.dropdown}
                        data={examTerms}
                        labelField="label"
                        valueField="value"
                        value={selectedExamTerm}
                        placeholder="Select Term"
                        onChange={(item) => {
                            setSelectedExamTerm(item.value);
                            fetchData(item.value, selectedAcademicYear);
                        }}
                        renderLeftIcon={() => (
                            <Ionicons
                                name="calendar"
                                size={18}
                                color={theme.primary}
                                style={{ marginRight: 8 }}
                            />
                        )}
                    />
                </View>

                {/* Academic Year Dropdown */}
                <View style={styles.dropdownWrapper}>
                    <Dropdown
                        style={styles.dropdown}
                        data={academicYears}
                        labelField="label"
                        valueField="value"
                        value={selectedAcademicYear}
                        placeholder="Select Year"
                        onChange={(item) => {
                            setSelectedAcademicYear(item.value);
                            fetchData(selectedExamTerm, item.value);
                        }}
                        renderLeftIcon={() => (
                            <Ionicons
                                name="school"
                                size={18}
                                color={theme.primary}
                                style={{ marginRight: 8 }}
                            />
                        )}
                    />
                </View>

            </View>

            {/* Content */}
            {loading ? (
                // <View style={styles.centerContainer}>
                    <Skeleton isDark={theme.mode === "dark"}/>
                    // <Text style={styles.loadingText}>Loading Your Results...</Text>
                /* </View> */
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle" size={64} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => onRefresh()}>
                        <Ionicons name="reload" size={20} color="#fff" />
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={[{ id: 'content' }]}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.primary}
                        />
                    }
                    renderItem={() => (
                        <>
                            {resultsData ? (
                                <ResultsContent data={resultsData} styles={styles} />
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="information-circle-outline" size={64} color="#9CA3AF" />
                                    <Text style={styles.emptyText}>No results available</Text>
                                    <Text style={styles.emptySubtext}>Select different filters to try again</Text>
                                </View>
                            )}
                        </>
                    )}
                    ListEmptyComponent={null}
                />
            )}
        </SafeAreaView>
    );
};

// ─── Loader Component ─────────────────────────────────────────────────────────

const LottieLoader: React.FC = () => {
    const [animationValue] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animationValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: false,
                }),
                Animated.timing(animationValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    const scale = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1.2],
    });

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#6366f1', opacity: 0.3 }} />
        </Animated.View>
    );
};

// ─── Score Circle Component ───────────────────────────────────────────────────

const ScoreCircle: React.FC<{
    percentage: number;
    status: 'PASS' | 'FAIL';
    styles: ReturnType<typeof getStyles>;
}> = ({ percentage, status, styles }) => {
    const statusColor = status === 'PASS' ? '#10b981' : '#ef4444';

    return (
        <View style={styles.scoreCircleContainer}>
            <View style={[styles.scoreCircle, { borderColor: statusColor, borderWidth: 3 }]}>
                <Text style={styles.scorePercentage}>{Math.round(percentage)}%</Text>
                <Text style={[styles.scoreStatus, { color: statusColor }]}>{status}</Text>
            </View>
        </View>
    );
};

// ─── Stat Card Component ──────────────────────────────────────────────────────

const EnhancedStatCard: React.FC<{
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string | number;
    color: string;
    styles: ReturnType<typeof getStyles>;
}> = ({ icon, label, value, color, styles }) => (
    <View style={[styles.enhancedStatCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
        <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.statContent}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statValueText, { color }]}>{value}</Text>
        </View>
    </View>
);

// ─── Subject Card Component ───────────────────────────────────────────────────

const EnhancedSubjectCard: React.FC<{
    subject: SubjectMark;
    styles: ReturnType<typeof getStyles>;
}> = ({ subject, styles }) => {
    const percentage = (subject.marksObtained / subject.totalMarks) * 100;
    const barColor = subject.status === 'PASS' ? '#06b6d4' : '#f97316';

    return (
        <View style={styles.enhancedSubjectCard}>
            {/* Header Row */}
            <View style={styles.subjectCardHeader}>
                <View style={styles.subjectTitleSection}>
                    <Text style={styles.subjectCardTitle}>{subject.subjectName}</Text>
                    {subject.optional && (
                        <View style={styles.optionalBadge}>
                            <Text style={styles.optionalBadgeText}>Optional</Text>
                        </View>
                    )}
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        {
                            backgroundColor: subject.status === 'PASS' ? '#ecfdf5' : '#fef2f2',
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.statusBadgeText,
                            {
                                color: subject.status === 'PASS' ? '#10b981' : '#ef4444',
                            },
                        ]}
                    >
                        {subject.status}
                    </Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressBarFill,
                            {
                                width: `${percentage}%`,
                                backgroundColor: barColor,
                            },
                        ]}
                    />
                </View>
                <Text style={styles.progressText}>{Math.round(percentage)}%</Text>
            </View>

            {/* Marks Grid */}
            <View style={styles.marksGrid}>
                <View style={styles.markItem}>
                    <Text style={styles.markLabel}>Obtained</Text>
                    <Text style={styles.markValue}>{subject.marksObtained}</Text>
                </View>
                <View style={styles.markDivider} />
                <View style={styles.markItem}>
                    <Text style={styles.markLabel}>Total</Text>
                    <Text style={styles.markValue}>{subject.totalMarks}</Text>
                </View>
                <View style={styles.markDivider} />
                <View style={styles.markItem}>
                    <Text style={styles.markLabel}>Passing</Text>
                    <Text style={styles.markValue}>{subject.passingMarks}</Text>
                </View>
            </View>

            {/* Theory & Practical (if applicable) */}
            {subject.hasPractical && (
                <View style={styles.practicalContainer}>
                    <View style={styles.practicalSection}>
                        <Text style={styles.practicalTitle}>Theory</Text>
                        <View style={styles.practicalDetails}>
                            <Text style={styles.practicalMarks}>
                                {subject.theoryMarksObtained ?? 0}/{subject.theoryMaxMarks ?? 0}
                            </Text>
                            <View
                                style={[
                                    styles.practicalStatus,
                                    {
                                        backgroundColor:
                                            subject.theoryStatus === 'PASS' ? '#ecfdf5' : '#fef2f2',
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.practicalStatusText,
                                        {
                                            color:
                                                subject.theoryStatus === 'PASS' ? '#10b981' : '#ef4444',
                                        },
                                    ]}
                                >
                                    {subject.theoryStatus ?? 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.practicalSection}>
                        <Text style={styles.practicalTitle}>Practical</Text>
                        <View style={styles.practicalDetails}>
                            <Text style={styles.practicalMarks}>
                                {subject.practicalMarksObtained ?? 0}/{subject.practicalMaxMarks ?? 0}
                            </Text>
                            <View
                                style={[
                                    styles.practicalStatus,
                                    {
                                        backgroundColor:
                                            subject.practicalStatus === 'PASS' ? '#ecfdf5' : '#fef2f2',
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.practicalStatusText,
                                        {
                                            color:
                                                subject.practicalStatus === 'PASS' ? '#10b981' : '#ef4444',
                                        },
                                    ]}
                                >
                                    {subject.practicalStatus ?? 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

// ─── Results Content Component ────────────────────────────────────────────────

const ResultsContent: React.FC<{
    data: StudentResult;
    styles: ReturnType<typeof getStyles>;
}> = ({ data, styles }) => {
    const themeState = useContext(ThemeContext);
    if (!themeState) return null;
    const { theme } = themeState;
    const failedSubjects = data.subjectMarks.filter((s) => s.status === 'FAIL').length;
    const passedSubjects = data.subjectMarks.length - failedSubjects;

    return (
        <View style={styles.contentContainer}>
            {/* Student Info Card */}
            <View style={styles.studentInfoCard}>
                <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{data.studentName}</Text>
                    {/* <Text style={styles.studentName}>{userDetail.studentFatherName}</Text> */}
                    <Text style={styles.studentMetaText}>ADM:{data.admissionNumber}</Text>
                    <View style={styles.studentMeta}>
                        <Text style={styles.studentMetaText}>Roll: {data.rollNumber}</Text>
                        <Text style={styles.studentMetaText}>•</Text>
                        <Text style={styles.studentMetaText}>
                            Class:{data.className}-{data.section}
                        </Text>

                    </View>
                </View>
            </View>

            {/* Score Card */}
            <View style={styles.scoreCardContainer}>
                <View style={styles.scoreCardContent}>
                    <View style={styles.scoreInfo}>
                        <ScoreCircle percentage={data.percentage} status={data.status} styles={styles} />
                        <View style={styles.scoreDetails}>
                            <Text style={styles.scoreLabel}>Overall Score</Text>
                            <Text style={styles.scoreMarks}>
                                {data.totalMarksObtained}/{data.totalMaxMarks}
                            </Text>
                            <Text style={styles.scoreCGPA}>CGPA: {data.cgpa.toFixed(2)}</Text>
                            <Text style={styles.scoreCGPA}>Percentage: {data.percentage} %</Text>
                            <Text style={styles.scoreCGPA}>Div: {data.division}</Text>
                            <Text style={styles.scoreCGPA}>ClassRank: {data.classRank} </Text>
                            <Text style={styles.scoreCGPA}>PassSubjects: {passedSubjects} </Text>
                            <Text style={styles.scoreCGPA}>Fail Subjects: {failedSubjects} </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsContainer}>
                {/* <EnhancedStatCard
          icon="medal"
          label="Division"
          value={data.division === 'NONE' ? 'N/A' : data.division}
          color="#6366f1"
          styles={styles}
        />
        <EnhancedStatCard
          icon="ribbon"
          label="Class Rank"
          value={data.classRank > 0 ? `#${data.classRank}` : 'N/A'}
          color="#06b6d4"
          styles={styles}
        /> */}
                {/* <EnhancedStatCard
          icon="alert-circle"
          label="Failed"
          value={failedSubjects}
          color="#f97316"
          styles={styles}
        />
        <EnhancedStatCard
          icon="checkmark-circle"
          label="Passed"
          value={passedSubjects}
          color="#10b981"
          styles={styles}
        /> */}
            </View>

            {/* Subject Cards */}
            <View style={styles.subjectsSection}>
                {/* <Text style={styles.sectionTitle}>Subject Performance</Text> */}
                <FlatList
          scrollEnabled={false}
          data={data.subjectMarks}
          keyExtractor={(item) => item.subjectCode}
          renderItem={({ item }) => (
            <EnhancedSubjectCard subject={item} styles={styles} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No subjects found</Text>
            </View>
          }
        />

                <View style={styles.tableContainer}>

                    {/* Header */}
                    {/* <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                            Subject
                        </Text>

                        <Text style={styles.tableHeaderText}>
                            Theory
                        </Text>

                        <Text style={styles.tableHeaderText}>
                            Practical
                        </Text>

                        <Text style={styles.tableHeaderText}>
                            Total
                        </Text>

                        <Text style={styles.tableHeaderText}>
                            %
                        </Text>

                        <Text style={styles.tableHeaderText}>
                            Status
                        </Text>
                    </View> */}

                    {/* Rows */}
                    {/* <FlatList
                        scrollEnabled={false}
                        data={data.subjectMarks}
                        keyExtractor={(item) => item.subjectCode}
                        renderItem={({ item, index }) => {

                            const percentage = (
                                (item.marksObtained / item.totalMarks) *
                                100
                            ).toFixed(0);

                            return (
                                <View
                                    style={[
                                        styles.tableRow,
                                        {
                                            backgroundColor:
                                                index % 2 === 0
                                                    ? theme.card
                                                    : theme.mode === 'dark'
                                                        ? '#1f2937'
                                                        : '#f9fafb',
                                        },
                                    ]}
                                >

                                    {/* Subject */}
                                    {/* <View style={{ flex: 2 }}>
                                        <Text
                                            style={styles.tableCell}
                                            numberOfLines={2}
                                        >
                                            {item.subjectName}
                                        </Text>

                                        {item.optional && (
                                            <Text
                                                style={{
                                                    fontSize: 10,
                                                    color: '#f59e0b',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                OPTIONAL
                                            </Text>
                                        )}
                                    </View> */}

                                    {/* Theory */}
                                    {/* <View style={{ flex: 1 }}>
                                        {item.hasPractical ? (
                                            <>
                                                <Text style={styles.tableCell}>
                                                    {item.theoryMarksObtained}/
                                                    {item.theoryMaxMarks}
                                                </Text>

                                                <Text
                                                    style={[
                                                        styles.smallStatus,
                                                        {
                                                            color:
                                                                item.theoryStatus === 'PASS'
                                                                    ? '#10b981'
                                                                    : '#ef4444',
                                                        },
                                                    ]}
                                                >
                                                    {item.theoryStatus}
                                                </Text>
                                            </>
                                        ) : (
                                            <Text style={styles.tableCell}>
                                                --
                                            </Text>
                                        )}
                                    </View> */}

                                    {/* Practical */}
                                    {/* <View style={{ flex: 1 }}>
                                        {item.hasPractical ? (
                                            <>
                                                <Text style={styles.tableCell}>
                                                    {item.practicalMarksObtained}/
                                                    {item.practicalMaxMarks}
                                                </Text>

                                                <Text
                                                    style={[
                                                        styles.smallStatus,
                                                        {
                                                            color:
                                                                item.practicalStatus === 'PASS'
                                                                    ? '#10b981'
                                                                    : '#ef4444',
                                                        },
                                                    ]}
                                                >
                                                    {item.practicalStatus}
                                                </Text>
                                            </>
                                        ) : (
                                            <Text style={styles.tableCell}>
                                                --
                                            </Text>
                                        )}
                                    </View> */}

                                    {/* Total */}
                                    {/* <Text style={styles.tableCell}>
                                        {item.marksObtained}/
                                        {item.totalMarks}
                                    </Text>

                                    {/* Percentage */}
                                    {/* <Text style={styles.tableCell}>
                                        {percentage}%
                                    </Text> */} 

                                    {/* Status */}
                                    {/* <Text
                                        style={[
                                            styles.tableCell,
                                            {
                                                color:
                                                    item.status === 'PASS'
                                                        ? '#10b981'
                                                        : '#ef4444',
                                                fontWeight: '700',
                                            },
                                        ]}
                                    >
                                        {item.status}
                                    </Text> */}
                                {/* </View>
                            );
                        }}
                    /> */} 

                    {/* Footer Total */}
                    {/* <View style={[styles.tableRow, styles.totalRow]}>

                        <Text
                            style={[
                                styles.totalText,
                                { flex: 2, textAlign: 'left' },
                            ]}
                        >
                            TOTAL
                        </Text>

                        <Text style={styles.totalText}>
                            --
                        </Text>

                        <Text style={styles.totalText}>
                            --
                        </Text>

                        <Text style={styles.totalText}>
                            {data.totalMarksObtained}/
                            {data.totalMaxMarks}
                        </Text>

                        <Text style={styles.totalText}>
                            {data.percentage.toFixed(1)}%
                        </Text>

                        <Text
                            style={[
                                styles.totalText,
                                {
                                    color:
                                        data.status === 'PASS'
                                            ? '#10b981'
                                            : '#ef4444',
                                },
                            ]}
                        >
                            {data.status}
                        </Text>

                    </View> */}

                </View>
            </View>
        </View>
    );
};

export default ExamUI;

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (theme: Theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },

        // Header
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            backgroundColor: theme.background,
            paddingTop: Platform.OS === 'android' ? 50 : 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 6,
        },
        smallStatus: {
            fontSize: 10,
            fontWeight: '700',
            textAlign: 'center',
            marginTop: 2,
          },
        headerTitle: {
            fontSize: 22,
            fontWeight: '700',
            color: theme.text,
            letterSpacing: 0.5,
        },

        // Filter
        filterContainer: {
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: theme.background,
        },
        filterChip: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: theme.cardBackground,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.border,
        },
        filterChipText: {
            fontSize: 12,
            fontWeight: '600',
        },

        // Center Container
        centerContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 300,
        },
        loadingText: {
            marginTop: 16,
            fontSize: 16,
            fontWeight: '600',
            color: theme.textSecondary,
        },
        errorText: {
            marginTop: 12,
            fontSize: 15,
            color: '#ef4444',
            textAlign: 'center',
            marginHorizontal: 20,
        },
        retryButton: {
            marginTop: 24,
            flexDirection: 'row',
            backgroundColor: '#6366f1',
            paddingVertical: 12,
            paddingHorizontal: 28,
            borderRadius: 12,
            alignItems: 'center',
            shadowColor: '#6366f1',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
        },
        retryButtonText: {
            color: '#fff',
            fontSize: 15,
            fontWeight: '700',
            marginLeft: 8,
        },
        emptyContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 60,
        },
        emptyText: {
            marginTop: 12,
            fontSize: 16,
            fontWeight: '600',
            color: theme.text,
            textAlign: 'center',
        },
        emptySubtext: {
            marginTop: 6,
            fontSize: 13,
            color: theme.textSecondary,
            textAlign: 'center',
        },

        // Content Container
        contentContainer: {
            padding: 16,
            paddingBottom: 16,
        },

        // Student Info Card
        studentInfoCard: {
            backgroundColor: theme.cardBackground,
            borderRadius: 14,
            padding: 14,
            marginBottom: 10,
            borderLeftWidth: 4,
            borderLeftColor: theme.primary,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
        },
        studentInfo: {
            flexDirection: 'column',
        },
        studentName: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 6,
        },
        studentMeta: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        studentMetaText: {
            fontSize: 12,
            color: theme.textSecondary,
            marginHorizontal: 4,
        },

        // Score Card
        scoreCardContainer: {
            backgroundColor: theme.cardBackground,
            borderRadius: 16,
            padding: 10,
            marginBottom: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
        },
        scoreCardContent: {
            alignItems: 'center',
        },
        scoreInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
        },
        scoreCircleContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 20,
        },
        scoreCircle: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: theme.primary,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
        },
        scorePercentage: {
            fontSize: 32,
            fontWeight: '800',
            color: '#fff',
        },
        scoreStatus: {
            fontSize: 12,
            fontWeight: '700',
            marginTop: 4,
        },
        scoreDetails: {
            flex: 1,
        },
        scoreLabel: {
            fontSize: 12,
            color: theme.textSecondary,
            fontWeight: '600',
            marginBottom: 4,
        },
        scoreMarks: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 2,
        },
        scoreCGPA: {
            fontSize: 13,
            color: theme.primary,
            fontWeight: '600',
        },

        // Stats Grid
        statsContainer: {
            marginBottom: 20,
        },
        enhancedStatCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.cardBackground,
            borderRadius: 12,
            padding: 14,
            marginBottom: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 1,
        },
        statIconContainer: {
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        statContent: {
            flex: 1,
        },
        statLabel: {
            fontSize: 12,
            color: theme.textSecondary,
            fontWeight: '600',
            marginBottom: 2,
        },
        statValueText: {
            fontSize: 16,
            fontWeight: '700',
        },

        // Subject Card
        enhancedSubjectCard: {
            backgroundColor: theme.cardBackground,
            borderRadius: 14,
            padding: 16,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
        },
        subjectCardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12,
        },
        subjectTitleSection: {
            flex: 1,
            marginRight: 8,
        },
        subjectCardTitle: {
            fontSize: 15,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 6,
        },
        optionalBadge: {
            backgroundColor: '#fef3c7',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            alignSelf: 'flex-start',
        },
        optionalBadgeText: {
            fontSize: 11,
            color: '#92400e',
            fontWeight: '700',
        },
        statusBadge: {
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            minWidth: 70,
            alignItems: 'center',
        },
        statusBadgeText: {
            fontSize: 11,
            fontWeight: '700',
        },

        // Progress Bar
        progressBarContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
        },
        progressBar: {
            flex: 1,
            height: 8,
            backgroundColor: theme.background,
            borderRadius: 4,
            overflow: 'hidden',
            marginRight: 10,
        },
        progressBarFill: {
            height: '100%',
            borderRadius: 4,
        },
        progressText: {
            fontSize: 12,
            fontWeight: '700',
            color: theme.text,
            minWidth: 35,
            textAlign: 'right',
        },

        // Marks Grid
        marksGrid: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 10,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: theme.border,
            marginBottom: 12,
        },
        markItem: {
            flex: 1,
            alignItems: 'center',
        },
        markDivider: {
            width: 1,
            height: 30,
            backgroundColor: theme.border,
        },
        markLabel: {
            fontSize: 11,
            color: theme.textSecondary,
            fontWeight: '600',
            marginBottom: 4,
        },
        markValue: {
            fontSize: 14,
            fontWeight: '700',
            color: theme.text,
        },

        // Practical Section
        practicalContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        practicalSection: {
            flex: 1,
        },
        practicalTitle: {
            fontSize: 12,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 6,
        },
        practicalDetails: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        practicalMarks: {
            fontSize: 13,
            fontWeight: '700',
            color: theme.text,
        },
        practicalStatus: {
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6,
        },
        practicalStatusText: {
            fontSize: 10,
            fontWeight: '700',
        },

        // Subjects Section
        subjectsSection: {
            marginTop: 0,
        },
        sectionTitle: {
            fontSize: 17,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 12,
            letterSpacing: 0.3,
        },
        dropdownWrapper: {
            flex: 1,
            marginHorizontal: 5,
        },

        dropdown: {
            height: 50,
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: 12,
            paddingHorizontal: 12,
            backgroundColor: theme.card,
        },
        tableContainer: {
            marginTop: 16,
            borderRadius: 14,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#E5E7EB',
        },

        tableHeader: {
            backgroundColor: theme.primary,
        },

        tableRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            paddingHorizontal: 8,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
        },

        tableHeaderText: {
            flex: 1,
            color: '#fff',
            fontWeight: '700',
            fontSize: 13,
            textAlign: 'center',
        },

        tableCell: {
            flex: 1,
            fontSize: 13,
            color: theme.text,
            textAlign: 'center',
        },
        totalRow: {
            backgroundColor:
                theme.mode === 'dark'
                    ? '#111827'
                    : '#EEF2FF',
            borderTopWidth: 2,
            borderTopColor: theme.primary,
        },

        totalText: {
            flex: 1,
            fontSize: 14,
            fontWeight: '700',
            color: theme.text,
            textAlign: 'center',
        },
    });