
import { RootState } from '@/action/store';
import { ThemeContext } from '@/action/theme/ThemeContext';
import { Theme } from '@/action/theme/themeReducer';
import { Icons } from '@/appIcons/appIcons';
import { BannerImage } from '@/components/BannerHeaderComponents';
import TodayLectures from '@/components/TodayLectures';
import { router } from 'expo-router';
import React, { useContext } from 'react';
import {
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
    { id: 'attendance', name: 'Attendance', icon: Icons.attendance, color: '#EFF6FF', route: '/dashboard/(tabs)/attendance' },
    { id: 'exam', name: 'Exam', icon: Icons.exam, color: '#F3E5F5', route: '/dashboard/(tabs)/exam/exam' },
    { id: 'leave', name: 'Leave', icon: Icons.leave, color: '#F0FDF4', route: '/dashboard/(tabs)/leave' },
    { id: 'fees', name: 'Fees', icon: Icons.fees, color: '#E8EAF6', route: '/dashboard/(tabs)/fees/fees' },
    { id: 'homework', name: 'Home Work', icon: Icons.homework, color: '#FFF9C4', route: '/dashboard/(tabs)/homework' },
    { id: 'docs', name: 'Docs', icon: Icons.docs, color: '#FCE4EC', route: '/dashboard/(tabs)/community' },
    { id: 'message', name: 'Message', icon: Icons.message, color: '#F3E5F5', route: '/(tabs)/messages' },
    { id: 'notice', name: 'Notice', icon: Icons.notice, color: '#C8E6C9', route: '/dashboard/(tabs)/notice' },
  ];

  const handleMenuPress = (route: any) => {
    router.push(route);
  };

  return (
    <ScrollView style={styles.container}>
      <Profile />
      <View style={styles.bannerCard}>
        <BannerImage />
      </View>

      {/* Menu Grid */}
      <View style={styles.menuGrid}>
        {menuItems.map((item) => {
          const IconComponent = item.icon;

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.route)}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <IconComponent size={24} color="#333" />
              </View>

              <Text style={styles.menuLabel}>{item.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Upcoming Events */}
      <View style={styles.eventsSection}>
        <View style={styles.lecturesHeader}>
          <Text style={styles.lecturesTitle}>Today Classes</Text>
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
      //  paddingTop: Platform.OS === 'ios' ? 60 : 50,
    },
    viewAll: {
      fontSize: 14,
      color: theme.text,
    },
    bannerCard: {
      flexDirection: 'row',
      backgroundColor: theme.background,
      marginHorizontal: 20,
      marginBottom: 24,
      borderRadius: 16,
      padding: 0,
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
      backgroundColor: theme.background,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 12,
      alignSelf: 'flex-start',
    },
    bannerButtonText: {
      color: theme.text,
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
      backgroundColor: theme.text,
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
      marginBottom: 0,
    },
    menuItem: {
      width: '25%',
      alignItems: 'center',
      marginBottom: 20,
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
      color: theme.text,
      textAlign: 'center',
      fontWeight: '500',
    },
    lecturesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      alignItems: 'center',
      marginBottom: 6,
    },
    lecturesTitle: {
      fontSize: 18,
      fontWeight: '700',

      color: theme.text,
    },
    viewAllText: {
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
    },
    lectureCard: {
      backgroundColor: theme.background,
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
      color: theme.text,
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
      backgroundColor: theme.background,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },

    lectureTime: {
      fontSize: 12,
      color: theme.text,
      marginLeft: 6,
      fontWeight: 600
    },

    lecturesScroll: {
      paddingRight: 20,
    },
    eventsSection: {
      paddingHorizontal: 20,
      marginBottom: 14,
    },
  });
  return styles;
}