// import { RootState } from '@/action/store';
// import { ThemeContext } from '@/action/theme/ThemeContext';
// import { Theme } from '@/action/theme/themeReducer';
// import Skeleton from '@/components/Skeleton';
// import { API_BASE_URL } from '@/config';
// import { getDeviceId } from '@/helper/getDeviceId';
// import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { Buffer } from 'buffer';
// import { useRouter } from 'expo-router';
// import React, {
//     useCallback,
//     useContext,
//     useEffect,
//     useRef,
//     useState,
// } from 'react';
// import {
//     Animated,
//     FlatList,
//     Platform,
//     RefreshControl,
//     SafeAreaView,
//     StyleSheet,
//     Text,
//     TouchableOpacity,
//     View,
// } from 'react-native';
// import { Dropdown } from 'react-native-element-dropdown';
// import { ToastService } from 'react-native-toastier';
// import { useSelector } from 'react-redux';

// // --------------------------------------------------
// // Types
// // --------------------------------------------------

// type ExamStatus = 'PASS' | 'FAIL';

// interface SubjectMark {
//     subjectName: string;
//     subjectCode: string;
//     grade?: string;
//     status?: ExamStatus;

//     mainExamLabel?: string;
//     mainExamMarks?: number;
//     mainExamMax?: number;

//     scored?: number;
//     scoredMax?: number;

//     optional?: boolean;
// }

// interface StudentResult {
//     studentId: string;
//     admissionNumber: string;
//     studentName: string;
//     fatherName: string;
//     motherName: string;
//     className: string;
//     section: string;
//     rollNumber: number | string;

//     examTerm?: string;
//     examLabel?: string;
//     academicYear: string;

//     totalMarksObtained: number;
//     totalMaxMarks: number;
//     percentage: number;
//     overallGrade: string;

//     subjectRows: SubjectMark[];

//     // Optional fields if returned by your API
//     cgpa?: number;
//     division?: string;
//     classRank?: number;
//     status?: ExamStatus;
// }

// interface ResultsResponse {
//     success: boolean;
//     message: string;
//     academicYear: string;
//     examTerm: string;
//     templateType: string;
//     reportCard: StudentResult;
// }

// interface DropdownOption {
//     label: string;
//     value: string;
// }

// // --------------------------------------------------
// // Main Exam Screen
// // --------------------------------------------------

// const ExamUI: React.FC = () => {
//     const router = useRouter();
//     const themeState = useContext(ThemeContext);
//     const { userDetail } = useSelector(
//         (state: RootState) => state.user
//     );

//     const [loading, setLoading] = useState(false);
//     const [refreshing, setRefreshing] = useState(false);
//     const [resultsData, setResultsData] =
//         useState<StudentResult | null>(null);
//     const [error, setError] = useState<string | null>(null);

//     const animationValue = useRef(new Animated.Value(0)).current;

//     const [selectedExamTerm, setSelectedExamTerm] =
//         useState('FIRST_TERM');

//     const examTerms: DropdownOption[] = [
//         { label: 'First Term', value: 'FIRST_TERM' },
//         { label: 'Second Term', value: 'SECOND_TERM' },
//         { label: 'Mid Term', value: 'MID_TERM' },
//         { label: 'Final Term', value: 'FINAL_TERM' },
//     ];

//     const [selectedAcademicYear, setSelectedAcademicYear] =
//         useState('2025-26');

//     const academicYears: DropdownOption[] = React.useMemo(() => {
//         const currentYear = new Date().getFullYear();
//         const years: DropdownOption[] = [];

//         for (
//             let year = currentYear - 2;
//             year <= currentYear + 2;
//             year++
//         ) {
//             years.push({
//                 label: `${year}-${String(year + 1).slice(-2)}`,
//                 value: `${year}-${String(year + 1).slice(-2)}`,
//             });
//         }

//         return years;
//     }, []);

//     if (!themeState) {
//         return null;
//     }

//     const { theme } = themeState;
//     const styles = getStyles(theme);

//     // --------------------------------------------------
//     // Fetch Exam Results
//     // --------------------------------------------------

//     const fetchData = useCallback(
//         async (
//             term: string,
//             year: string,
//             isRefresh = false
//         ) => {
//             if (!userDetail?.id) {
//                 setResultsData(null);
//                 setError('Student information is unavailable.');
//                 return;
//             }

//             if (isRefresh) {
//                 setRefreshing(true);
//             } else {
//                 setLoading(true);
//             }

//             setError(null);

//             try {
//                 const [
//                     token,
//                     encodedTenant,
//                     deviceId,
//                 ] = await Promise.all([
//                     AsyncStorage.getItem('auth_token'),
//                     AsyncStorage.getItem('auth_tenant'),
//                     getDeviceId(),
//                 ]);

//                 if (!token || !encodedTenant) {
//                     throw new Error(
//                         'Authentication credentials are missing.'
//                     );
//                 }

//                 const tenantId = Buffer.from(
//                     encodedTenant,
//                     'base64'
//                 ).toString('utf-8');

//                 const response = await axios.get<ResultsResponse>(
//                     `${API_BASE_URL}results/term/by-student-id`,
//                     {
//                         params: {
//                             studentId: userDetail.id,
//                             examTerm: term,
//                             academicYear: year,
//                         },
//                         headers: {
//                             Authorization: `Bearer ${token}`,
//                             'X-Tenant-ID': tenantId,
//                             'X-Device-ID': deviceId,
//                         },
//                     }
//                 );

//                 const data = response.data;

//                 console.log(
//                     'Exam result response:', response.data
//                 );

//                 const reportCard = data?.reportCard;

//                 if (data?.success && reportCard) {
//                     // IMPORTANT:
//                     // Subjects are stored in subjectRows,
//                     // not subjectMarks.
//                     const normalizedResult: StudentResult = {
//                         ...reportCard,
//                         subjectRows: Array.isArray(
//                             reportCard.subjectRows
//                         )
//                             ? reportCard.subjectRows
//                             : [],
//                     };

//                     console.log(
//                         'Subjects found:',
//                         normalizedResult.subjectRows.length
//                     );

//                     setResultsData(normalizedResult);
//                     setError(null);

//                     animationValue.setValue(0);

//                     Animated.timing(animationValue, {
//                         toValue: 1,
//                         duration: 500,
//                         useNativeDriver: true,
//                     }).start();
//                 } else {
//                     setResultsData(null);

//                     ToastService.show({
//                         type: 'info',
//                         message:
//                             data?.message ||
//                             'No results found for the selected filters.',
//                         duration: 3000,
//                     });
//                 }
//             } catch (err: unknown) {
//                 const errorMessage = axios.isAxiosError(err)
//                     ? err.response?.data?.message ||
//                       err.message ||
//                       'Failed to fetch results.'
//                     : err instanceof Error
//                       ? err.message
//                       : 'Failed to fetch results.';

//                 console.error(
//                     'Error fetching exam results:',
//                     errorMessage
//                 );

//                 setResultsData(null);
//                 setError(errorMessage);

//                 ToastService.show({
//                     type: 'danger',
//                     message: errorMessage,
//                     duration: 3000,
//                 });
//             } finally {
//                 setLoading(false);
//                 setRefreshing(false);
//             }
//         },
//         [userDetail?.id, animationValue]
//     );

//     // --------------------------------------------------
//     // Initial fetch and filter changes
//     // --------------------------------------------------

//     useEffect(() => {
//         if (userDetail?.id) {
//             fetchData(
//                 selectedExamTerm,
//                 selectedAcademicYear
//             );
//         }
//     }, [
//         userDetail?.id,
//         selectedExamTerm,
//         selectedAcademicYear,
//         fetchData,
//     ]);

//     // --------------------------------------------------
//     // Pull-to-refresh
//     // --------------------------------------------------

//     const onRefresh = useCallback(() => {
//         fetchData(
//             selectedExamTerm,
//             selectedAcademicYear,
//             true
//         );
//     }, [
//         fetchData,
//         selectedExamTerm,
//         selectedAcademicYear,
//     ]);

//     // --------------------------------------------------
//     // Render Screen
//     // --------------------------------------------------

//     return (
//         <SafeAreaView style={styles.container}>
//             {/* Header */}
//             <View style={styles.header}>
//                 <TouchableOpacity
//                     onPress={() => router.push('/(tabs)/home')}
//                     accessibilityLabel="Go back"
//                 >
//                     <Ionicons
//                         name="arrow-back"
//                         size={26}
//                         color={theme.text}
//                     />
//                 </TouchableOpacity>

//                 <Text style={styles.headerTitle}>
//                     Exam Results
//                 </Text>

//                 <TouchableOpacity
//                     onPress={onRefresh}
//                     disabled={loading || refreshing}
//                     accessibilityLabel="Refresh results"
//                 >
//                     <Ionicons
//                         name="refresh"
//                         size={24}
//                         color={theme.text}
//                         style={{
//                             opacity:
//                                 loading || refreshing ? 0.5 : 1,
//                         }}
//                     />
//                 </TouchableOpacity>
//             </View>

//             {/* Filters */}
//             <View style={styles.filterContainer}>
//                 <View style={styles.dropdownWrapper}>
//                     <Dropdown
//                         style={styles.dropdown}
//                         containerStyle={styles.dropdownMenu}
//                         data={examTerms}
//                         labelField="label"
//                         valueField="value"
//                         value={selectedExamTerm}
//                         placeholder="Select Term"
//                         onChange={(item) => {
//                             setSelectedExamTerm(item.value);
//                         }}
//                         renderLeftIcon={() => (
//                             <Ionicons
//                                 name="calendar"
//                                 size={18}
//                                 color={theme.primary}
//                                 style={{ marginRight: 8 }}
//                             />
//                         )}
//                     />
//                 </View>

//                 <View style={styles.dropdownWrapper}>
//                     <Dropdown
//                         style={styles.dropdown}
//                         containerStyle={styles.dropdownMenu}
//                         data={academicYears}
//                         labelField="label"
//                         valueField="value"
//                         value={selectedAcademicYear}
//                         placeholder="Select Year"
//                         onChange={(item) => {
//                             setSelectedAcademicYear(item.value);
//                         }}
//                         renderLeftIcon={() => (
//                             <Ionicons
//                                 name="school"
//                                 size={18}
//                                 color={theme.primary}
//                                 style={{ marginRight: 8 }}
//                             />
//                         )}
//                     />
//                 </View>
//             </View>

//             {/* Results */}
//             {loading ? (
//                 <View style={styles.loaderContainer}>
//                     <Skeleton isDark={theme.mode === 'dark'} />
//                 </View>
//             ) : error ? (
//                 <View style={styles.centerContainer}>
//                     <Ionicons
//                         name="alert-circle"
//                         size={64}
//                         color="#ef4444"
//                     />

//                     <Text style={styles.errorText}>
//                         {error}
//                     </Text>

//                     <TouchableOpacity
//                         style={styles.retryButton}
//                         onPress={onRefresh}
//                     >
//                         <Ionicons
//                             name="reload"
//                             size={20}
//                             color="#fff"
//                         />
//                         <Text style={styles.retryButtonText}>
//                             Retry
//                         </Text>
//                     </TouchableOpacity>
//                 </View>
//             ) : (
//                 <FlatList
//                     data={resultsData ? [resultsData] : []}
//                     keyExtractor={(item) =>
//                         String(item.studentId)
//                     }
//                     renderItem={({ item }) => (
//                         <Animated.View
//                             style={{
//                                 opacity: animationValue,
//                                 transform: [
//                                     {
//                                         translateY:
//                                             animationValue.interpolate({
//                                                 inputRange: [0, 1],
//                                                 outputRange: [12, 0],
//                                             }),
//                                     },
//                                 ],
//                             }}
//                         >
//                             <ResultsContent
//                                 data={item}
//                                 styles={styles}
//                             />
//                         </Animated.View>
//                     )}
//                     refreshControl={
//                         <RefreshControl
//                             refreshing={refreshing}
//                             onRefresh={onRefresh}
//                             tintColor={theme.primary}
//                         />
//                     }
//                     contentContainerStyle={
//                         resultsData
//                             ? styles.listContent
//                             : styles.emptyListContent
//                     }
//                     ListEmptyComponent={
//                         <View style={styles.emptyContainer}>
//                             <Ionicons
//                                 name="information-circle-outline"
//                                 size={64}
//                                 color="#9CA3AF"
//                             />

//                             <Text style={styles.emptyText}>
//                                 No results available
//                             </Text>

//                             <Text style={styles.emptySubtext}>
//                                 Select a different exam term or
//                                 academic year.
//                             </Text>
//                         </View>
//                     }
//                 />
//             )}
//         </SafeAreaView>
//     );
// };

// // --------------------------------------------------
// // Score Circle
// // --------------------------------------------------

// const ScoreCircle: React.FC<{
//     percentage: number;
//     status: ExamStatus;
//     styles: ReturnType<typeof getStyles>;
// }> = ({ percentage, status, styles }) => {
//     const statusColor =
//         status === 'PASS' ? '#10b981' : '#ef4444';

//     return (
//         <View style={styles.scoreCircleContainer}>
//             <View
//                 style={[
//                     styles.scoreCircle,
//                     { borderColor: statusColor },
//                 ]}
//             >
//                 <Text style={styles.scorePercentage}>
//                     {Math.round(percentage)}%
//                 </Text>

//                 <Text
//                     style={[
//                         styles.scoreStatus,
//                         { color: statusColor },
//                     ]}
//                 >
//                     {status}
//                 </Text>
//             </View>
//         </View>
//     );
// };

// // --------------------------------------------------
// // Subject Card
// // --------------------------------------------------

// const EnhancedSubjectCard: React.FC<{
//     subject: SubjectMark;
//     styles: ReturnType<typeof getStyles>;
// }> = ({ subject, styles }) => {
//     const marksObtained = Number(subject.scored ?? 0);
//     const totalMarks = Number(subject.scoredMax ?? 0);

//     const examMarks = Number(
//         subject.mainExamMarks ?? marksObtained
//     );

//     const examMax = Number(
//         subject.mainExamMax ?? totalMarks
//     );

//     const percentage =
//         totalMarks > 0
//             ? Math.min(
//                   100,
//                   Math.max(
//                       0,
//                       (marksObtained / totalMarks) * 100
//                   )
//               )
//             : 0;

//     const isPassed = subject.status === 'PASS';

//     const statusColor = isPassed
//         ? '#10b981'
//         : subject.status === 'FAIL'
//           ? '#ef4444'
//           : '#9ca3af';

//     return (
//         <View style={styles.enhancedSubjectCard}>
//             {/* Subject header */}
//             <View style={styles.subjectCardHeader}>
//                 <View style={styles.subjectTitleSection}>
//                     <Text style={styles.subjectCardTitle}>
//                         {subject.subjectName || 'Unnamed Subject'}
//                     </Text>

//                     <Text style={styles.markLabel}>
//                         Code: {subject.subjectCode || 'N/A'}
//                     </Text>

//                     {subject.optional ? (
//                         <View style={styles.optionalBadge}>
//                             <Text style={styles.optionalBadgeText}>
//                                 Optional
//                             </Text>
//                         </View>
//                     ) : null}
//                 </View>

//                 <View
//                     style={[
//                         styles.statusBadge,
//                         {
//                             backgroundColor:
//                                 subject.status === 'PASS'
//                                     ? '#ecfdf5'
//                                     : subject.status === 'FAIL'
//                                       ? '#fef2f2'
//                                       : '#f3f4f6',
//                         },
//                     ]}
//                 >
//                     <Text
//                         style={[
//                             styles.statusBadgeText,
//                             { color: statusColor },
//                         ]}
//                     >
//                         {subject.status || 'N/A'}
//                     </Text>
//                 </View>
//             </View>

//             {/* Progress bar */}
//             <View style={styles.progressBarContainer}>
//                 <View style={styles.progressBar}>
//                     <View
//                         style={[
//                             styles.progressBarFill,
//                             {
//                                 width: `${percentage}%`,
//                                 backgroundColor: statusColor,
//                             },
//                         ]}
//                     />
//                 </View>

//                 <Text style={styles.progressText}>
//                     {percentage.toFixed(1)}%
//                 </Text>
//             </View>

//             {/* Marks grid */}
//             <View style={styles.marksGrid}>
//                 <View style={styles.markItem}>
//                     <Text style={styles.markLabel}>
//                         Obtained
//                     </Text>

//                     <Text style={styles.markValue}>
//                         {marksObtained}
//                     </Text>
//                 </View>

//                 <View style={styles.markDivider} />

//                 <View style={styles.markItem}>
//                     <Text style={styles.markLabel}>
//                         Maximum
//                     </Text>

//                     <Text style={styles.markValue}>
//                         {totalMarks}
//                     </Text>
//                 </View>

//                 <View style={styles.markDivider} />

//                 <View style={styles.markItem}>
//                     <Text style={styles.markLabel}>
//                         Grade
//                     </Text>

//                     <Text style={styles.markValue}>
//                         {subject.grade || 'N/A'}
//                     </Text>
//                 </View>
//             </View>

//             {/* Exam details */}
//             <View style={styles.examDetails}>
//                 <View style={styles.examDetailRow}>
//                     <Ionicons
//                         name="document-text-outline"
//                         size={16}
//                         color={styles.markLabel.color}
//                     />

//                     <Text style={styles.examDetailText}>
//                         Exam: {subject.mainExamLabel || 'N/A'}
//                     </Text>
//                 </View>

//                 <View style={styles.examDetailRow}>
//                     <Ionicons
//                         name="school-outline"
//                         size={16}
//                         color={styles.markLabel.color}
//                     />

//                     <Text style={styles.examDetailText}>
//                         Exam Marks: {examMarks}/{examMax}
//                     </Text>
//                 </View>
//             </View>
//         </View>
//     );
// };

// // --------------------------------------------------
// // Results Content
// // --------------------------------------------------

// const ResultsContent: React.FC<{
//     data: StudentResult;
//     styles: ReturnType<typeof getStyles>;
// }> = ({ data, styles }) => {
//     const themeState = useContext(ThemeContext);

//     if (!themeState) {
//         return null;
//     }

//     const subjects: SubjectMark[] = Array.isArray(
//         data.subjectRows
//     )
//         ? data.subjectRows
//         : [];

//     const failedSubjects = subjects.filter(
//         (subject) => subject.status === 'FAIL'
//     ).length;

//     const passedSubjects = subjects.filter(
//         (subject) => subject.status === 'PASS'
//     ).length;

//     const percentage = Number(data.percentage) || 0;

//     const overallStatus: ExamStatus =
//         data.status === 'PASS' ||
//         data.status === 'FAIL'
//             ? data.status
//             : failedSubjects > 0
//               ? 'FAIL'
//               : 'PASS';

//     return (
//         <View style={styles.contentContainer}>
//             {/* Student information */}
//             <View style={styles.studentInfoCard}>
//                 <View style={styles.studentInfo}>
//                     <Text style={styles.studentName}>
//                         {data.studentName?.trim() || 'Student'}
//                     </Text>

//                     <Text style={styles.studentMetaText}>
//                         Admission No: {data.admissionNumber || 'N/A'}
//                     </Text>

//                     <Text style={styles.studentMetaText}>
//                         Father: {data.fatherName || 'N/A'}
//                     </Text>

//                     <Text style={styles.studentMetaText}>
//                         Mother: {data.motherName || 'N/A'}
//                     </Text>

//                     <View style={styles.studentMeta}>
//                         <Text style={styles.studentMetaText}>
//                             Roll: {data.rollNumber ?? 'N/A'}
//                         </Text>

//                         <Text style={styles.studentMetaText}>
//                             {' • '}
//                         </Text>

//                         <Text style={styles.studentMetaText}>
//                             Class: {data.className || 'N/A'}
//                             {data.section ? `-${data.section}` : ''}
//                         </Text>
//                     </View>

//                     <Text style={styles.studentMetaText}>
//                         Academic Year: {data.academicYear || 'N/A'}
//                     </Text>

//                     <Text style={styles.studentMetaText}>
//                         Exam: {data.examLabel || data.examTerm || 'N/A'}
//                     </Text>
//                 </View>
//             </View>

//             {/* Overall score */}
//             <View style={styles.scoreCardContainer}>
//                 <View style={styles.scoreInfo}>
//                     <ScoreCircle
//                         percentage={percentage}
//                         status={overallStatus}
//                         styles={styles}
//                     />

//                     <View style={styles.scoreDetails}>
//                         <Text style={styles.scoreLabel}>
//                             Overall Score
//                         </Text>

//                         <Text style={styles.scoreMarks}>
//                             {data.totalMarksObtained ?? 0}/
//                             {data.totalMaxMarks ?? 0}
//                         </Text>

//                         <Text style={styles.scoreCGPA}>
//                             Grade: {data.overallGrade || 'N/A'}
//                         </Text>

//                         <Text style={styles.scoreCGPA}>
//                             Percentage: {percentage.toFixed(2)}%
//                         </Text>

//                         {data.cgpa != null ? (
//                             <Text style={styles.scoreCGPA}>
//                                 CGPA: {Number(data.cgpa).toFixed(2)}
//                             </Text>
//                         ) : null}

//                         {data.division ? (
//                             <Text style={styles.scoreCGPA}>
//                                 Division: {data.division}
//                             </Text>
//                         ) : null}

//                         {data.classRank != null ? (
//                             <Text style={styles.scoreCGPA}>
//                                 Class Rank: {data.classRank}
//                             </Text>
//                         ) : null}

//                         <Text style={styles.scoreCGPA}>
//                             Passed Subjects: {passedSubjects}
//                         </Text>

//                         <Text style={styles.scoreCGPA}>
//                             Failed Subjects: {failedSubjects}
//                         </Text>
//                     </View>
//                 </View>
//             </View>

//             {/* Subject results */}
//             <View style={styles.subjectsSection}>
//                 <Text style={styles.sectionTitle}>
//                     Subject Performance ({subjects.length})
//                 </Text>

//                 {subjects.length > 0 ? (
//                     subjects.map((subject, index) => (
//                         <EnhancedSubjectCard
//                             key={`${subject.subjectCode || 'subject'}-${index}`}
//                             subject={subject}
//                             styles={styles}
//                         />
//                     ))
//                 ) : (
//                     <View style={styles.emptyContainer}>
//                         <Ionicons
//                             name="book-outline"
//                             size={48}
//                             color="#9CA3AF"
//                         />

//                         <Text style={styles.emptyText}>
//                             No subject results found
//                         </Text>

//                         <Text style={styles.emptySubtext}>
//                             The API returned no subjects for this exam.
//                         </Text>
//                     </View>
//                 )}
//             </View>
//         </View>
//     );
// };

// export default ExamUI;

// // --------------------------------------------------
// // Styles
// // --------------------------------------------------

// const getStyles = (theme: Theme) =>
//     StyleSheet.create({
//         container: {
//             flex: 1,
//             backgroundColor: theme.background,
//         },

//         header: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             padding: 16,
//             paddingTop:
//                 Platform.OS === 'android' ? 50 : 16,
//             backgroundColor: theme.background,
//             shadowColor: '#000',
//             shadowOffset: { width: 0, height: 4 },
//             shadowOpacity: 0.15,
//             shadowRadius: 8,
//             elevation: 6,
//         },

//         headerTitle: {
//             fontSize: 22,
//             fontWeight: '700',
//             color: theme.text,
//             letterSpacing: 0.5,
//         },

//         filterContainer: {
//             flexDirection: 'row',
//             gap: 10,
//             paddingHorizontal: 12,
//             paddingVertical: 12,
//             backgroundColor: theme.background,
//         },

//         dropdownWrapper: {
//             flex: 1,
//             marginHorizontal: 3,
//         },

//         dropdown: {
//             height: 50,
//             borderWidth: 1,
//             borderColor: theme.border || '#D1D5DB',
//             borderRadius: 12,
//             paddingHorizontal: 12,
//             backgroundColor: theme.cardBackground,
//         },

//         dropdownMenu: {
//             backgroundColor: theme.cardBackground,
//             borderRadius: 12,
//             borderColor: theme.border,
//         },

//         loaderContainer: {
//             flex: 1,
//             padding: 16,
//         },

//         centerContainer: {
//             flex: 1,
//             justifyContent: 'center',
//             alignItems: 'center',
//             paddingHorizontal: 20,
//             minHeight: 300,
//         },

//         errorText: {
//             marginTop: 12,
//             fontSize: 15,
//             color: '#ef4444',
//             textAlign: 'center',
//         },

//         retryButton: {
//             marginTop: 24,
//             flexDirection: 'row',
//             backgroundColor: '#6366f1',
//             paddingVertical: 12,
//             paddingHorizontal: 28,
//             borderRadius: 12,
//             alignItems: 'center',
//             justifyContent: 'center',
//         },

//         retryButtonText: {
//             color: '#fff',
//             fontSize: 15,
//             fontWeight: '700',
//             marginLeft: 8,
//         },

//         listContent: {
//             paddingBottom: 24,
//         },

//         emptyListContent: {
//             flexGrow: 1,
//             justifyContent: 'center',
//         },

//         emptyContainer: {
//             justifyContent: 'center',
//             alignItems: 'center',
//             paddingVertical: 50,
//             paddingHorizontal: 20,
//         },

//         emptyText: {
//             marginTop: 12,
//             fontSize: 16,
//             fontWeight: '600',
//             color: theme.text,
//             textAlign: 'center',
//         },

//         emptySubtext: {
//             marginTop: 6,
//             fontSize: 13,
//             color: theme.textSecondary,
//             textAlign: 'center',
//         },

//         contentContainer: {
//             padding: 16,
//             paddingBottom: 24,
//         },

//         studentInfoCard: {
//             backgroundColor: theme.cardBackground,
//             borderRadius: 14,
//             padding: 14,
//             marginBottom: 14,
//             borderLeftWidth: 4,
//             borderLeftColor: theme.primary,
//             shadowColor: '#000',
//             shadowOffset: { width: 0, height: 2 },
//             shadowOpacity: 0.08,
//             shadowRadius: 4,
//             elevation: 2,
//         },

//         studentInfo: {
//             flexDirection: 'column',
//             gap: 5,
//         },

//         studentName: {
//             fontSize: 18,
//             fontWeight: '700',
//             color: theme.text,
//             marginBottom: 4,
//         },

//         studentMeta: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             flexWrap: 'wrap',
//         },

//         studentMetaText: {
//             fontSize: 12,
//             color: theme.textSecondary,
//         },

//         scoreCardContainer: {
//             backgroundColor: theme.cardBackground,
//             borderRadius: 16,
//             padding: 14,
//             marginBottom: 18,
//             shadowColor: '#000',
//             shadowOffset: { width: 0, height: 4 },
//             shadowOpacity: 0.1,
//             shadowRadius: 8,
//             elevation: 3,
//         },

//         scoreInfo: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             width: '100%',
//         },

//         scoreCircleContainer: {
//             justifyContent: 'center',
//             alignItems: 'center',
//             marginRight: 18,
//         },

//         scoreCircle: {
//             width: 100,
//             height: 100,
//             borderRadius: 50,
//             borderWidth: 3,
//             backgroundColor: theme.primary,
//             justifyContent: 'center',
//             alignItems: 'center',
//         },

//         scorePercentage: {
//             fontSize: 29,
//             fontWeight: '800',
//             color: '#fff',
//         },

//         scoreStatus: {
//             fontSize: 12,
//             fontWeight: '700',
//             marginTop: 4,
//         },

//         scoreDetails: {
//             flex: 1,
//         },

//         scoreLabel: {
//             fontSize: 12,
//             color: theme.textSecondary,
//             fontWeight: '600',
//             marginBottom: 4,
//         },

//         scoreMarks: {
//             fontSize: 20,
//             fontWeight: '700',
//             color: theme.text,
//             marginBottom: 4,
//         },

//         scoreCGPA: {
//             fontSize: 13,
//             color: theme.primary,
//             fontWeight: '600',
//             marginTop: 3,
//         },

//         subjectsSection: {
//             marginTop: 0,
//         },

//         sectionTitle: {
//             fontSize: 18,
//             fontWeight: '700',
//             color: theme.text,
//             marginBottom: 14,
//         },

//         enhancedSubjectCard: {
//             backgroundColor: theme.cardBackground,
//             borderRadius: 14,
//             padding: 16,
//             marginBottom: 12,
//             borderWidth: 1,
//             borderColor: theme.border || '#E5E7EB',
//             shadowColor: '#000',
//             shadowOffset: { width: 0, height: 2 },
//             shadowOpacity: 0.06,
//             shadowRadius: 4,
//             elevation: 2,
//         },

//         subjectCardHeader: {
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             alignItems: 'flex-start',
//             marginBottom: 12,
//         },

//         subjectTitleSection: {
//             flex: 1,
//             marginRight: 8,
//         },

//         subjectCardTitle: {
//             fontSize: 16,
//             fontWeight: '700',
//             color: theme.text,
//             marginBottom: 6,
//         },

//         statusBadge: {
//             paddingHorizontal: 10,
//             paddingVertical: 6,
//             borderRadius: 8,
//             minWidth: 65,
//             alignItems: 'center',
//         },

//         statusBadgeText: {
//             fontSize: 11,
//             fontWeight: '700',
//         },

//         optionalBadge: {
//             backgroundColor: '#fef3c7',
//             paddingHorizontal: 8,
//             paddingVertical: 4,
//             borderRadius: 6,
//             alignSelf: 'flex-start',
//             marginTop: 5,
//         },

//         optionalBadgeText: {
//             fontSize: 11,
//             color: '#92400e',
//             fontWeight: '700',
//         },

//         progressBarContainer: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             marginBottom: 12,
//         },

//         progressBar: {
//             flex: 1,
//             height: 8,
//             backgroundColor: theme.background,
//             borderRadius: 4,
//             overflow: 'hidden',
//             marginRight: 10,
//         },

//         progressBarFill: {
//             height: '100%',
//             borderRadius: 4,
//         },

//         progressText: {
//             fontSize: 12,
//             fontWeight: '700',
//             color: theme.text,
//             minWidth: 45,
//             textAlign: 'right',
//         },

//         marksGrid: {
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             paddingVertical: 12,
//             borderTopWidth: 1,
//             borderBottomWidth: 1,
//             borderColor: theme.border || '#E5E7EB',
//             marginBottom: 12,
//         },

//         markItem: {
//             flex: 1,
//             alignItems: 'center',
//         },

//         markDivider: {
//             width: 1,
//             height: 34,
//             backgroundColor: theme.border || '#E5E7EB',
//         },

//         markLabel: {
//             fontSize: 11,
//             color: theme.textSecondary,
//             fontWeight: '600',
//             marginBottom: 5,
//         },

//         markValue: {
//             fontSize: 14,
//             fontWeight: '700',
//             color: theme.text,
//         },

//         examDetails: {
//             gap: 8,
//         },

//         examDetailRow: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: 8,
//         },

//         examDetailText: {
//             fontSize: 12,
//             color: theme.textSecondary,
//             fontWeight: '500',
//         },
//     });




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
import React, {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    Animated,
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

// --------------------------------------------------
// Types
// --------------------------------------------------

type ExamStatus = 'PASS' | 'FAIL';

interface SubjectMark {
    subjectName: string;
    subjectCode: string;
    grade?: string;
    status?: ExamStatus;

    mainExamLabel?: string;
    mainExamMarks?: number;
    mainExamMax?: number;

    scored?: number;
    scoredMax?: number;

    optional?: boolean;
}

interface StudentResult {
    studentId: string;
    admissionNumber: string;
    studentName: string;
    fatherName: string;
    motherName: string;
    className: string;
    section: string;
    rollNumber: number | string;

    examTerm?: string;
    examLabel?: string;
    academicYear: string;

    totalMarksObtained: number;
    totalMaxMarks: number;
    percentage: number;
    overallGrade: string;

    subjectRows: SubjectMark[];

    // Optional fields if returned by your API
    cgpa?: number;
    division?: string;
    classRank?: number;
    status?: ExamStatus;
}

interface ResultsResponse {
    success?: boolean;
    message?: string;
    academicYear?: string;
    examTerm?: string;
    templateType?: string;
    reportCard?: StudentResult;
}

interface DropdownOption {
    label: string;
    value: string;
}

// --------------------------------------------------
// Main Exam Screen
// --------------------------------------------------

const ExamUI: React.FC = () => {
    const router = useRouter();
    const themeState = useContext(ThemeContext);
    const { userDetail } = useSelector(
        (state: RootState) => state.user
    );

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [resultsData, setResultsData] =
        useState<StudentResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const animationValue = useRef(new Animated.Value(0)).current;

    const [selectedExamTerm, setSelectedExamTerm] =
        useState('MID_TERM');

    const examTerms: DropdownOption[] = [
        { label: 'First Term', value: 'FIRST_TERM' },
        { label: 'Second Term', value: 'SECOND_TERM' },
        { label: 'Mid Term', value: 'MID_TERM' },
        { label: 'Final Term', value: 'FINAL_TERM' },
    ];

    const [selectedAcademicYear, setSelectedAcademicYear] =
        useState('2025-26');

    const academicYears: DropdownOption[] = React.useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years: DropdownOption[] = [];

        for (
            let year = currentYear - 2;
            year <= currentYear + 2;
            year++
        ) {
            years.push({
                label: `${year}-${String(year + 1).slice(-2)}`,
                value: `${year}-${String(year + 1).slice(-2)}`,
            });
        }

        return years;
    }, []);

    // --------------------------------------------------
    // Fetch Exam Results
    // --------------------------------------------------

    const fetchData = useCallback(
        async (
            term: string,
            year: string,
            isRefresh = false
        ) => {
            if (!userDetail?.id) {
                setResultsData(null);
                setError('Student information is unavailable.');
                return;
            }

            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError(null);

            try {
                const [
                    token,
                    encodedTenant,
                    deviceId,
                ] = await Promise.all([
                    AsyncStorage.getItem('auth_token'),
                    AsyncStorage.getItem('auth_tenant'),
                    getDeviceId(),
                ]);

                if (!token || !encodedTenant) {
                    throw new Error(
                        'Authentication credentials are missing.'
                    );
                }

                const tenantId = Buffer.from(
                    encodedTenant,
                    'base64'
                ).toString('utf-8');

                const response = await axios.get<ResultsResponse>(
                    `${API_BASE_URL}results/term/by-student-id`,
                    {
                        params: {
                            studentId: userDetail.id,
                            examTerm: term,
                            academicYear: year,
                        },
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'X-Tenant-ID': tenantId,
                            'X-Device-ID': deviceId,
                        },
                    }
                );

                const data = response.data;

                const reportCard = data?.reportCard;

                if (data?.success && reportCard) {
                    // IMPORTANT:
                    // Subjects are stored in subjectRows,
                    // not subjectMarks.
                    const normalizedResult: StudentResult = {
                        ...reportCard,
                        subjectRows: Array.isArray(
                            reportCard.subjectRows
                        )
                            ? reportCard.subjectRows
                            : [],
                    };

                    setResultsData(normalizedResult);
                    setError(null);

                    animationValue.setValue(0);

                    Animated.timing(animationValue, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }).start();
                } else {
                    setResultsData(null);
                    setError(null);

                    ToastService.show({
                        type: 'info',
                        message:
                            data?.message ||
                            'No results found for the selected exam term and academic year.',
                        duration: 3000,
                    });
                }
            } catch (err: unknown) {
                const errorMessage = axios.isAxiosError(err)
                    ? err.response?.data?.message ||
                      err.message ||
                      'Failed to fetch results.'
                    : err instanceof Error
                      ? err.message
                      : 'Failed to fetch results.';

                console.error(
                    'Error fetching exam results:',
                    errorMessage
                );

                setResultsData(null);
                setError(errorMessage);

                ToastService.show({
                    type: 'danger',
                    message: errorMessage,
                    duration: 3000,
                });
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [userDetail?.id, animationValue]
    );

    // --------------------------------------------------
    // Initial fetch and filter changes
    // --------------------------------------------------

    useEffect(() => {
        if (userDetail?.id) {
            fetchData(
                selectedExamTerm,
                selectedAcademicYear
            );
        }
    }, [
        userDetail?.id,
        selectedExamTerm,
        selectedAcademicYear,
        fetchData,
    ]);

    // --------------------------------------------------
    // Pull-to-refresh
    // --------------------------------------------------

    const onRefresh = useCallback(() => {
        fetchData(
            selectedExamTerm,
            selectedAcademicYear,
            true
        );
    }, [
        fetchData,
        selectedExamTerm,
        selectedAcademicYear,
    ]);

    // Keep hooks above this guard so their order stays stable.
    if (!themeState) {
        return null;
    }

    const { theme } = themeState;
    const styles = getStyles(theme);

    // --------------------------------------------------
    // Render Screen
    // --------------------------------------------------

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.push('/(tabs)/home')}
                    accessibilityLabel="Go back"
                >
                    <Ionicons
                        name="arrow-back"
                        size={26}
                        color={theme.text}
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Exam Results
                </Text>

                <TouchableOpacity
                    onPress={onRefresh}
                    disabled={loading || refreshing}
                    accessibilityLabel="Refresh results"
                >
                    <Ionicons
                        name="refresh"
                        size={24}
                        color={theme.text}
                        style={{
                            opacity:
                                loading || refreshing ? 0.5 : 1,
                        }}
                    />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <View style={styles.filterContainer}>
                <View style={styles.dropdownWrapper}>
                    <Dropdown
                        style={styles.dropdown}
                        containerStyle={styles.dropdownMenu}
                        data={examTerms}
                        labelField="label"
                        valueField="value"
                        value={selectedExamTerm}
                        placeholder="Select Term"
                        onChange={(item) => {
                            setSelectedExamTerm(item.value);
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

                <View style={styles.dropdownWrapper}>
                    <Dropdown
                        style={styles.dropdown}
                        containerStyle={styles.dropdownMenu}
                        data={academicYears}
                        labelField="label"
                        valueField="value"
                        value={selectedAcademicYear}
                        placeholder="Select Year"
                        onChange={(item) => {
                            setSelectedAcademicYear(item.value);
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

            {/* Results */}
            {loading ? (
                <View style={styles.loaderContainer}>
                    <Skeleton isDark={theme.mode === 'dark'} />
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Ionicons
                        name="alert-circle"
                        size={64}
                        color="#ef4444"
                    />

                    <Text style={styles.errorText}>
                        {error}
                    </Text>

                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={onRefresh}
                    >
                        <Ionicons
                            name="reload"
                            size={20}
                            color="#fff"
                        />
                        <Text style={styles.retryButtonText}>
                            Retry
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={resultsData ? [resultsData] : []}
                    keyExtractor={(item) =>
                        String(item.studentId)
                    }
                    renderItem={({ item }) => (
                        <Animated.View
                            style={{
                                opacity: animationValue,
                                transform: [
                                    {
                                        translateY:
                                            animationValue.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [12, 0],
                                            }),
                                    },
                                ],
                            }}
                        >
                            <ResultsContent
                                data={item}
                                styles={styles}
                            />
                        </Animated.View>
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.primary}
                        />
                    }
                    contentContainerStyle={
                        resultsData
                            ? styles.listContent
                            : styles.emptyListContent
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name="information-circle-outline"
                                size={64}
                                color="#9CA3AF"
                            />

                            <Text style={styles.emptyText}>
                                No results available
                            </Text>

                            <Text style={styles.emptySubtext}>
                                Select a different exam term or
                                academic year.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

// --------------------------------------------------
// Score Circle
// --------------------------------------------------

const ScoreCircle: React.FC<{
    percentage: number;
    status: ExamStatus;
    styles: ReturnType<typeof getStyles>;
}> = ({ percentage, status, styles }) => {
    const statusColor =
        status === 'PASS' ? '#10b981' : '#ef4444';

    return (
        <View style={styles.scoreCircleContainer}>
            <View
                style={[
                    styles.scoreCircle,
                    { borderColor: statusColor },
                ]}
            >
                <Text style={styles.scorePercentage}>
                    {Math.round(percentage)}%
                </Text>

                <Text
                    style={[
                        styles.scoreStatus,
                        { color: statusColor },
                    ]}
                >
                    {status}
                </Text>
            </View>
        </View>
    );
};

// --------------------------------------------------
// Subject Card
// --------------------------------------------------

const EnhancedSubjectCard: React.FC<{
    subject: SubjectMark;
    styles: ReturnType<typeof getStyles>;
}> = ({ subject, styles }) => {
    const marksObtained = Number(subject.scored ?? 0);
    const totalMarks = Number(subject.scoredMax ?? 0);

    const examMarks = Number(
        subject.mainExamMarks ?? marksObtained
    );

    const examMax = Number(
        subject.mainExamMax ?? totalMarks
    );

    const percentage =
        totalMarks > 0
            ? Math.min(
                  100,
                  Math.max(
                      0,
                      (marksObtained / totalMarks) * 100
                  )
              )
            : 0;

    const isPassed = subject.status === 'PASS';

    const statusColor = isPassed
        ? '#10b981'
        : subject.status === 'FAIL'
          ? '#ef4444'
          : '#9ca3af';

    return (
        <View style={styles.enhancedSubjectCard}>
            {/* Subject header */}
            <View style={styles.subjectCardHeader}>
                <View style={styles.subjectTitleSection}>
                    <Text style={styles.subjectCardTitle}>
                        {subject.subjectName || 'Unnamed Subject'}
                    </Text>

                    <Text style={styles.markLabel}>
                        Code: {subject.subjectCode || 'N/A'}
                    </Text>

                    {subject.optional ? (
                        <View style={styles.optionalBadge}>
                            <Text style={styles.optionalBadgeText}>
                                Optional
                            </Text>
                        </View>
                    ) : null}
                </View>

                <View
                    style={[
                        styles.statusBadge,
                        {
                            backgroundColor:
                                subject.status === 'PASS'
                                    ? '#ecfdf5'
                                    : subject.status === 'FAIL'
                                      ? '#fef2f2'
                                      : '#f3f4f6',
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.statusBadgeText,
                            { color: statusColor },
                        ]}
                    >
                        {subject.status || 'N/A'}
                    </Text>
                </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressBarFill,
                            {
                                width: `${percentage}%`,
                                backgroundColor: statusColor,
                            },
                        ]}
                    />
                </View>

                <Text style={styles.progressText}>
                    {percentage.toFixed(1)}%
                </Text>
            </View>

            {/* Marks grid */}
            <View style={styles.marksGrid}>
                <View style={styles.markItem}>
                    <Text style={styles.markLabel}>
                        Obtained
                    </Text>

                    <Text style={styles.markValue}>
                        {marksObtained}
                    </Text>
                </View>

                <View style={styles.markDivider} />

                <View style={styles.markItem}>
                    <Text style={styles.markLabel}>
                        Maximum
                    </Text>

                    <Text style={styles.markValue}>
                        {totalMarks}
                    </Text>
                </View>

                <View style={styles.markDivider} />

                <View style={styles.markItem}>
                    <Text style={styles.markLabel}>
                        Grade
                    </Text>

                    <Text style={styles.markValue}>
                        {subject.grade || 'N/A'}
                    </Text>
                </View>
            </View>

            {/* Exam details */}
            <View style={styles.examDetails}>
                <View style={styles.examDetailRow}>
                    <Ionicons
                        name="document-text-outline"
                        size={16}
                        color={styles.markLabel.color}
                    />

                    <Text style={styles.examDetailText}>
                        Exam: {subject.mainExamLabel || 'N/A'}
                    </Text>
                </View>

                <View style={styles.examDetailRow}>
                    <Ionicons
                        name="school-outline"
                        size={16}
                        color={styles.markLabel.color}
                    />

                    <Text style={styles.examDetailText}>
                        Exam Marks: {examMarks}/{examMax}
                    </Text>
                </View>
            </View>
        </View>
    );
};

// --------------------------------------------------
// Results Content
// --------------------------------------------------

const ResultsContent: React.FC<{
    data: StudentResult;
    styles: ReturnType<typeof getStyles>;
}> = ({ data, styles }) => {
    const themeState = useContext(ThemeContext);

    if (!themeState) {
        return null;
    }

    const subjects: SubjectMark[] = Array.isArray(
        data.subjectRows
    )
        ? data.subjectRows
        : [];

    const failedSubjects = subjects.filter(
        (subject) => subject.status === 'FAIL'
    ).length;

    const passedSubjects = subjects.filter(
        (subject) => subject.status === 'PASS'
    ).length;

    const percentage = Number(data.percentage) || 0;

    const overallStatus: ExamStatus =
        data.status === 'PASS' ||
        data.status === 'FAIL'
            ? data.status
            : failedSubjects > 0
              ? 'FAIL'
              : 'PASS';

    return (
        <View style={styles.contentContainer}>
            {/* Student information */}
            <View style={styles.studentInfoCard}>
                <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>
                        {data.studentName?.trim() || 'Student'}
                    </Text>

                    <Text style={styles.studentMetaText}>
                        Admission No: {data.admissionNumber || 'N/A'}
                    </Text>

                    <Text style={styles.studentMetaText}>
                        Father: {data.fatherName || 'N/A'}
                    </Text>

                    <Text style={styles.studentMetaText}>
                        Mother: {data.motherName || 'N/A'}
                    </Text>

                    <View style={styles.studentMeta}>
                        <Text style={styles.studentMetaText}>
                            Roll: {data.rollNumber ?? 'N/A'}
                        </Text>

                        <Text style={styles.studentMetaText}>
                            {' • '}
                        </Text>

                        <Text style={styles.studentMetaText}>
                            Class: {data.className || 'N/A'}
                            {data.section ? `-${data.section}` : ''}
                        </Text>
                    </View>

                    <Text style={styles.studentMetaText}>
                        Academic Year: {data.academicYear || 'N/A'}
                    </Text>

                    <Text style={styles.studentMetaText}>
                        Exam: {data.examLabel || data.examTerm || 'N/A'}
                    </Text>
                </View>
            </View>

            {/* Overall score */}
            <View style={styles.scoreCardContainer}>
                <View style={styles.scoreInfo}>
                    <ScoreCircle
                        percentage={percentage}
                        status={overallStatus}
                        styles={styles}
                    />

                    <View style={styles.scoreDetails}>
                        <Text style={styles.scoreLabel}>
                            Overall Score
                        </Text>

                        <Text style={styles.scoreMarks}>
                            {data.totalMarksObtained ?? 0}/
                            {data.totalMaxMarks ?? 0}
                        </Text>

                        <Text style={styles.scoreCGPA}>
                            Grade: {data.overallGrade || 'N/A'}
                        </Text>

                        <Text style={styles.scoreCGPA}>
                            Percentage: {percentage.toFixed(2)}%
                        </Text>

                        {data.cgpa != null ? (
                            <Text style={styles.scoreCGPA}>
                                CGPA: {Number(data.cgpa).toFixed(2)}
                            </Text>
                        ) : null}

                        {data.division ? (
                            <Text style={styles.scoreCGPA}>
                                Division: {data.division}
                            </Text>
                        ) : null}

                        {data.classRank != null ? (
                            <Text style={styles.scoreCGPA}>
                                Class Rank: {data.classRank}
                            </Text>
                        ) : null}

                        <Text style={styles.scoreCGPA}>
                            Passed Subjects: {passedSubjects}
                        </Text>

                        <Text style={styles.scoreCGPA}>
                            Failed Subjects: {failedSubjects}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Subject results */}
            <View style={styles.subjectsSection}>
                <Text style={styles.sectionTitle}>
                    Subject Performance ({subjects.length})
                </Text>

                {subjects.length > 0 ? (
                    subjects.map((subject, index) => (
                        <EnhancedSubjectCard
                            key={`${subject.subjectCode || 'subject'}-${index}`}
                            subject={subject}
                            styles={styles}
                        />
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="book-outline"
                            size={48}
                            color="#9CA3AF"
                        />

                        <Text style={styles.emptyText}>
                            No subject results found
                        </Text>

                        <Text style={styles.emptySubtext}>
                            The API returned no subjects for this exam.
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export default ExamUI;

// --------------------------------------------------
// Styles
// --------------------------------------------------

const getStyles = (theme: Theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },

        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            paddingTop:
                Platform.OS === 'android' ? 50 : 16,
            backgroundColor: theme.background,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 6,
        },

        headerTitle: {
            fontSize: 22,
            fontWeight: '700',
            color: theme.text,
            letterSpacing: 0.5,
        },

        filterContainer: {
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 12,
            paddingVertical: 12,
            backgroundColor: theme.background,
        },

        dropdownWrapper: {
            flex: 1,
            marginHorizontal: 3,
        },

        dropdown: {
            height: 50,
            borderWidth: 1,
            borderColor: theme.border || '#D1D5DB',
            borderRadius: 12,
            paddingHorizontal: 12,
            backgroundColor: theme.cardBackground,
        },

        dropdownMenu: {
            backgroundColor: theme.cardBackground,
            borderRadius: 12,
            borderColor: theme.border,
        },

        loaderContainer: {
            flex: 1,
            padding: 16,
        },

        centerContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
            minHeight: 300,
        },

        errorText: {
            marginTop: 12,
            fontSize: 15,
            color: '#ef4444',
            textAlign: 'center',
        },

        retryButton: {
            marginTop: 24,
            flexDirection: 'row',
            backgroundColor: '#6366f1',
            paddingVertical: 12,
            paddingHorizontal: 28,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
        },

        retryButtonText: {
            color: '#fff',
            fontSize: 15,
            fontWeight: '700',
            marginLeft: 8,
        },

        listContent: {
            paddingBottom: 24,
        },

        emptyListContent: {
            flexGrow: 1,
            justifyContent: 'center',
        },

        emptyContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 50,
            paddingHorizontal: 20,
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

        contentContainer: {
            padding: 16,
            paddingBottom: 24,
        },

        studentInfoCard: {
            backgroundColor: theme.cardBackground,
            borderRadius: 14,
            padding: 14,
            marginBottom: 14,
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
            gap: 5,
        },

        studentName: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 4,
        },

        studentMeta: {
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
        },

        studentMetaText: {
            fontSize: 12,
            color: theme.textSecondary,
        },

        scoreCardContainer: {
            backgroundColor: theme.cardBackground,
            borderRadius: 16,
            padding: 14,
            marginBottom: 18,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
        },

        scoreInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
        },

        scoreCircleContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 18,
        },

        scoreCircle: {
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 3,
            backgroundColor: theme.primary,
            justifyContent: 'center',
            alignItems: 'center',
        },

        scorePercentage: {
            fontSize: 29,
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
            fontSize: 20,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 4,
        },

        scoreCGPA: {
            fontSize: 13,
            color: theme.primary,
            fontWeight: '600',
            marginTop: 3,
        },

        subjectsSection: {
            marginTop: 0,
        },

        sectionTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 14,
        },

        enhancedSubjectCard: {
            backgroundColor: theme.cardBackground,
            borderRadius: 14,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: theme.border || '#E5E7EB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
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
            fontSize: 16,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 6,
        },

        statusBadge: {
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            minWidth: 65,
            alignItems: 'center',
        },

        statusBadgeText: {
            fontSize: 11,
            fontWeight: '700',
        },

        optionalBadge: {
            backgroundColor: '#fef3c7',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            alignSelf: 'flex-start',
            marginTop: 5,
        },

        optionalBadgeText: {
            fontSize: 11,
            color: '#92400e',
            fontWeight: '700',
        },

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
            minWidth: 45,
            textAlign: 'right',
        },

        marksGrid: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: theme.border || '#E5E7EB',
            marginBottom: 12,
        },

        markItem: {
            flex: 1,
            alignItems: 'center',
        },

        markDivider: {
            width: 1,
            height: 34,
            backgroundColor: theme.border || '#E5E7EB',
        },

        markLabel: {
            fontSize: 11,
            color: theme.textSecondary,
            fontWeight: '600',
            marginBottom: 5,
        },

        markValue: {
            fontSize: 14,
            fontWeight: '700',
            color: theme.text,
        },

        examDetails: {
            gap: 8,
        },

        examDetailRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },

        examDetailText: {
            fontSize: 12,
            color: theme.textSecondary,
            fontWeight: '500',
        },
    });
