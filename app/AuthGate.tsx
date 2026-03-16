import { clearAuthStorage, getAuthCredentials, isTokenExpired } from "@/action/auth/authStorageServices";
import { RootState, useAppDispatch } from "@/action/store";
import { logout, rehydrateAuth } from "@/action/student/userContext";
import { fetchUserProfile } from "@/action/student/userProfileContext";
import { router, usePathname, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { useSelector } from "react-redux";

export default function AuthGate({ children }: any) {
  const dispatch = useAppDispatch();
  const { isLoggedIn } = useSelector((state: RootState) => state.user);

  const segments = useSegments();
  const pathname = usePathname();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const credentials = await getAuthCredentials();
        // console.log("---credentials|", credentials);

        if (!credentials || (await isTokenExpired())) {
          await clearAuthStorage();
          dispatch(logout());
          return;
        }

        dispatch(
          rehydrateAuth({
            token: credentials.token,
            tenantId: credentials.tenantId,
            expiresAt: credentials.expiresAt,
            role: credentials.role,
          })
        );

        await dispatch(fetchUserProfile()).unwrap();
      } catch {
        await clearAuthStorage();
        dispatch(logout());
      } finally {
        setBootstrapped(true);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!bootstrapped) return;

    const inAuth = segments[0] === "(auth)";
    const isIndex = pathname === "/";
    // const isNotFound = segments.includes("+not-found");

    // if (isNotFound) return;

    if (!isLoggedIn && !inAuth) {
      router.replace("/");
      return;
    }

    if (isLoggedIn && (inAuth || isIndex)) {
      router.replace("/(tabs)/home");
    }
  }, [bootstrapped, isLoggedIn, segments, pathname]);

  if (!bootstrapped)  {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          source={require("../assets/images/icon.png")}
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
