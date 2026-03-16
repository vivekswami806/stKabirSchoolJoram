export type LeaveStatus = "Approved" | "Cancelled" | "Waiting";
export type RoleMode = "PARENT" | "STAFF";

export interface LeaveRequest {
  id: string;
  date: string;
  month: string;
  type: string;
  duration: string;
  status: LeaveStatus;
  personName: string;
  personCode: string;
  remarks: string;
  reason:string;
  rollNumber:string
}

export interface SectionData {
  title: string;
  data: LeaveRequest[];
}

export interface ParentLeaveApi {
  leaveId: string;
  fromDate: string;
  toDate: string;
  leaveType: string;
  totalDays: number;
  status: "APPROVED" | "REJECTED" | "PENDING";
  studentName: string;
  studentUsername: string;
  remarks?: string;
  reason?: string;
}

export interface StaffLeaveApi {
  leaveId: string;
  fromDate: string;
  toDate: string;
  leaveType: string;
  totalDays: number;
  status: "APPROVED" | "REJECTED" | "PENDING";
  staffName: string;
  staffId: string;
  staffCode?: string;
  remarks?: string;
  reason?: string;
}

export interface StaffLeaveResponse {
  data: StaffLeaveApi[];
}
