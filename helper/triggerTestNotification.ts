export async function triggerTestNotification() {
  
    const Notifications = await import('expo-notifications');
  
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification",
        body: "Tap to open Home screen",
        data: { screen: "/(tabs)/home" },
      },
      trigger: null,
    });
  }