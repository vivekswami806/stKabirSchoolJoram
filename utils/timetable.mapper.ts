import { BackendTimeTableItem, TimetableItem } from "@/types/timetabletype";


export const formatTime = (time: string): string => {
  const [h, m] = time.split(":");
  const hour = Number(h);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${period}`;
};

export const mapTimetableItem = (
  item: BackendTimeTableItem
): TimetableItem => {
  const start = formatTime(item.period.startTime);
  const end = formatTime(item.period.endTime);

  return {
    id: item.id,
    startTime: start,
    endTime: end,
    timeRange: `${start} - ${end}`,
    subject: item.subject.subjectName,
    subjectCode: item.subject.subjectCode,
    className: item.classSection.classCode,
    room: item.room?.roomNumber ? `${item.room?.roomNumber} (${item.room?.building.trim()})` : "No Room ",
    teacher: item.teacher.name,
    notes: item.notes,
    dayOfWeek: item.dayOfWeek,
    isBreak: item.period.isBreak,
    rawStartTime: item.period.startTime,
    rawEndTime: item.period.endTime,
    effectiveDate: item.effectiveDate,
  };
};
