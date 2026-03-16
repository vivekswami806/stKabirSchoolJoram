export interface Student {
    id: string;
    name: string;
    avatar: string;
    studentClass: string; // Added Class
    isPresent: boolean;
  }


  export const initAttendanceDB = () => {};
  export const getStudentsByClass = () => {};
  export const markLocalAttendance = () => {};
  export const seedDatabaseFromDummy = () => {};
export const ensureClassDataExists =  () => {};
export const getPendingAttendance = () => {};
export const markAsSynced = () => {};
export const deleteOldSyncedAttendance = () => {}




