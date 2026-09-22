import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

let Notifications: any;

if (!isExpoGo) {
  Notifications = require('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
export async function registerForPushNotificationsAsync() {
  if (isExpoGo) {
    console.log("Push notifications disabled in Expo Go");
    return null;
  }

  let token;
console.log("---", Platform.OS);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } =
        await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;
  }

  return token;
}