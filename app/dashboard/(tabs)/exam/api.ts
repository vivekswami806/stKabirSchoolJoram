interface AuthHeaders {
  Authorization: string;
  'X-Tenant-ID': string;
  'X-Device-ID': string;
}

interface SubjectMarks {
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

//     try {
//       const [token, encodedTenant] = await Promise.all([
//         AsyncStorage.getItem('auth_token'),
//         AsyncStorage.getItem('auth_tenant'),
//       ]);

//       if (!token || !encodedTenant) {
//         throw new Error('Authentication credentials missing');
//       }

//       const deviceId = await getDeviceId();
//       const tenantId = Buffer.from(encodedTenant, 'base64').toString('utf-8');
//     } catch (error) {
//       console.error('Auth initialization error:', error);
//       throw error;
//     }
//   }

//   async getClassResults(
//     className: string,
//     section: string,
//     examTerm: string,
//     academicYear: string
//   ): Promise<ResultsResponse> {
//     try {


//       const response = await axios.get("http://localhost:8080/api/results/V2/class?className=1&section=A&examTerm=FIRST _TERM&academicYear=2025-26) ")(
//         `/results/V2/class`,
//         {
//           params: {
//             className,
//             section,
//             examTerm: examTerm.toUpperCase(),
//             academicYear,
//           },
//         }
//       );
// console.log("res| /results/V2/class|", response);

//       return response.data;
//     } catch (error) {
//       console.error('Error fetching class results:', error);
//       throw error;
//     }
//   }

//   async getStudentResults(
//     studentId: string,
//     academicYear: string
//   ): Promise<StudentResult> {
//     try {
//       if (!this.authHeaders) {
//         await this.initializeAuth();
//       }

//       const response = await this.axiosInstance.get<StudentResult>(
//         `/results/V2/student/${studentId}`,
//         {
//           params: { academicYear },
//         }
//       );

//       return response.data;
//     } catch (error) {
//       console.error('Error fetching student results:', error);
//       throw error;
//     }
//   }

//   async getExamSchedule(
//     className: string,
//     section: string,
//     academicYear: string
//   ): Promise<ExamScheduleItem[]> {
//     try {
//       if (!this.authHeaders) {
//         await this.initializeAuth();
//       }

//       const response = await this.axiosInstance.get<{ schedules: ExamScheduleItem[] }>(
//         `/exams/schedule`,
//         {
//           params: {
//             className,
//             section,
//             academicYear,
//           },

//         }
//       );

//       return response.data.schedules;
//     } catch (error) {
//       console.error('Error fetching exam schedule:', error);
//       throw error;
//     }
