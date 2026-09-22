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
];

export const TIMER_FOR_BANNER = 1000 * 30;

export const MAX_RETRIES_FOR_DASHBOARD_CLASSES = 5;