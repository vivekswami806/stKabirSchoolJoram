/**
 * TypeScript Type Definitions for Exam Module
 * Ensure type safety and better IDE autocomplete
 */

// ============================================================================
// API Response Types
// ============================================================================

export interface SubjectMarks {
    subjectName: string;
    subjectCode: string;
    marksObtained: number;
    totalMarks: number;
    passingMarks: number;
    status: 'PASS' | 'FAIL';
    examTerm: string;
    optional: boolean;
  }
  
  export interface StudentResult {
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
    subjectMarks: SubjectMarks[];
  }
  
  export interface ResultsResponse {
    results: StudentResult[];
  }
  
  export interface ExamScheduleItem {
    id: string;
    title: string;
    className: string;
    section: string;
    examTerm: string;
    startDate: string;
    endDate: string;
    totalMarks: number;
    passingMarks: number;
    subjects: string[];
  }
  
  // ============================================================================
  // Component Props Types
  // ============================================================================
  
  export interface ExamCardProps {
    exam: ScheduleData;
    styles: any;
  }
  
  export interface SubjectCardProps {
    subject: SubjectMarks;
    styles: any;
  }
  
  export interface ResultCardProps {
    title: string;
    score: number;
    maxScore: number;
    percentage: number;
  }
  
  export interface StatCardProps {
    icon: string;
    label: string;
    value: string;
    color: string;
    styles: any;
  }
  
  export interface InfoItemProps {
    icon: string;
    label: string;
    value?: string;
    styles: any;
  }
  
  export interface SummaryCardProps {
    label: string;
    value: string;
    unit: string;
    color: string;
    styles: any;
  }
  
  export interface InfoBoxProps {
    icon: string;
    label: string;
    value: string;
    styles: any;
  }
  
  // ============================================================================
  // Custom Hook Return Types
  // ============================================================================
  
  export interface UseClassResultsReturn {
    data: ResultsResponse | null;
    loading: boolean;
    error: string | null;
    refreshing: boolean;
    refetch: () => Promise<void>;
    clearCache: () => void;
  }
  
  export interface UseStudentResultsReturn {
    data: StudentResult | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
  }
  
  export interface AnalyticsData {
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passCount: number;
    failCount: number;
    classRanking: { studentId: string; rank: number }[];
    subjectAverages: { subject: string; average: number }[];
    performanceTrend: { exam: string; percentage: number }[];
  }
  
  export interface ScheduleData {
    id: string;
    subjectName: string;
    date: string;
    time: string;
    totalMarks: number;
    passingMarks: number;
  }
  
  export interface PerformanceComparison {
    studentPercentage: number;
    classAverage: number;
    difference: number;
    isAboveAverage: boolean;
    percentile: number;
  }
  
  export interface UseDebouncedApiCallReturn<R> {
    debouncedCall: (arg: any) => void;
    loading: boolean;
    error: string | null;
    result: R | null;
  }
  
  // ============================================================================
  // Theme Types
  // ============================================================================
  
   interface Theme {
    mode: 'light' | 'dark';
    colors?: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
      border: string;
      success: string;
      error: string;
      warning: string;
      info: string;
    };
  }
  
   interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
  }
  
  // ============================================================================
  // Toast Notification Types
  // ============================================================================
  
  export type ToastType = 'success' | 'error' | 'warning' | 'info';
  
  export interface ToastOptions {
    type: ToastType;
    message: string;
    duration?: number;
    action?: {
      label: string;
      onPress: () => void;
    };
    contentContainerStyle?: any;
  }
  
  export interface ToastService {
    show: (options: ToastOptions) => void;
    hide: () => void;
    hideAll: () => void;
  }
  
  // ============================================================================
  // API Service Types
  // ============================================================================
  
  export interface AuthHeaders {
    Authorization: string;
    'X-Tenant-ID': string;
    'X-Device-ID': string;
  }
  
  export interface ApiError {
    response?: {
      status: number;
      statusText: string;
      data: {
        message: string;
        code?: string;
      };
    };
    message: string;
    code?: string;
  }
  
  export interface ApiServiceConfig {
    baseURL: string;
    timeout: number;
    retryAttempts?: number;
    retryDelay?: number;
  }
  
  // ============================================================================
  // Cache Types
  // ============================================================================
  
  export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresIn: number;
  }
  
  export interface ICacheService {
    set<T>(key: string, data: T, expiresIn?: number): void;
    get<T>(key: string): T | null;
    clear(key?: string): void;
    setDuration(duration: number): void;
  }
  
  // ============================================================================
  // Screen Component Props Types
  // ============================================================================
  
  export interface ExamUIProps {
    initialTab?: 'schedule' | 'results' | 'analytics';
    className?: string;
    section?: string;
    academicYear?: string;
  }
  
  export interface ExamAnalyticsProps {
    className?: string;
    section?: string;
    academicYear?: string;
  }
  
  export interface ExamDetailsProps {
    className?: string;
    section?: string;
  }
  
  // ============================================================================
  // Tab Navigation Types
  // ============================================================================
  
  export interface TabOption {
    id: 'schedule' | 'results' | 'analytics';
    label: string;
    icon: string;
  }
  
  export interface TabContent {
    tab: TabOption;
    component: React.ReactNode;
  }
  
  // ============================================================================
  // Filter and Sort Types
  // ============================================================================
  
  export type SortField = 'name' | 'percentage' | 'rank' | 'cgpa';
  export type SortOrder = 'asc' | 'desc';
  
  export interface FilterOptions {
    minPercentage?: number;
    maxPercentage?: number;
    status?: 'PASS' | 'FAIL';
    division?: string;
    subject?: string;
  }
  
  export interface SortOptions {
    field: SortField;
    order: SortOrder;
  }
  
  // ============================================================================
  // Utility Types
  // ============================================================================
  
  export type Nullable<T> = T | null | undefined;
  
  export type AsyncState<T> = {
    data: Nullable<T>;
    loading: boolean;
    error: Nullable<string>;
  };
  
  export type StylesObject = {
    [key: string]: any;
  };
  
  // ============================================================================
  // Navigation Types
  // ============================================================================
  
  export type ExamScreenParams = {
    'exam-home': {
      className?: string;
      section?: string;
      academicYear?: string;
    };
    'exam-analytics': {
      className?: string;
      section?: string;
    };
    'exam-details': {
      className?: string;
      section?: string;
    };
  };
  
  // ============================================================================
  // Storage Types
  // ============================================================================
  
  export interface StorageCredentials {
    token: string;
    tenant: string;
    deviceId: string;
  }
  
  export interface StorageData {
    authCredentials?: StorageCredentials;
    userPreferences?: {
      theme: 'light' | 'dark';
      language?: string;
      notifications?: boolean;
    };
    cachedData?: {
      classResults?: ResultsResponse;
      studentResults?: StudentResult;
      examSchedule?: ExamScheduleItem[];
    };
  }
  
  // ============================================================================
  // Event Handler Types
  // ============================================================================
  
  export type TabPressHandler = (tab: TabOption) => void;
  export type RefreshHandler = () => Promise<void>;
  export type ErrorRetryHandler = () => void;
  export type ExamSelectHandler = (examId: string) => void;
  export type SubjectSelectHandler = (subjectCode: string) => void;
  
  // ============================================================================
  // Enum Types
  // ============================================================================
  
  export enum ExamStatus {
    PASS = 'PASS',
    FAIL = 'FAIL',
  }
  
  export enum ExamTerm {
    FIRST_TERM = 'FIRST_TERM',
    SECOND_TERM = 'SECOND_TERM',
    ANNUAL = 'ANNUAL',
  }
  
  export enum Division {
    FIRST = 'FIRST',
    SECOND = 'SECOND',
    THIRD = 'THIRD',
  }
  
  export enum ToastTypeEnum {
    SUCCESS = 'success',
    ERROR = 'error',
    WARNING = 'warning',
    INFO = 'info',
  }
  
  // ============================================================================
  // Generic Response Types
  // ============================================================================
  
  export interface ApiResponse<T> {
    status: number;
    data: T;
    message: string;
    timestamp: string;
  }
  
  export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
  
  export interface ErrorResponse {
    status: number;
    message: string;
    code: string;
    details?: Record<string, any>;
  }
  
  // ============================================================================
  // Export all types
  // ============================================================================
  
  export type {
    ExamScheduleItem as IExamScheduleItem, ResultsResponse as IResultsResponse, StudentResult as IStudentResult, SubjectMarks as ISubjectMarks
};
