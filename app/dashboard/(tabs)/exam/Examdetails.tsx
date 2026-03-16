import { ThemeContext } from '@/action/theme/ThemeContext';
import { Theme } from '@/action/theme/themeReducer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { ToastService } from "react-native-toastier";

interface ExamDetail {
    id: string;
    title: string;
    date: string;
    time: string;
    duration: string;
    totalMarks: number;
    passingMarks: number;
    negativeMarking: number;
    subjects: string[];
    syllabus: string[];
    venue?: string;
    instructions: string[];
}

const ExamDetails: React.FC = () => {
    const router = useRouter();
    const themeState = useContext(ThemeContext);
    const [expandedExam, setExpandedExam] = useState<string | null>(null);
    const [showInstructions, setShowInstructions] = useState(false);

    if (!themeState) return null;
    const { theme } = themeState;
    const styles = getStyles(theme);

    const exams: ExamDetail[] = [
        {
            id: '1',
            title: 'Physics - First Term',
            date: '15 Sep 2025',
            time: '09:00 AM',
            duration: '3 hours',
            totalMarks: 100,
            passingMarks: 33,
            negativeMarking: 0.25,
            subjects: ['Mechanics', 'Thermodynamics', 'Waves'],
            syllabus: [
                'Chapter 1-5: Motion and Forces',
                'Chapter 6-8: Energy and Power',
                'Chapter 9-10: Oscillations',
            ],
            venue: 'Main Auditorium - Block A',
            instructions: [
                'Reach 15 minutes before the exam',
                'No electronic devices allowed',
                'Carry admit card and ID proof',
                'Use only black/blue pen',
                'Attempt all questions',
            ],
        },
        {
            id: '2',
            title: 'Chemistry - First Term',
            date: '18 Sep 2025',
            time: '09:00 AM',
            duration: '3 hours',
            totalMarks: 100,
            passingMarks: 33,
            negativeMarking: 0.25,
            subjects: ['Organic', 'Inorganic', 'Physical'],
            syllabus: [
                'Atomic Structure',
                'Periodic Table',
                'Chemical Bonding',
            ],
            venue: 'Lab Complex - Building B',
            instructions: [
                'Reach 15 minutes before the exam',
                'No electronic devices allowed',
                'Carry admit card and ID proof',
                'Use only black/blue pen',
                'Attempt all questions',
            ],
        },
        {
            id: '3',
            title: 'Mathematics - First Term',
            date: '22 Sep 2025',
            time: '10:00 AM',
            duration: '3 hours',
            totalMarks: 100,
            passingMarks: 33,
            negativeMarking: 0.25,
            subjects: ['Algebra', 'Geometry', 'Trigonometry'],
            syllabus: [
                'Polynomials',
                'Linear Equations',
                'Quadratic Equations',
            ],
            venue: 'Classroom Block - Room 101-110',
            instructions: [
                'Reach 15 minutes before the exam',
                'No electronic devices allowed',
                'Carry admit card and ID proof',
                'Use only black/blue pen',
                'Attempt all questions',
            ],
        },
    ];

    const handleDownloadAdmitCard = () => {
        ToastService.show({
            type: 'success',
            message: 'Admit card downloaded successfully',
            duration: 2500,
        });
    };

    const handleSetReminder = (examDate: string) => {
        ToastService.show({
            type: 'info',
            message: `Reminder set for ${examDate}`,
            duration: 2500,
        });
    };

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
                <Text style={styles.headerTitle}>Exam Details</Text>
                <View style={{ width: 26 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Exam List */}
                <Text style={styles.sectionTitle}>Upcoming Examinations</Text>

                {exams.map((exam) => (
                    <TouchableOpacity
                        key={exam.id}
                        style={styles.examCard}
                        onPress={() =>
                            setExpandedExam(
                                expandedExam === exam.id ? null : exam.id
                            )
                        }
                    >
                        {/* Card Header */}
                        <View style={styles.examCardHeader}>
                            <View style={styles.examIconContainer}>
                                <Ionicons
                                    name="document-text"
                                    size={24}
                                    color="#6366f1"
                                />
                            </View>
                            <View style={styles.examInfo}>
                                <Text style={styles.examTitle}>{exam.title}</Text>
                                <View style={styles.examMeta}>
                                    <Ionicons
                                        name="calendar"
                                        size={14}
                                        color="#9CA3AF"
                                    />
                                    <Text style={styles.examMetaText}>
                                        {exam.date}
                                    </Text>
                                    <Ionicons
                                        name="time"
                                        size={14}
                                        color="#9CA3AF"
                                        style={{ marginLeft: 12 }}
                                    />
                                    <Text style={styles.examMetaText}>
                                        {exam.time}
                                    </Text>
                                </View>
                            </View>
                            <Ionicons
                                name={
                                    expandedExam === exam.id
                                        ? 'chevron-up'
                                        : 'chevron-down'
                                }
                                size={24}
                                color="#6366f1"
                            />
                        </View>

                        {/* Expanded Content */}
                        {expandedExam === exam.id && (
                            <View style={styles.expandedContent}>
                                {/* Basic Info Grid */}
                                <View style={styles.infoGrid}>
                                    <InfoBox
                                        icon="hourglass"
                                        label="Duration"
                                        value={exam.duration}
                                        styles={styles}
                                    />
                                    <InfoBox
                                        icon="trophy"
                                        label="Total Marks"
                                        value={exam.totalMarks.toString()}
                                        styles={styles}
                                    />
                                    <InfoBox
                                        icon="checkmark-circle"
                                        label="Passing Marks"
                                        value={exam.passingMarks.toString()}
                                        styles={styles}
                                    />
                                    <InfoBox
                                        icon="alert-circle"
                                        label="Negative Marking"
                                        value={`-${exam.negativeMarking} per wrong`}
                                        styles={styles}
                                    />
                                </View>

                                {/* Venue */}
                                {exam.venue && (
                                    <View style={styles.detailSection}>
                                        <View style={styles.detailHeader}>
                                            <Ionicons
                                                name="location"
                                                size={18}
                                                color="#6366f1"
                                            />
                                            <Text style={styles.detailTitle}>
                                                Exam Venue
                                            </Text>
                                        </View>
                                        <Text style={styles.venueText}>
                                            {exam.venue}
                                        </Text>
                                    </View>
                                )}

                                {/* Subjects */}
                                <View style={styles.detailSection}>
                                    <View style={styles.detailHeader}>
                                        <Ionicons
                                            name="list"
                                            size={18}
                                            color="#6366f1"
                                        />
                                        <Text style={styles.detailTitle}>
                                            Topics Covered
                                        </Text>
                                    </View>
                                    <View style={styles.tagContainer}>
                                        {exam.subjects.map((subject, idx) => (
                                            <View
                                                key={idx}
                                                style={styles.tag}
                                            >
                                                <Text style={styles.tagText}>
                                                    {subject}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Syllabus */}
                                <View style={styles.detailSection}>
                                    <View style={styles.detailHeader}>
                                        <Ionicons
                                            name="book"
                                            size={18}
                                            color="#6366f1"
                                        />
                                        <Text style={styles.detailTitle}>
                                            Syllabus
                                        </Text>
                                    </View>
                                    {exam.syllabus.map((item, idx) => (
                                        <View
                                            key={idx}
                                            style={styles.syllabusItem}
                                        >
                                            <View style={styles.bulletPoint} />
                                            <Text style={styles.syllabusText}>
                                                {item}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Instructions Button */}
                                <TouchableOpacity
                                    style={styles.instructionsButton}
                                    onPress={() => setShowInstructions(true)}
                                >
                                    <Ionicons
                                        name="alert-circle"
                                        size={20}
                                        color="#f59e0b"
                                    />
                                    <Text style={styles.instructionsButtonText}>
                                        Read Important Instructions
                                    </Text>
                                </TouchableOpacity>

                                {/* Action Buttons */}
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={styles.secondaryButton}
                                        onPress={() =>
                                            handleSetReminder(exam.date)
                                        }
                                    >
                                        <Ionicons
                                            name="notifications"
                                            size={18}
                                            color="#6366f1"
                                        />
                                        <Text
                                            style={
                                                styles.secondaryButtonText
                                            }
                                        >
                                            Set Reminder
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.primaryButton}
                                        onPress={handleDownloadAdmitCard}
                                    >
                                        <Ionicons
                                            name="download"
                                            size={18}
                                            color="#FFF"
                                        />
                                        <Text
                                            style={
                                                styles.primaryButtonText
                                            }
                                        >
                                            Download Admit Card
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Instructions Modal */}
            <Modal
                visible={showInstructions}
                animationType="slide"
                transparent={false}
            >
                <SafeAreaView style={styles.modal}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            onPress={() => setShowInstructions(false)}
                        >
                            <Ionicons
                                name="close"
                                size={26}
                                color={
                                    theme.mode === 'dark' ? '#E5E7EB' : '#000'
                                }
                            />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            Important Instructions
                        </Text>
                        <View style={{ width: 26 }} />
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.modalContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={styles.instructionWarning}>
                            ⚠️ Please read all instructions carefully before
                            appearing for the exam.
                        </Text>

                        {exams[0].instructions.map((instruction, idx) => (
                            <View key={idx} style={styles.instructionItem}>
                                <View style={styles.instructionNumber}>
                                    <Text style={styles.instructionNumberText}>
                                        {idx + 1}
                                    </Text>
                                </View>
                                <Text style={styles.instructionText}>
                                    {instruction}
                                </Text>
                            </View>
                        ))}

                        <View style={styles.additionalInfo}>
                            <Text style={styles.additionalInfoTitle}>
                                Additional Information
                            </Text>
                            <View style={styles.infoRow}>
                                <Ionicons
                                    name="information-circle"
                                    size={18}
                                    color="#6366f1"
                                />
                                <Text style={styles.infoRowText}>
                                    In case of any queries, contact the
                                    examination center
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

// Info Box Component
const InfoBox: React.FC<{
    icon: string;
    label: string;
    value: string;
    styles: ReturnType<typeof getStyles>;
}> = ({ icon, label, value, styles }) => {
    return (
        <View style={styles.infoBox}>
            <View style={styles.infoBoxIcon}>
                <Ionicons name={icon as any} size={20} color="#6366f1" />
            </View>
            <Text style={styles.infoBoxLabel}>{label}</Text>
            <Text style={styles.infoBoxValue}>{value}</Text>
        </View>
    );
};

function getStyles(theme: Theme) {
    const dark = theme.mode === 'dark';

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: dark ? '#0B1220' : '#F9FAFB',
            paddingTop: Platform.OS === 'ios' ? 30 : 30,
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
        scrollContent: {
            paddingHorizontal: 16,
            paddingVertical: 16,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: dark ? '#E5E7EB' : '#000',
            marginBottom: 12,
        },
        examCard: {
            backgroundColor: dark ? '#111827' : '#FFF',
            borderRadius: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: dark ? '#1F2937' : '#E5E7EB',
            overflow: 'hidden',
        },
        examCardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
        },
        examIconContainer: {
            width: 48,
            height: 48,
            borderRadius: 8,
            backgroundColor: '#6366f120',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
        },
        examInfo: {
            flex: 1,
        },
        examTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: dark ? '#E5E7EB' : '#000',
            marginBottom: 6,
        },
        examMeta: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        examMetaText: {
            fontSize: 12,
            color: dark ? '#9CA3AF' : '#6B7280',
            marginLeft: 4,
        },
        expandedContent: {
            paddingHorizontal: 16,
            paddingBottom: 16,
            borderTopWidth: 1,
            borderTopColor: dark ? '#1F2937' : '#E5E7EB',
        },
        infoGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: 12,
            marginBottom: 16,
            justifyContent: 'space-between',
        },
        infoBox: {
            width: '48%',
            backgroundColor: dark ? '#0B1220' : '#F3F4F6',
            borderRadius: 8,
            padding: 12,
            alignItems: 'center',
            marginBottom: 8,
        },
        infoBoxIcon: {
            marginBottom: 6,
        },
        infoBoxLabel: {
            fontSize: 11,
            color: dark ? '#9CA3AF' : '#6B7280',
            marginBottom: 4,
        },
        infoBoxValue: {
            fontSize: 14,
            fontWeight: '700',
            color: dark ? '#E5E7EB' : '#000',
        },
        detailSection: {
            marginBottom: 16,
        },
        detailHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        detailTitle: {
            fontSize: 14,
            fontWeight: '700',
            color: dark ? '#E5E7EB' : '#000',
            marginLeft: 8,
        },
        venueText: {
            fontSize: 13,
            color: dark ? '#9CA3AF' : '#6B7280',
            paddingLeft: 28,
        },
        tagContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
            marginLeft: 28,
        },
        tag: {
            backgroundColor: '#6366f120',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 6,
        },
        tagText: {
            fontSize: 12,
            fontWeight: '500',
            color: '#6366f1',
        },
        syllabusItem: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 8,
            marginLeft: 28,
        },
        bulletPoint: {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: dark ? '#9CA3AF' : '#6B7280',
            marginRight: 10,
            marginTop: 6,
        },
        syllabusText: {
            fontSize: 13,
            color: dark ? '#9CA3AF' : '#6B7280',
            flex: 1,
        },
        instructionsButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#f5a62320',
            borderRadius: 8,
            padding: 12,
            marginVertical: 12,
            justifyContent: 'center',
        },
        instructionsButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: '#f59e0b',
            marginLeft: 8,
        },
        actionButtons: {
            flexDirection: 'row',
            gap: 8,
            marginTop: 12,
        },
        secondaryButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            borderRadius: 8,
            backgroundColor: dark ? '#0B1220' : '#F3F4F6',
            borderWidth: 2,
            borderColor: '#6366f1',
        },
        secondaryButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: '#6366f1',
            marginLeft: 6,
        },
        primaryButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            borderRadius: 8,
            backgroundColor: '#6366f1',
        },
        primaryButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: '#FFF',
            marginLeft: 6,
        },
        // Modal Styles
        modal: {
            flex: 1,
            backgroundColor: dark ? '#0B1220' : '#F9FAFB',
        },
        modalHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: dark ? '#1F2937' : '#E5E7EB',
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: dark ? '#E5E7EB' : '#000',
        },
        modalContent: {
            paddingHorizontal: 16,
            paddingVertical: 20,
        },
        instructionWarning: {
            fontSize: 14,
            color: '#f59e0b',
            fontWeight: '600',
            marginBottom: 20,
            padding: 12,
            backgroundColor: '#f5a62320',
            borderRadius: 8,
        },
        instructionItem: {
            flexDirection: 'row',
            marginBottom: 16,
        },
        instructionNumber: {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: '#6366f1',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
        },
        instructionNumberText: {
            color: '#FFF',
            fontSize: 14,
            fontWeight: '700',
        },
        instructionText: {
            flex: 1,
            fontSize: 14,
            color: dark ? '#9CA3AF' : '#6B7280',
            lineHeight: 20,
        },
        additionalInfo: {
            backgroundColor: dark ? '#111827' : '#FFF',
            borderRadius: 12,
            padding: 16,
            marginTop: 20,
            borderWidth: 1,
            borderColor: dark ? '#1F2937' : '#E5E7EB',
        },
        additionalInfoTitle: {
            fontSize: 14,
            fontWeight: '700',
            color: dark ? '#E5E7EB' : '#000',
            marginBottom: 12,
        },
        infoRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        infoRowText: {
            fontSize: 13,
            color: dark ? '#9CA3AF' : '#6B7280',
            marginLeft: 8,
            flex: 1,
        },
    });
}

export default ExamDetails;