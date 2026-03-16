import { ThemeContext } from "@/action/theme/ThemeContext";
import { blue, pink } from "@/action/theme/light";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useContext, useEffect, useRef } from "react";
import {
  Animated,
  Dimensions, Image, Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

const { width } = Dimensions.get("window");
type Role = "studentlogin" | "staffslogin" | "adminslogin";
export default function App() {

  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  let isDark = theme.mode === "dark";
  const styles = getStyles(theme);
  const translateY = useRef(new Animated.Value(40)).current;
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
    const scale = useRef(new Animated.Value(1)).current;

    return (
      <Pressable
        onPressIn={() => {
          Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(scale, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }).start();
        }}
        onPress={() => onSelectRole(role)}
        style={styles.cardPressable}
      >
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              transform: [{ scale }],
            },
          ]}
        >
          <View style={styles.card}>
            {/* Left Section - Icon */}
            <View style={styles.cardLeft}>
              <View style={styles.iconContainer}>
                <MaterialIcons name={icon} size={28} color="#1F2937" />
              </View>
            </View>

            {/* Right Section - Text Content */}
            <View style={styles.cardRight}>
              <Text style={styles.cardTitle}>{label}</Text>
              <Text style={styles.cardDescription}>{description}</Text>
            </View>

            {/* Arrow */}
            <View style={styles.arrowContainer}>
              <MaterialIcons name="arrow-forward-ios" size={18} color="#1F2937" />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Section with Logo */}
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
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require(("../../assets/images/icon.png"))} // <-- your image path
                style={styles.logoCircle2}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.institutionName}>Loyola School Harnaut </Text>
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

        {/* Role Selection Cards */}
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
            <MaterialIcons name="security" size={16} color="#64748b" />
            <Text style={styles.footerText}>Secure Authentication</Text>
            <Text style={styles.footerDot}>•</Text>
            <MaterialIcons name="verified-user" size={16} color="#64748b" />
            <Text style={styles.footerText}>Protected Access</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
const getStyles = (theme: any) => {
  const isDark = theme.mode === "dark";

  /* ---------------- BLUE PALETTE ---------------- */


  const colors = {
    background: isDark ? "#0B1220" : "#FEFCE8",

    headerBackground: isDark ? "#0F172A" : "#FEFCE8",

    cardBackground: isDark ? "#111827" : "#FEFCE8",

    border: isDark ? "#1F2937" : "#E5E7EB",

    textPrimary: isDark ? pink[500] : pink[500],
    textSecondary: isDark ? "#1F2937" : "#1F2937",
    // textSecondary: isDark ? yellow[900] : yellow[900],

    divider: isDark ? pink[500] : "#E5E7EB",

    arrowBg: isDark ? pink[500] : blue[50],

    iconBg: isDark ? blue[200] : blue[100],

    accent: isDark ? pink[500] : pink[500],
  };

  return StyleSheet.create({
    /* ---------------- CONTAINER ---------------- */

    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    /* ---------------- HEADER ---------------- */

    header: {
      backgroundColor: colors.headerBackground,
      paddingTop: 60,
      paddingBottom: 30,
      paddingHorizontal: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 3,
    },

    headerContent: {
      alignItems: "center",
    },

    logoContainer: {
      marginBottom: 16,
      borderRadius: 20,
      padding: 14,
      // backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
      // shadowColor: colors.accent,
      // shadowOffset: { width: 0, height: 6 },
      // shadowOpacity: 0.3,
      // shadowRadius: 14,
      // elevation: 6,
    },

    logoCircle: {
      width: 80,
      height: 80,
      // borderRadius: 20,
      // backgroundColor: colors.accent,
      justifyContent: "center",
      alignItems: "center",
    },
    logoCircle2:{
      width: 130,
      height: 180,
      // borderRadius: 20,
      // backgroundColor: colors.accent,
      justifyContent: "center",
      alignItems: "center",
    }
,
    logoText: {
      fontSize: 40,
      fontWeight: "bold",
      color: "#FFFFFF",
    },

    institutionName: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.accent,
      letterSpacing: 0.5,
      marginBottom: 4,
    },

    institutionTagline: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
    },

    /* ---------------- CONTENT ---------------- */

    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 32,
    },

    welcomeSection: {
      marginBottom: 28,
    },

    welcomeTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 6,
    },

    welcomeSubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
    },

    rolesContainer: {
      gap: 16,
      flex: 1,
    },

    /* ---------------- ROLE CARD ---------------- */

    cardPressable: {
      width: "100%",
    },

    cardWrapper: {
      borderRadius: 18,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.35 : 0.07,
      shadowRadius: 8,
      elevation: 3,
    },

    card: {
      flexDirection: "row",
      alignItems: "center",
      padding: 20,
      borderRadius: 18,
    },

    cardLeft: {
      marginRight: 16,
    },

    iconContainer: {
      width: 52,
      height: 52,
      borderRadius: 14,
      backgroundColor: colors.iconBg,
      justifyContent: "center",
      alignItems: "center",
    },

    cardRight: {
      flex: 1,
    },

    cardTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 4,
    },

    cardDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    arrowContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.arrowBg,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 8,
    },

    /* ---------------- FOOTER ---------------- */

    footer: {
      paddingVertical: 24,
    },

    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginBottom: 16,
    },

    footerContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    footerText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
    },

    footerDot: {
      fontSize: 12,
      color: colors.border,
      marginHorizontal: 4,
    },
  });
}