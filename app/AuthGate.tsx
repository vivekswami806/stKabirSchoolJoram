import { clearAuthStorage, getAuthCredentials, isTokenExpired } from "@/action/auth/authStorageServices";
import { registerForPushNotificationsAsync } from "@/action/notifications";
import { RootState, useAppDispatch } from "@/action/store";
import { logout, rehydrateAuth, } from "@/action/student/userContext";
import { fetchUserProfile } from "@/action/student/userProfileContext";
import Constants from "expo-constants";
import { router, usePathname, useSegments, } from "expo-router";
import { useEffect, useState } from "react";
import { Image, View, } from "react-native";
import { useSelector } from "react-redux";

export default function AuthGate({ children }: any) {

  const dispatch = useAppDispatch();
  const { isLoggedIn, role, children: parentChildren, isProfileLoading} = useSelector( (state: RootState) => state.user );
  const segments = useSegments();
  const pathname = usePathname();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const isExpoGo = Constants.executionEnvironment === "storeClient";
    if (isExpoGo) {
      return;
    }

    let subscription: any;
    (async () => {
      const Notifications = await import("expo-notifications");
      subscription = Notifications.addNotificationResponseReceivedListener(
          (response) => {
            const data = response.notification.request.content.data;
            if (data?.screen) {
              router.push( data.screen as any);
            }
          }
        );
    })();
    return () => {
      subscription?.remove();
    };

  }, []);

  useEffect(() => {
    if (isLoggedIn && bootstrapped) {
      (async () => {
        const token = await registerForPushNotificationsAsync();
      })();
    }
  }, [isLoggedIn, bootstrapped,]);
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const credentials = await getAuthCredentials();
        // No credentials OR token expired
        if (!credentials || (await isTokenExpired())) {
          await clearAuthStorage();
          dispatch(logout());
          return;
        }
        // Restore authentication
        dispatch(
          rehydrateAuth({
            token: credentials.token,
            tenantId: credentials.tenantId,
            expiresAt:credentials.expiresAt,
            role: credentials.role,
          })
        );
        // Fetch profile / children
        await dispatch( fetchUserProfile()).unwrap();
      } catch (error) {

        console.error("Auth bootstrap failed:",  error);
        await clearAuthStorage();
        dispatch(logout());
      } finally {
        setBootstrapped(true);
      }
    };
    bootstrap();

  }, [dispatch]);

  useEffect(() => {

    if (!bootstrapped) { return;}
  // Wait for profile/children API
    if (isProfileLoading) {return;}

    const inAuth = segments?.[0] === "(auth)";
    const isIndex = pathname === "/";
    if (!isLoggedIn && !inAuth) {
      router.replace("/");
      return;
    }
    if ( isLoggedIn && (inAuth || isIndex)) {

      if (role === "PARENT") {
        //  console.log("--- Parent children ---",parentChildren.length );
        if (parentChildren && parentChildren.length > 0) {
          router.replace("/(auth)/SelectChild");
        } else {
          // console.log("Parent has no children");
          router.replace( "/(tabs)/home");
        }
        return;
      }
      if (role === "STAFF" || role === "ADMIN" || role === "TEACHER") {
        router.replace( "/(tabs)/home");
        return;
      }
    }

  }, [
    bootstrapped,
    isLoggedIn,
    role,
    parentChildren,
    isProfileLoading,
    segments,
    pathname,
  ]);


  // --------------------------------------------------
  // BOOTSTRAP LOADING SCREEN
  // --------------------------------------------------

  if (!bootstrapped) {

    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >

        <Image
          source={require(
            "../assets/images/icon.png"
          )}
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
          }}
        />

      </View>
    );

  }


  return children;
}
