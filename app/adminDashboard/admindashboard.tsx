import { ThemeContext } from '@/action/theme/ThemeContext';
import { Theme } from '@/action/theme/themeReducer';
import { BannerImage } from '@/components/BannerHeaderComponents';
import TodayLectures from '@/components/TodayLectures';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Profile from '../dashboard/HeaderBar';

export default function AdminDashboard() {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);
  const menuItems = [
    { icon: '🗓️', label: 'Attendance', color: '#3B82F6', bg: '#EFF6FF', route: '/adminDashboard/(tabs)/attendance/attendance' },
    { icon: '👩‍🏫', label: 'Teachers Info', color: '#A855F7', bg: '#FAF5FF', route: '/adminDashboard/(tabs)/teacherinfo/mainscreen' },
    { icon: '🏖️', label: 'Leave', color: '#10B981', bg: '#F0FDF4', route: '/adminDashboard/(tabs)/leave/TeacherLeaveApprovalScreen' },
    { icon: '🕒', label: 'Time Table', color: '#6366F1', bg: '#EEF2FF', route: '/staffDashboard/(tabs)/timetable/timetable' },
    { icon: '📚', label: 'Home Work', color: '#EAB308', bg: '#FEFCE8', route: '/staffDashboard/(tabs)/homework/homework' },
    { icon: '👨‍🎓', label: 'Students Info', color: '#EC4899', bg: '#FDF2F8', route: '/adminDashboard/(tabs)/InfoStudent/parentscreen' },
    { icon: '💬', label: 'Message', color: '#14B8A6', bg: '#F0FDFA', route: '/(tabs)/messages' },
    { icon: '📢', label: 'Notice', color: '#22C55E', bg: '#F0FDF4', route: '/dashboard/(tabs)/notice' },
  ];


  const lectures = [
    { subject: 'Maths Lecture in 7th B', time: '10:30 To 11:30 AM' },
    { subject: 'Math', time: '10:30 To 11:30 AM' },
  ];

  const handleMenuPress = (route: any) => {

    router.push(route);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Banner Card */}
      <Profile />
      <View style={styles.bannerCard}>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Check New Student</Text>
          <Text style={styles.bannerTitle}>Entry In Your Class</Text>
          <TouchableOpacity style={styles.bannerButton} onPress={() => { router.replace('/adminDashboard/(tabs)/InfoStudent/parentscreen') }}>
            <Text style={styles.bannerButtonText}>Check Now</Text>
          </TouchableOpacity>
        </View>
        <BannerImage />
      </View>
      {/* <BannerHeaderCompSchool/> */}

      {/* Menu Grid */}
      <View style={styles.menuGrid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label} // safer than index
            style={styles.menuItem}
            onPress={() => handleMenuPress(item.route)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
              <Text style={{ fontSize: 28 }}>{item.icon}</Text>
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Today Lectures Section */}
      <View style={styles.eventsSection}>
        <View style={styles.lecturesHeader}>
          <Text style={styles.lecturesTitle}>Today Lectures</Text>
          <TouchableOpacity onPress={() => { router.replace('/staffDashboard/(tabs)/timetable/timetable') }}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>
        <TodayLectures />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.lecturesScroll}
        >
          {/* {lectures.map((lecture, index) => (
            <View key={index} style={styles.lectureCard}>
              <Text style={styles.lectureSubject}>{lecture.subject}</Text>

              <View style={styles.lectureFooter}>
                <View style={styles.timePill}>
                  <Ionicons name="time-outline" size={20} color="#000" />
                  <Text style={styles.lectureTime}>{lecture.time}</Text>
                </View>
              </View>
            </View>
          ))}*/}
        </ScrollView>
      </View>
    </ScrollView>
  );
}


function getStyles(theme: Theme) {
  let isDark = theme.mode === "dark";
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      //  paddingTop: Platform.OS === 'ios' ? 60 : 50,
    },
    viewAll: {
      fontSize: 14,
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: !isDark
        ? '#000104'
        : '#E9EFFC',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 20,
      shadowColor: isDark
        ? '#000104'
        : '#E9EFFC',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
    },
    bannerCard: {
      flexDirection: 'row',
      backgroundColor: '#FED7AA',
      // ? '#000104' 
      // :  '#FED7AA',
      marginHorizontal: 20,
      marginBottom: 24,
      borderRadius: 16,
      padding: 20,
      justifyContent: 'space-between',
      alignItems: 'center',
      overflow: 'hidden',
    },
    bannerContent: {
      flex: 1,
      justifyContent: 'center',
    },
    bannerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark
        ? '#000104'
        : '#000104',
      marginBottom: 4,
    },
    bannerButton: {
      backgroundColor: isDark
        ? '#000104'
        : '#E9EFFC',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 12,
      alignSelf: 'flex-start',
    },
    bannerButtonText: {
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
      fontSize: 14,
      fontWeight: '600',
    },
    bannerImageContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
    },
    placeholderImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: !isDark
        ? '#000104'
        : '#E9EFFC',
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: 40,
    },
    menuGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    menuItem: {
      width: '25%',
      alignItems: 'center',
      marginBottom: 24,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    menuLabel: {
      fontSize: 12,
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
      textAlign: 'center',
      fontWeight: '500',
    },
    lecturesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      alignItems: 'center',
      marginBottom: 16,
    },
    lecturesTitle: {
      fontSize: 18,
      fontWeight: '700',

      color: !isDark
        ? '#000104'
        : '#E9EFFC',
    },
    viewAllText: {
      fontSize: 14,
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
      fontWeight: '500',
    },
    lectureCard: {
      backgroundColor: !isDark ? '#F4F6FB' : '#020202',
      borderRadius: 14,
      padding: 16,
      marginRight: 14,
      width: 150,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },

    lectureSubject: {
      fontSize: 16,
      fontWeight: '600',
      color: !isDark ? '#000104' : '#FFFFFF',
      marginBottom: 14,
      // lineHeight: 10,
      height: 70
    },

    lectureFooter: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },

    timePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: !isDark ? '#E6E9F0' : '#2E2E2E',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },

    lectureTime: {
      fontSize: 12,
      color: isDark ? '#E6E9F0' : '#2E2E2E',
      marginLeft: 6,
      fontWeight: 600
    },

    lecturesScroll: {
      paddingRight: 20,
    },
    eventsSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
  });
  return styles;
}