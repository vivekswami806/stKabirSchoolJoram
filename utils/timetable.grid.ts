import { TimetableItem, WeekDay } from "@/types/timetabletype";


export const groupByDay = (
  data: TimetableItem[]
): Record<WeekDay, TimetableItem[]> => {
  return data.reduce((acc, item) => {
    acc[item.dayOfWeek] ||= [];
    acc[item.dayOfWeek].push(item);
    return acc;
  }, {} as Record<WeekDay, TimetableItem[]>);
};
