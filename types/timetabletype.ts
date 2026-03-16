export type WeekDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

export interface BackendPeriod {
  id: number;
  startTime: string;
  endTime: string;
  periodName: string;
  displayOrder: number;
  isBreak: boolean;
}

export interface BackendSubject {
  subjectName: string;
  subjectCode: string;
}

export interface BackendClassSection {
  classCode: string;
  studentCount: number;
}

export interface BackendRoom {
  roomNumber: string;
  building: string;
}

export interface BackendTeacher {
  name: string;
  staffId: string;
}

export interface BackendTimeTableItem {
  id: number;
  isActive: boolean;
  isSubstitution: boolean;
  dayOfWeek: WeekDay;
  effectiveDate: string;
  notes?: string;

  period: BackendPeriod;
  subject: BackendSubject;
  classSection: BackendClassSection;
  room: BackendRoom;
  teacher: BackendTeacher;
}

export interface TimetableItem {
  id: number;
  startTime: string;
  endTime: string;
  timeRange: string;
  subject: string;
  subjectCode: string;
  className: string;
  room: string;
  teacher: string;
  notes?: string;
  dayOfWeek: WeekDay;
  isBreak: boolean;
  rawStartTime: string;
  rawEndTime: string;
  effectiveDate: string;
}
