import { LeaveMode, LeaveStatus } from "@/types/leave";

export const mapStatus = (status: string): LeaveStatus => {
  switch (status) {
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Cancelled";
    default:
      return "Waiting";
  }
};

export const mapUIStatusToBackend = (status: LeaveStatus) => {
  switch (status) {
    case "Approved":
      return "APPROVED";
    case "Cancelled":
      return "REJECTED";
    default:
      return "PENDING";
  }
};

export const getPersonLabel = (mode: LeaveMode) =>
  mode === "PARENT" ? "Student" : "Staff";

export const getPersonCodeLabel = (mode: LeaveMode) =>
  mode === "PARENT" ? "Roll" : "ID";

export function getStatusColor(status: LeaveStatus, isDark: boolean) {
    switch (status) {
      case "Approved":
        return {
          bg: isDark ? "#064E3B" : "#D1FAE5",
          text: isDark ? "#6EE7B7" : "#065F46",
        };
      case "Cancelled":
        return {
          bg: isDark ? "#7F1D1D" : "#FEE2E2",
          text: isDark ? "#FCA5A5" : "#991B1B",
        };
      default: // Waiting
        return {
          bg: isDark ? "#1E3A8A" : "#DBEAFE",
          text: isDark ? "#93C5FD" : "#1D4ED8",
        };
    }
  }
