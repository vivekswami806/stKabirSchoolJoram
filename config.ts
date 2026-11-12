export const API_BASE_URL = "https://sukedu.cloud/api/";

import { Platform } from "react-native";

export const API_CHAT_URL =
  Platform.OS === "android"
    ? "http://10.207.101.254:5000"
    : "http://localhost:5000";
// export const API_CHAT_URL = "http://192.168.1.93:"

export const classes = [
  // { label: "Class Pnc", value: "pnc" },
  { label: "Class Nur", value: "nur" },
  { label: "Class LKG", value: "lkg" },
  { label: "Class UKG", value: "ukg" },
  { label: "Class 1", value: "1" },
  { label: "Class 2", value: "2" },
  { label: "Class 3", value: "3" },
  { label: "Class 4", value: "4" },
  { label: "Class 5", value: "5" },
  { label: "Class 6", value: "6" },
  { label: "Class 7", value: "7" },
  { label: "Class 8", value: "8" },
  { label: "Class 9", value: "9" },
  { label: "Class 10", value: "10" },
];

export const sections = [
  { label: "Section A", value: "A" },
  { label: "Section B", value: "B" },
  { label: "Section C", value: "C" },
  { label: "Section D", value: "D" },
];

export const genders = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
];

export const months = [
  { label: "January", shortLabel: "Jan", value: 1 },
  { label: "February", shortLabel: "Feb", value: 2 },
  { label: "March", shortLabel: "Mar", value: 3 },
  { label: "April", shortLabel: "Apr", value: 4 },
  { label: "May", shortLabel: "May", value: 5 },
  { label: "June", shortLabel: "Jun", value: 6 },
  { label: "July", shortLabel: "Jul", value: 7 },
  { label: "August", shortLabel: "Aug", value: 8 },
  { label: "September", shortLabel: "Sep", value: 9 },
  { label: "October", shortLabel: "Oct", value: 10 },
  { label: "November", shortLabel: "Nov", value: 11 },
  { label: "December", shortLabel: "Dec", value: 12 },
];

// Helper function to get class label from value
export const getClassLabel = (classValue: string | null): string => {
  if (!classValue) return "All Classes";
  const found = classes.find(c => c.value === classValue);
  return found?.label || classValue;
};

// Helper function to get section label from value
export const getSectionLabel = (sectionValue: string | null): string => {
  if (!sectionValue) return "All Sections";
  const found = sections.find(s => s.value === sectionValue);
  return found?.label || sectionValue;
};

// Helper function to get gender label from value
export const getGenderLabel = (genderValue: string | null): string => {
  if (!genderValue) return "All Genders";
  const found = genders.find(g => g.value === genderValue);
  return found?.label || genderValue;
};

// Helper function to get month label from value
export const getMonthLabel = (monthValue: number, full: boolean = false): string => {
  const found = months.find(m => m.value === monthValue);
  return full ? found?.label || "" : found?.shortLabel || "";
};

// Get all class values for API queries
export const getClassValues = (): string[] => {
  return classes.map(c => c.value);
};

// Get all section values for API queries
export const getSectionValues = (): string[] => {
  return sections.map(s => s.value);
};

// Get all gender values for API queries
export const getGenderValues = (): string[] => {
  return genders.map(g => g.value);
};

export const TIMER_FOR_BANNER = 1000 * 5;

export const MAX_RETRIES_FOR_DASHBOARD_CLASSES = 5;