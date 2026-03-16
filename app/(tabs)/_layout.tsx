import CustomTabBar from '@/components/CustomFooter';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home"      options={{ title: 'Home' }} />
      <Tabs.Screen name="calendar"  options={{ title: 'Calendar' }} />
      <Tabs.Screen name="messages"  options={{ title: 'Messages' }} />
      <Tabs.Screen name="profile"   options={{ title: 'Profile' }} />
    </Tabs>
  );
}