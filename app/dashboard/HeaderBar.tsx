import { RootState } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSelector } from "react-redux";

export default function Profile() {
  const router = useRouter();
  const themeState = useContext(ThemeContext);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  const { userDetail } = useSelector((state: RootState) => state.user);
  const [role, setRole] = useState<string>();
  const [isBirthDate, setIsBirthDate] = useState(false);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for profile image
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const loadRoleAndCheckBirthday = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("auth_role");
        if (!storedRole) return;
        setRole(storedRole);

        checkBirthday(storedRole);
      } catch (error) {
        console.error("Error loading role:", error);
      }
    };

    loadRoleAndCheckBirthday();
  }, [userDetail]);

  // Birthday confetti animation
  useEffect(() => {
    if (isBirthDate) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isBirthDate]);

  const checkBirthday = (roleValue: string | null) => {
    if (!roleValue || !userDetail) return;

    try {
      // FIX: Correct logic for checking role
      const isStaffOrAdmin = ["STAFF", "ADMIN"].includes(roleValue);

      // Get the appropriate date based on role
      const birthDateString = isStaffOrAdmin ? userDetail.dateOfBirth : userDetail.studentDateOfBirth;

      if (!birthDateString) {
        setIsBirthDate(false);
        return;
      }
      const birthDate = new Date(birthDateString);
      const today = new Date();

      // Validate date is valid
      if (isNaN(birthDate.getTime())) {
        setIsBirthDate(false);
        return;
      }

      const isBirthday = birthDate.getDate() === today.getDate() && birthDate.getMonth() === today.getMonth();
      setIsBirthDate(isBirthday);
    } catch (error) {
      console.error("Error checking birthday:", error);
      setIsBirthDate(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 20) return "Good Evening";
    return "Good Night";
  };

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "☀️";
    if (hour < 17) return "🌤️";
    if (hour < 20) return "🌆";
    return "🌙";
  };

  const getUserName = () => {
    if (!role || !userDetail) return "User";

    const isStaffOrAdmin = ["STAFF", "ADMIN"].includes(role);

    return isStaffOrAdmin
      ? userDetail?.name ?? "User"
      : role === "PARENT"
        ? userDetail?.studentName ?? "Student"
        : userDetail?.name ?? "User";
  };

  const getProfileImageUri = () => {
    if (!userDetail) {
      return `https://ui-avatars.com/api/?name=User&background=8B5CF6&color=fff&size=200&bold=true`;
    }

    const isParent = role === "PARENT";
    const userName = getUserName();

    if (isParent) {
      return userDetail?.studentImage
        ? `data:image/png;base64,${userDetail.studentImage}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=8B5CF6&color=fff&size=200&bold=true`;
    } else {
      return userDetail?.staffImage
        ? `data:image/png;base64,${userDetail.staffImage}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=8B5CF6&color=fff&size=200&bold=true`;
    }
  };

  if (!themeState) return null;

  const { theme } = themeState;
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      {/* Background Gradient Overlay */}
      {theme.mode === "dark" && (
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.05)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        />
      )}

      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingBadge}>
            <Text style={styles.greetingEmoji}>{getGreetingEmoji()}</Text>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
          </View>

          {/* Birthday Badge */}
          {isBirthDate && (
            <Animated.View
              style={[
                styles.birthdayBadge,
                {
                  opacity: confettiAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.7, 1, 0.7],
                  }),
                  transform: [
                    {
                      scale: confettiAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 1.05, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.birthdayEmoji}>🎉</Text>
              <Text style={styles.birthdayText}>Happy Birthday!  {getUserName()}</Text>
              <Text style={styles.birthdayEmoji}>🎂</Text>
            </Animated.View>
          )}
          {!isBirthDate &&
           <Text style={styles.userName}>
            {getUserName()}
          </Text>}

          {/* Decorative underline */}
          {theme.mode === "dark" && (
            <View style={styles.underlineContainer}>
              <LinearGradient
                colors={[theme.text, theme.text, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientUnderline}
              />
            </View>
          )}
        </View>

        {/* Profile Button with Glassmorphism */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.7}
          >
            {/* Glow effect for dark mode */}
            {theme.mode === "dark" && (
              <View style={styles.glowRing} />
            )}

            {/* Birthday ring animation */}
            {isBirthDate && (
              <Animated.View
                style={[
                  styles.birthdayRing,
                  {
                    opacity: confettiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.8],
                    }),
                    transform: [
                      {
                        scale: confettiAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.1],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Image
                source={{ uri: getProfileImageUri() }}
                style={styles.profileImage}
              />
            </Animated.View>

            {/* Status indicator */}
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.background,
      position: 'relative',
    },

    gradientOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 150,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'ios' ? 40 : 50,
      paddingBottom: 14,
      backgroundColor: 'transparent',
    },

    greetingSection: {
      flex: 1,
      marginRight: 16,
    },

    greetingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      backgroundColor: isDark
      ? `${theme.accent}20`
      : `${theme.secondary}15`,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: isDark
      ? `${theme.accent}20`
      : `${theme.secondary}15`,
    },

    greetingEmoji: {
      fontSize: 16,
      marginRight: 6,
    },

    greetingText: {
      fontSize: 13,
      color: theme.secondary,
      fontWeight: '600',
      letterSpacing: 0.5,
    },

    birthdayBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      backgroundColor:`${theme.primary}15`,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: `${theme.primary}40`,
    },

    birthdayEmoji: {
      fontSize: 14,
      marginHorizontal: 4,
    },

    birthdayText: {
      fontSize: 13,
      color: theme.primary,
      fontWeight: '700',
      letterSpacing: 0.5,
    },

    userName: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 4,
      letterSpacing: -0.5,
      textShadowColor: isDark ? theme.secondary : 'transparent',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
    },

    underlineContainer: {
      marginTop: 6,
    },

    gradientUnderline: {
      height: 3,
      width: 80,
      borderRadius: 2,
    },

    profileButton: {
      position: 'relative',
      shadowColor: theme.secondary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 12,
      elevation: 8,
      backgroundColor: theme.cardBackground,
      borderRadius: 32,
      padding: 3,
      borderWidth: 2,
      borderColor:  theme.border
    },

    glowRing: {
      position: 'absolute',
      top: -8,
      left: -8,
      right: -8,
      bottom: -8,
      borderRadius: 40,
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor:  `${theme.accent}50`,
      opacity: 0.6,
    },

    birthdayRing: {
      position: 'absolute',
      top: -12,
      left: -12,
      right: -12,
      bottom: -12,
      borderRadius: 44,
      backgroundColor: 'transparent',
      borderWidth: 3,
      borderColor: theme.primary,
    },

    profileImage: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 3,
      borderColor: theme.cardBackground,
    },

    statusIndicator: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 3,
      borderWidth: 2,
      borderColor: theme.cardBackground,
    },

    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.success,
      shadowColor: theme.success,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 4,
      elevation: 3,
    },
  });

  return styles;
}