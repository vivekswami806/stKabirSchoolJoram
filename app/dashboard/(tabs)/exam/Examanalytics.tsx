import { ThemeContext } from '@/action/theme/ThemeContext';
import { Theme } from '@/action/theme/themeReducer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface SubjectData {
    name: string;
    score: number;
    maxScore: number;
    previousScore?: number;
}

interface PerformanceTrend {
    exam: string;
    percentage: number;
    improvement: number;
}

const ExamAnalytics: React.FC = () => {
    const router = useRouter();
    const themeState = useContext(ThemeContext);
    const [selectedMetric, setSelectedMetric] = useState<'subjects' | 'trends' | 'insights'>(
        'subjects'
    );

    if (!themeState) return null;
    const { theme } = themeState;
    const styles = getStyles(theme);

    const subjectData: SubjectData[] = [
        { name: 'Physics', score: 50, maxScore: 100, previousScore: 45 },
        { name: 'Chemistry', score: 50, maxScore: 100, previousScore: 48 },
        { name: 'Biology', score: 50, maxScore: 100, previousScore: 42 },
        { name: 'English', score: 50, maxScore: 100, previousScore: 55 },
        { name: 'Hindi', score: 50, maxScore: 100, previousScore: 50 },
        { name: 'Math', score: 50, maxScore: 100, previousScore: 40 },
    ];

    const trends: PerformanceTrend[] = [
        { exam: 'Mid Term', percentage: 45, improvement: 0 },
        { exam: 'Unit Test 1', percentage: 52, improvement: 7 },
        { exam: 'Unit Test 2', percentage: 48, improvement: -4 },
        { exam: 'First Term', percentage: 50, improvement: 2 },
    ];

    const insights = [
        {
            id: '1',
            type: 'strength',
            title: 'Physics Excellence',
            description: 'Consistent performance with 50% score maintained',
            icon: 'star',
        },
        {
            id: '2',
            type: 'improvement',
            title: 'Math Improvement',
            description: 'Significant improvement of 25% from mid-term',
            icon: 'trending-up',
        },
        {
            id: '3',
            type: 'concern',
            title: 'English Performance',
            description: 'Score decreased by 9% from previous exam',
            icon: 'alert-circle',
        },
    ];

    const maxScore = Math.max(...subjectData.map((s) => s.score));
    const avgScore = Math.round(
        subjectData.reduce((acc, s) => acc + s.score, 0) / subjectData.length
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons
                        name="arrow-back"
                        size={26}
                        color={theme.mode === 'dark' ? '#E5E7EB' : '#000'}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Analytics</Text>
                <View style={{ width: 26 }} />
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
                <SummaryCard
                    label="Average Score"
                    value={avgScore.toString()}
                    unit="%"
                    color="#6366f1"
                    styles={styles}
                />
                <SummaryCard
                    label="Highest Score"
                    value={maxScore.toString()}
                    unit="/100"
                    color="#10b981"
                    styles={styles}
                />
                <SummaryCard
                    label="Subjects"
                    value={subjectData.length.toString()}
                    unit="Total"
                    color="#f59e0b"
                    styles={styles}
                />
            </View>

            {/* Metric Selector */}
            <View style={styles.metricSelector}>
                {(['subjects', 'trends', 'insights'] as const).map((metric) => (
                    <TouchableOpacity
                        key={metric}
                        style={[
                            styles.metricButton,
                            selectedMetric === metric && styles.activeMetricButton,
                        ]}
                        onPress={() => setSelectedMetric(metric)}
                    >
                        <Text
                            style={[
                                styles.metricText,
                                selectedMetric === metric && styles.activeMetricText,
                            ]}
                        >
                            {metric.charAt(0).toUpperCase() + metric.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            <FlatList
                data={[{ id: 'content' }]}
                keyExtractor={(item) => item.id}
                renderItem={() => (
                    <>
                        {selectedMetric === 'subjects' && (
                            <SubjectsView
                                subjects={subjectData}
                                styles={styles}
                                maxScore={maxScore}
                            />
                        )}
                        {selectedMetric === 'trends' && (
                            <TrendsView trends={trends} styles={styles} />
                        )}
                        {selectedMetric === 'insights' && (
                            <InsightsView insights={insights} styles={styles} />
                        )}
                    </>
                )}
            />
        </SafeAreaView>
    );
};

// Summary Card Component
const SummaryCard: React.FC<{
    label: string;
    value: string;
    unit: string;
    color: string;
    styles: ReturnType<typeof getStyles>;
}> = ({ label, value, unit, color, styles }) => {
    return (
        <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: `${color}20` }]}>
                <View
                    style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: color,
                    }}
                />
            </View>
            <Text style={styles.summaryLabel}>{label}</Text>
            <View style={styles.summaryValueContainer}>
                <Text style={[styles.summaryValue, { color }]}>{value}</Text>
                <Text style={styles.summaryUnit}>{unit}</Text>
            </View>
        </View>
    );
};

// Subjects View Component
const SubjectsView: React.FC<{
    subjects: SubjectData[];
    styles: ReturnType<typeof getStyles>;
    maxScore: number;
}> = ({ subjects, styles, maxScore }) => {
    return (
        <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Subject Breakdown</Text>
            <FlatList
                scrollEnabled={false}
                data={subjects}
                keyExtractor={(item) => item.name}
                renderItem={({ item }) => {
                    const percentage = (item.score / item.maxScore) * 100;
                    const improvement = item.previousScore
                        ? item.score - item.previousScore
                        : 0;
                    const isImprovement = improvement >= 0;

                    return (
                        <View style={styles.subjectItem}>
                            <View style={styles.subjectHeader}>
                                <Text style={styles.subjectName}>{item.name}</Text>
                                <View style={styles.subjectScore}>
                                    <Text style={styles.scoreText}>
                                        {item.score}/{item.maxScore}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${percentage}%`,
                                            backgroundColor:
                                                percentage >= 70
                                                    ? '#10b981'
                                                    : percentage >= 50
                                                    ? '#f59e0b'
                                                    : '#ef4444',
                                        },
                                    ]}
                                />
                            </View>

                            {item.previousScore !== undefined && (
                                <View style={styles.improvementRow}>
                                    <Ionicons
                                        name={
                                            isImprovement
                                                ? 'trending-up'
                                                : 'trending-down'
                                        }
                                        size={14}
                                        color={
                                            isImprovement ? '#10b981' : '#ef4444'
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.improvementText,
                                            {
                                                color: isImprovement
                                                    ? '#10b981'
                                                    : '#ef4444',
                                            },
                                        ]}
                                    >
                                        {isImprovement ? '+' : ''}{improvement}
                                    </Text>
                                </View>
                            )}
                        </View>
                    );
                }}
            />
        </View>
    );
};

// Trends View Component
const TrendsView: React.FC<{
    trends: PerformanceTrend[];
    styles: ReturnType<typeof getStyles>;
}> = ({ trends, styles }) => {
    const maxTrend = Math.max(...trends.map((t) => t.percentage));

    return (
        <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Performance Trend</Text>

            {/* Trend Chart */}
            <View style={styles.trendChart}>
                {trends.map((item, idx) => (
                    <View key={idx} style={styles.trendItem}>
                        <View style={styles.trendBar}>
                            <View
                                style={[
                                    styles.trendFill,
                                    {
                                        height: `${(item.percentage / maxTrend) * 100}%`,
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.trendLabel}>{item.exam}</Text>
                        <Text style={styles.trendValue}>{item.percentage}%</Text>
                    </View>
                ))}
            </View>

            {/* Trend Details */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                Exam History
            </Text>
            <FlatList
                scrollEnabled={false}
                data={trends}
                keyExtractor={(item) => item.exam}
                renderItem={({ item, index }) => (
                    <View style={styles.trendDetailItem}>
                        <View style={styles.trendDetailHeader}>
                            <View style={styles.trendDetailInfo}>
                                <Text style={styles.trendDetailExam}>
                                    {item.exam}
                                </Text>
                                <Text style={styles.trendDetailPercentage}>
                                    {item.percentage}%
                                </Text>
                            </View>
                            {item.improvement !== 0 && (
                                <View
                                    style={[
                                        styles.improvementBadge,
                                        {
                                            backgroundColor:
                                                item.improvement >= 0
                                                    ? '#10b98120'
                                                    : '#ef444420',
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={
                                            item.improvement >= 0
                                                ? 'trending-up'
                                                : 'trending-down'
                                        }
                                        size={14}
                                        color={
                                            item.improvement >= 0
                                                ? '#10b981'
                                                : '#ef4444'
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.improvementBadgeText,
                                            {
                                                color:
                                                    item.improvement >= 0
                                                        ? '#10b981'
                                                        : '#ef4444',
                                            },
                                        ]}
                                    >
                                        {item.improvement >= 0 ? '+' : ''}
                                        {item.improvement}%
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            />
        </View>
    );
};

// Insights View Component
const InsightsView: React.FC<{
    insights: any[];
    styles: ReturnType<typeof getStyles>;
}> = ({ insights, styles }) => {
    return (
        <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Key Insights</Text>
            <FlatList
                scrollEnabled={false}
                data={insights}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const iconColor =
                        item.type === 'strength'
                            ? '#10b981'
                            : item.type === 'improvement'
                            ? '#f59e0b'
                            : '#ef4444';

                    return (
                        <View style={styles.insightCard}>
                            <View
                                style={[
                                    styles.insightIcon,
                                    { backgroundColor: `${iconColor}20` },
                                ]}
                            >
                                <Ionicons
                                    name={item.icon as any}
                                    size={24}
                                    color={iconColor}
                                />
                            </View>
                            <View style={styles.insightContent}>
                                <Text style={styles.insightTitle}>
                                    {item.title}
                                </Text>
                                <Text style={styles.insightDescription}>
                                    {item.description}
                                </Text>
                            </View>
                        </View>
                    );
                }}
            />

            {/* Recommendations */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                Recommendations
            </Text>
            <View style={styles.recommendationCard}>
                <View style={styles.recommendationItem}>
                    <Ionicons
                        name="book"
                        size={20}
                        color="#6366f1"
                        style={styles.recommendationIcon}
                    />
                    <Text style={styles.recommendationText}>
                        Focus on weak areas with targeted practice
                    </Text>
                </View>
                <View style={styles.recommendationItem}>
                    <Ionicons
                        name="time"
                        size={20}
                        color="#6366f1"
                        style={styles.recommendationIcon}
                    />
                    <Text style={styles.recommendationText}>
                        Increase study time by 2 hours daily
                    </Text>
                </View>
                <View style={styles.recommendationItem}>
                    <Ionicons
                        name="people"
                        size={20}
                        color="#6366f1"
                        style={styles.recommendationIcon}
                    />
                    <Text style={styles.recommendationText}>
                        Consider group study sessions
                    </Text>
                </View>
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
            paddingTop: Platform.OS === 'ios' ? 0 : 0,
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
        summaryContainer: {
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingVertical: 12,
            justifyContent: 'space-between',
        },
        summaryCard: {
            flex: 1,
            backgroundColor: dark ? '#111827' : '#FFF',
            borderRadius: 12,
            padding: 12,
            marginHorizontal: 4,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: dark ? '#1F2937' : '#E5E7EB',
        },
        summaryIcon: {
            width: 40,
            height: 40,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 6,
        },
        summaryLabel: {
            fontSize: 11,
            color: dark ? '#9CA3AF' : '#6B7280',
            marginBottom: 6,
        },
        summaryValueContainer: {
            flexDirection: 'row',
            alignItems: 'flex-end',
        },
        summaryValue: {
            fontSize: 20,
            fontWeight: '700',
        },
        summaryUnit: {
            fontSize: 10,
            color: dark ? '#9CA3AF' : '#6B7280',
            marginLeft: 2,
        },
        metricSelector: {
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 8,
        },
        metricButton: {
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: dark ? '#111827' : '#FFF',
            borderWidth: 1,
            borderColor: dark ? '#1F2937' : '#E5E7EB',
        },
        activeMetricButton: {
            backgroundColor: '#6366f1',
            borderColor: '#6366f1',
        },
        metricText: {
            fontSize: 14,
            fontWeight: '600',
            color: dark ? '#9CA3AF' : '#6B7280',
            textAlign: 'center',
        },
        activeMetricText: {
            color: '#FFF',
        },
        contentContainer: {
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: dark ? '#E5E7EB' : '#000',
            marginBottom: 12,
        },
        // Subjects View Styles
        subjectItem: {
            backgroundColor: dark ? '#111827' : '#FFF',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: dark ? '#1F2937' : '#E5E7EB',
        },
        subjectHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        subjectName: {
            fontSize: 14,
            fontWeight: '600',
            color: dark ? '#E5E7EB' : '#000',
        },
        subjectScore: {
            backgroundColor: '#6366f120',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
        },
        scoreText: {
            fontSize: 12,
            fontWeight: '600',
            color: '#6366f1',
        },
        progressBar: {
            height: 8,
            borderRadius: 4,
            backgroundColor: dark ? '#1F2937' : '#E5E7EB',
            overflow: 'hidden',
            marginBottom: 8,
        },
        progressFill: {
            height: '100%',
            borderRadius: 4,
        },
        improvementRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 4,
        },
        improvementText: {
            fontSize: 12,
            fontWeight: '600',
            marginLeft: 4,
        },
        // Trends View Styles
        trendChart: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            backgroundColor: dark ? '#111827' : '#FFF',
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: dark ? '#1F2937' : '#E5E7EB',
            minHeight: 200,
        },
        trendItem: {
            alignItems: 'center',
            flex: 1,
        },
        trendBar: {
            width: 32,
            height: 120,
            backgroundColor: dark ? '#1F2937' : '#E5E7EB',
            borderRadius: 6,
            overflow: 'hidden',
            marginBottom: 8,
            justifyContent: 'flex-end',
        },
        trendFill: {
            width: '100%',
            backgroundColor: '#6366f1',
        },
        trendLabel: {
            fontSize: 11,
            color: dark ? '#9CA3AF' : '#6B7280',
            marginBottom: 4,
        },
        trendValue: {
            fontSize: 12,
            fontWeight: '600',
            color: dark ? '#E5E7EB' : '#000',
        },
        trendDetailItem: {
            backgroundColor: dark ? '#111827' : '#FFF',
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: dark ? '#1F2937' : '#E5E7EB',
        },
        trendDetailHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        trendDetailInfo: {
            flex: 1,
        },
        trendDetailExam: {
            fontSize: 14,
            fontWeight: '600',
            color: dark ? '#E5E7EB' : '#000',
        },
        trendDetailPercentage: {
            fontSize: 12,
            color: dark ? '#9CA3AF' : '#6B7280',
            marginTop: 2,
        },
        improvementBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
        },
        improvementBadgeText: {
            fontSize: 12,
            fontWeight: '600',
            marginLeft: 4,
        },
        // Insights View Styles
        insightCard: {
            backgroundColor: dark ? '#111827' : '#FFF',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            flexDirection: 'row',
            borderWidth: 1,
            borderColor: dark ? '#1F2937' : '#E5E7EB',
        },
        insightIcon: {
            width: 44,
            height: 44,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
        },
        insightContent: {
            flex: 1,
        },
        insightTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: dark ? '#E5E7EB' : '#000',
            marginBottom: 4,
        },
        insightDescription: {
            fontSize: 12,
            color: dark ? '#9CA3AF' : '#6B7280',
        },
        recommendationCard: {
            backgroundColor: dark ? '#111827' : '#FFF',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: dark ? '#1F2937' : '#E5E7EB',
        },
        recommendationItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
        },
        recommendationIcon: {
            marginRight: 12,
        },
        recommendationText: {
            flex: 1,
            fontSize: 13,
            color: dark ? '#E5E7EB' : '#000',
            fontWeight: '500',
        },
    });
}

export default ExamAnalytics;