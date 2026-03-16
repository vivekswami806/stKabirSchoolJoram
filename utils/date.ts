import { WeekDay } from "@/types/timetabletype";
export const getTodayWeekDay = (): WeekDay => {
  const map: Record<number, WeekDay> = {
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
    6: "SATURDAY",
  };

  const jsDay = new Date().getDay(); // 0 = Sunday
  return map[jsDay] ?? "MONDAY";
};
