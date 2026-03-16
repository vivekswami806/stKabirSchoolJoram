import { RootState } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { API_BASE_URL, MAX_RETRIES_FOR_DASHBOARD_CLASSES } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text } from "react-native";
import { useSelector } from "react-redux";
import LectureCard from "./LectureCard";
import LectureSkeleton from "./LectureSkeleton";

type Lecture = {
  id: number;
  dayOfWeek: string;
  periodName: string;
  periodNumber: number;
  subjectName: string;
  Name  : string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  sessionTypeDisplay: string;
  sessionType: string;
};


const convertTo24Hour = (time: string, sessionType: string) => {
  const m = moment(time, "hh:mm");

  if (sessionType === "AFTERNOON" && m.hour() < 12) {
    m.add(12, "hours");
  }

  return m;
};

const isCurrentLecture = (lecture: Lecture) => {
  if (!lecture.startTime || !lecture.endTime) return false;

  const now = moment();
  const today = now.format("YYYY-MM-DD");

  const start = convertTo24Hour(lecture.startTime, lecture.sessionType)
    .set({ year: now.year(), month: now.month(), date: now.date() });

  const end = convertTo24Hour(lecture.endTime, lecture.sessionType)
    .set({ year: now.year(), month: now.month(), date: now.date() });

  return now.isBetween(start, end, undefined, "[]");
};




export default function TodayLectures() {

  const { userDetail } = useSelector((state: RootState) => state.user);
  const themeState = useContext(ThemeContext);

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
   const MAX_RETRIES = MAX_RETRIES_FOR_DASHBOARD_CLASSES ;
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);

  const fetchTimeTable = async (userDetail :any): Promise<Lecture[]> => {
  
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const role = await AsyncStorage.getItem("auth_role");
      const userID = await AsyncStorage.getItem("auth_login_id");
  
      if (!token || !encodedTenant) throw new Error("Auth missing");
      
      const url =
      role === "PARENT"
      ? `${API_BASE_URL}v2/timetable/getTimeTableWithClassAndSection?className=${userDetail.studentClass}&section=${userDetail.classSection}`
      : `${API_BASE_URL}v2/timetable/getTeacherByIdTimeTable?teacherId=${userID}`;
      
      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
  
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
          "X-Device-ID": await getDeviceId(),
        },
      });
      
      const mappedData: Lecture[] = response.data.map(
        (item: any, index: number) => ({
          id: item.periodNumber ?? index,
          dayOfWeek: item.dayOfWeek,
          periodName: item.periodName,
          periodNumber: item.periodNumber,
          subjectName: item.subjectName,
          Name: item.staffName,
          startTime: item.startTime,
          endTime: item.endTime,
          isBreak: item.isBreak,
          sessionTypeDisplay: item.sessionTypeDisplay,
          sessionType:item.sessionType
        })
      );
  
      return mappedData;
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
    
        setTimeout(() => {
          fetchTimeTable(userDetail);
        }, 5000);
      }
    
      return [];
    }
  };
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchTimeTable(userDetail);
        if (mounted) setLectures(data);
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <FlatList
        data={[1, 2, 3]}
        horizontal
        renderItem={() => <LectureSkeleton />}
        keyExtractor={(item) => String(item)}
      />
    );
  }

  if (error) return <Text style={styles.errorText}>Unable to load timetable</Text>;
  if (lectures.length === 0) return <Text style={styles.emptyText}>No classes today 🎉</Text>;

  return (
    <FlatList
      data={lectures}
      horizontal
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <LectureCard
        {...item}
        isCurrent={isCurrentLecture(item)}        />
      )}
      showsHorizontalScrollIndicator={false}
    />
  );
}

function getStyles(theme: Theme) {
  let isDark = theme.mode === "dark";
 const styles = StyleSheet.create({
  errorText: { color: "red", padding: 12 },
  emptyText: { padding: 12, color: "#6B7280" },
});
return styles
}
