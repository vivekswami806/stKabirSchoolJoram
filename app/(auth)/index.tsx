import { ThemeContext } from "@/action/theme/ThemeContext";
import { getContainerWidth, getDeviceType, getPhoneSize, getResponsiveFontSize, getResponsiveGap, getResponsivePadding, scaleFont, scaleH, scaleW } from "@/utils/responsivedesignsystem";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useContext, useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Role = "studentlogin" | "staffslogin" | "adminslogin";

export default function LoginScreen() {
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const isDark = theme.mode === "dark";
  const styles = getStyles(theme);

  // Animation refs
  const translateY = useRef(new Animated.Value(scaleH(40))).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onSelectRole = (role: Role) => {
    router.push({
      pathname: `/(auth)/${role}`,
      params: { role },
    });
  };

  const RoleCard = ({ label, description, icon, role }: any) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    return (
      <Pressable
        onPressIn={() =>
          Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }).start()
        }
        onPress={() => onSelectRole(role)}
        style={styles.cardPressable}
      >
        <Animated.View
          style={[
            styles.cardWrapper,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <MaterialIcons
                name={icon}
                size={scaleFont(26)}
                color={theme.primary}
              />
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.cardTitle}>{label}</Text>
              <Text numberOfLines={2} style={styles.cardDescription}>
                {description}
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <MaterialIcons
                name="arrow-forward-ios"
                size={scaleFont(14)}
                color={theme.primary}
              />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.headerContent,
              {
                opacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <View style={styles.logoCircle}>
              <Image
                source={require("../../assets/images/icon.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.institutionName}>Loyola School Harnaut</Text>
            <Text style={styles.institutionTagline}>Truth Love & Service</Text>
          </Animated.View>
        </View>

        {/* Main Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome</Text>
            <Text style={styles.welcomeSubtitle}>
              Please select your portal to continue
            </Text>
          </View>

          <View style={styles.rolesContainer}>
            <RoleCard
              label="Student Portal"
              description="Access courses, grades, and resources"
              icon="school"
              role="studentlogin"
            />
            <RoleCard
              label="Staff Portal"
              description="Manage classes, attendance, and records"
              icon="work"
              role="staffslogin"
            />
            <RoleCard
              label="Administrator Portal"
              description="System administration and oversight"
              icon="admin-panel-settings"
              role="adminslogin"
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.divider} />
            <View style={styles.footerContent}>
              <MaterialIcons
                name="security"
                size={scaleFont(14)}
                color="#64748b"
              />
              <Text style={styles.footerText}>Secure Authentication</Text>
              <Text style={styles.footerDot}>•</Text>
              <MaterialIcons
                name="verified-user"
                size={scaleFont(14)}
                color="#64748b"
              />
              <Text style={styles.footerText}>Protected</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => {
  const isDark = theme.mode === "dark";
  const padding = getResponsivePadding();
  const fontSizes = getResponsiveFontSize();
  const containerWidth = getContainerWidth();
  const gap = getResponsiveGap();
  const deviceType = getDeviceType();
  const phoneSize = getPhoneSize();

  return StyleSheet.create({
    // ===== CONTAINER & LAYOUT =====
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      flexGrow: 1,
      alignItems: "center",
      paddingHorizontal: padding.md,
    },

    // ===== HEADER SECTION =====
    header: {
      width: "100%",
      maxWidth: containerWidth,
      paddingTop: scaleH(phoneSize === "XS" ? 24 : 50),
      paddingBottom: scaleH(20),
      alignItems: "center",
    },
    headerContent: {
      alignItems: "center",
      width: "100%",
    },
    logoCircle: {
      width: scaleW(phoneSize === "XS" ? 80 : 100),
      height: scaleW(phoneSize === "XS" ? 80 : 100),
      marginBottom: scaleH(12),
      justifyContent: "center",
      alignItems: "center",
      borderRadius: scaleW(50),
    },
    logoImage: {
      width: "100%",
      height: "100%",
    },
    institutionName: {
      fontSize: fontSizes.h2,
      fontWeight: "700",
      color: theme.primary,
      textAlign: "center",
      paddingHorizontal: padding.md,
      marginBottom: scaleH(4),
    },
    institutionTagline: {
      fontSize: fontSizes.caption,
      color: theme.textSecondary,
      fontWeight: "500",
      marginTop: scaleH(4),
    },

    // ===== MAIN CONTENT =====
    content: {
      flex: 1,
      width: "100%",
      maxWidth: containerWidth,
      paddingHorizontal: padding.md,
    },
    welcomeSection: {
      marginBottom: scaleH(20),
      marginTop: scaleH(10),
    },
    welcomeTitle: {
      fontSize: fontSizes.h2,
      fontWeight: "700",
      color: theme.text,
      marginBottom: scaleH(8),
    },
    welcomeSubtitle: {
      fontSize: fontSizes.body,
      color: theme.textSecondary,
      lineHeight: scaleFont(20),
    },

    // ===== ROLE CARDS =====
    rolesContainer: {
      gap: gap,
      width: "100%",
      marginBottom: scaleH(24),
    },
    cardPressable: {
      width: "100%",
    },
    cardWrapper: {
      borderRadius: scaleW(16),
      backgroundColor: theme.cardBackground || theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: scaleW(4),
        },
        android: {
          elevation: 3,
        },
      }),
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      padding: padding.md,
      minHeight: scaleH(72),
    },
    iconContainer: {
      width: scaleW(48),
      height: scaleW(48),
      borderRadius: scaleW(12),
      backgroundColor: isDark
        ? "rgba(255,255,255,0.05)"
        : "rgba(0,0,0,0.02)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: padding.md,
      flexShrink: 0,
    },
    cardRight: {
      flex: 1,
      marginRight: padding.sm,
    },
    cardTitle: {
      fontSize: fontSizes.bodyLarge,
      fontWeight: "700",
      color: theme.text,
      marginBottom: scaleH(4),
    },
    cardDescription: {
      fontSize: fontSizes.caption,
      color: theme.textSecondary,
      lineHeight: scaleFont(16),
    },
    arrowContainer: {
      marginLeft: padding.sm,
      justifyContent: "center",
      flexShrink: 0,
    },

    // ===== FOOTER =====
    footer: {
      marginTop: "auto",
      paddingTop: scaleH(16),
      paddingBottom: scaleH(20),
      width: "100%",
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginBottom: scaleH(12),
      opacity: 0.5,
    },
    footerContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: scaleW(6),
    },
    footerText: {
      fontSize: fontSizes.small,
      color: theme.textSecondary,
    },
    footerDot: {
      color: theme.textSecondary,
      fontSize: fontSizes.small,
    },
  });
};