
import { RootState } from '@/action/store';
import { ThemeContext } from '@/action/theme/ThemeContext';
import { Theme } from '@/action/theme/themeReducer';
import { BannerImage } from '@/components/BannerHeaderComponents';
import TodayLectures from '@/components/TodayLectures';
import { router } from 'expo-router';
import React, { useContext } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSelector } from 'react-redux';
import Profile from './HeaderBar';

function StudentDashboard() {
  const { } = useSelector((state: RootState) => state.user);

  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);
  const menuItems = [
    { id: 'attendance', name: 'Attendance', icon: '🗓️', color: '#EFF6FF', route: '/dashboard/(tabs)/attendance' },
    { id: 'exam', name: 'Exam', icon: '📝', color: '#F3E5F5', route: '/dashboard/(tabs)/exam/exam' },
    { id: 'leave', name: 'Leave', icon: '🏖️', color: '#F0FDF4', route: '/dashboard/(tabs)/leave' },
    { id: 'fees', name: 'Fees', icon: '💰', color: '#E8EAF6', route: '/dashboard/(tabs)/fees/fees' },
    { id: 'homework', name: 'Home Work', icon: '📚', color: '#FFF9C4', route: '/dashboard/(tabs)/homework' },
    { id: 'docs', name: 'Docs', icon: '📄', color: '#FCE4EC', route: '/dashboard/(tabs)/community' },
    { id: 'message', name: 'Message', icon: '💬', color: '#F3E5F5', route: '/(tabs)/messages' },
    { id: 'notice', name: 'Notice', icon: '📢', color: '#C8E6C9', route: '/dashboard/(tabs)/notice' },
  ];

  const handleMenuPress = (route: any) => {
    router.push(route);
  };

  // const currentHour = new Date().getHours(); // 0-23
  // const imageIndex = currentHour % bannerImages.length; // cycles through images if more than 10
  // const currentBanner = bannerImages[imageIndex];

  return (
    <ScrollView style={styles.container}>
      <Profile />
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Check updated Notice</Text>
          <Text style={styles.bannerTitle}>work for you.</Text>
          <TouchableOpacity style={styles.bannerButton} onPress={() => { router.replace('/dashboard/(tabs)/notice') }}>
            <Text style={styles.bannerButtonText}>Check Now</Text>
          </TouchableOpacity>
        </View>
        <BannerImage />
      </View>

      {/* Menu Grid */}
      <View style={styles.menuGrid}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => handleMenuPress(item.route)} >
            <View style={[styles.menuIconContainer, { backgroundColor: item.color }]}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
            </View>
            <Text style={styles.menuText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Upcoming Events */}
      <View style={styles.eventsSection}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventsTitle}>Today Classes</Text>
          <TouchableOpacity onPress={() => { router.replace('/staffDashboard/(tabs)/timetable/timetable') }}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>
        <TodayLectures />
      </View>
    </ScrollView>
  );
}

export default StudentDashboard;


function getStyles(theme: Theme) {

  let isDark = theme.mode === "dark";
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: 12
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 50 : 40,
    },
    idText: {
      fontSize: 14,
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
      marginBottom: 4,
    },
    greeting: {
      fontSize: 22,
      fontWeight: 'bold',
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
    },
    headerIcons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    notificationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bellIcon: {
      fontSize: 20,
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#e0e0e0',
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    searchIcon: {
      // fontSize: 18,
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: '#000',
    },
    banner: {
      backgroundColor: !isDark
        ? '#000104'
        : '#E9EFFC',
      marginHorizontal: 20,
      marginBottom: 24,
      borderRadius: 16,
      padding: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      overflow: 'hidden',
    },
    bannerContent: {
      flex: 1,
    },
    bannerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark
        ? '#000104'
        : '#E9EFFC',
      marginBottom: 2,
    },
    bannerButton: {
      backgroundColor: isDark
        ? '#000104'
        : '#E9EFFC',
      paddingVertical: 10,
      paddingHorizontal: 20,
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
    bannerImage: {
      width: 120,
      height: 140,
      borderRadius: 12,
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
    menuIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    menuIcon: {
      fontSize: 28,
    },
    menuText: {
      fontSize: 12,
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
      textAlign: 'center',
    },
    eventsSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    eventHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    eventsTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
    },
    viewAll: {
      fontSize: 14,
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
    },
    eventsScroll: {
      marginHorizontal: -20,
      paddingHorizontal: 20,
    },
    eventCard: {
      width: 160,
      height: 120,
      marginRight: 16,
      borderRadius: 16,
      overflow: 'hidden',
    },
    eventImage: {
      width: '100%',
      height: '100%',
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

  });
  return styles;
}