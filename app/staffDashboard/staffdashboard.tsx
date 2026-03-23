import { ThemeContext } from '@/action/theme/ThemeContext';
import { Theme } from '@/action/theme/themeReducer';
import { BannerImage } from '@/components/BannerHeaderComponents';
import TodayLectures from '@/components/TodayLectures';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Profile from '../dashboard/HeaderBar';

export default function StaffDashboard() {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);
  const menuItems = [
    { id: 1, name: 'Attendance', icon: '🗓️', color: '#3B82F6', bg: '#EFF6FF', route: '/staffDashboard/(tabs)/attendance' },
    { id: 2, name: 'My Notes', icon: '📝', color: '#A855F7', bg: '#FAF5FF', route: '/staffDashboard/(tabs)/teachernotes' },
    { id: 3, name: 'Leave', icon: '🏖️', color: '#10B981', bg: '#F0FDF4', route: '/staffDashboard/(tabs)/TeacherLeaveApprovalScreen' },
    { id: 4, name: 'Time Table', icon: '🕒', color: '#6366F1', bg: '#EEF2FF', route: '/staffDashboard/(tabs)/timetable/timetable' },
    { id: 5, name: 'Home Work', icon: '📚', color: '#EAB308', bg: '#FEFCE8', route: '/staffDashboard/(tabs)/homework/homework' },
    { id: 6, name: 'Student Info', icon: '👨‍🎓', color: '#EC4899', bg: '#FDF2F8', route: '/staffDashboard/(tabs)/InfoStudent/parentscreen' },
    // { id: 7, name: 'Message', icon: '💬', color: '#14B8A6', bg: '#F0FDFA', route: '/(tabs)/messages' },
    { id: 9, name: 'Docs', icon: '📄', color: '#000', bg: '#F0FDF4', route: '/dashboard/(tabs)/community' },
    { id: 8, name: 'Notice', icon: '📢', color: '#22C55E', bg: '#F0FDF4', route: '/dashboard/(tabs)/notice' },
  ];

  const handleMenuPress = (route: any) => {
    router.push(route);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Banner Card */}
      <Profile/>
      <View style={styles.bannerCard}>
        <BannerImage />
      </View>

      {/* Menu Grid */}
      <View style={styles.menuGrid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handleMenuPress(item.route)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
              <Text style={{ fontSize: 28 }}>{item.icon}</Text>
            </View>
            <Text style={styles.menuLabel}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>


      {/* Today Lectures Section */}
      <View style={styles.eventsSection}>
      <View style={styles.lecturesHeader}>
        <Text style={styles.lecturesTitle}>Today Lectures</Text>
        <TouchableOpacity onPress={()=>{router.replace('/staffDashboard/(tabs)/timetable/timetable')}}>
          <Text style={styles.viewAllText} >View all</Text>
        </TouchableOpacity>
      </View>
      <TodayLectures/>
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
    },
    bannerCard: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginBottom: 24,
      borderRadius: 16,
      padding: 0,
      justifyContent: 'space-between',
      alignItems: 'center',
      overflow: 'hidden',
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
      color: theme.text,
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
      color: theme.text,
    },
    viewAllText: {
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
    },
    lectureCard: {
      backgroundColor: theme.cardBackground,
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
      height:70
    },
    
    lectureFooter: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    eventsSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
  });
  return styles;
}