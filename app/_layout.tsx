import { store } from "@/action/store";
import { ThemeProvider } from "@/action/theme/themProvider";
import { Stack } from "expo-router";
import { ToastProvider } from 'react-native-toastier';
import { Provider } from "react-redux";
import AuthGate from "./AuthGate";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <ThemeProvider>
          <AuthGate>
            <Stack screenOptions={{ headerShown: false, gestureDirection: 'horizontal' }} />
          </AuthGate>
        </ThemeProvider>
      </ToastProvider>
    </Provider>
  );
}

