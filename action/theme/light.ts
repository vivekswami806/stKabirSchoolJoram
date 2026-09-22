// src/theme/light.ts
import { Theme } from "./themeReducer";

export const lightTheme: Theme = {
  mode: "light",

  background:  "#FFEDD5"       ,// "#F5F7FF",          // softer than your current blue
  cardBackground: "#FFFFFF",
  card: "#FFFFFF",

  text: "#0F172A",
  textSecondary: "#64748B",

  buttonText: "#FFFFFF",

  primary: "#1D4ED8",             // 🔵 main brand (logo blue)
  secondary: "#22C55E",           // 🟢 green from logo
  accent: "#F97316",              // 🟠 orange highlight

  inputBackGround: "#E0E7FF",     // light blue tintrr
  border: "#CBD5F5",

  success: "#22C55E",             // consistent with logo green
  errorColor: "#DC2626",          // logo red
};

export const yellow = {
    50: "#FFF8DC",
    100: "#FAE7B5",
    200: "#F5D98E",
    400: "#FFD700", // gold
    500: "#FFC107",
    600: "#E0A800",
    700: "#C69500",
    900: "#8B7500",
};

export const blue = {
    50: "#E6ECFF",
    100: "#C7D2FE",
    200: "#A5B4FC",
    400: "#4C6EF5",
    500: "#1B2A6B", // navy (main)
    600: "#162454",
    700: "#0F1B3D",
    900: "#0A1128",
};

export const pink = {
    50: "#FFF1F2",
    100: "#FFE4E6",
    200: "#FECDD3",
    400: "#F87171",
    500: "#DC143C", // crimson (flame red)
    600: "#B91C1C",
    700: "#991B1B",
    900: "#7F1D1D",
};

export const green = {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    400: "#34D399",
    500: "#228B22", // leaf green
    600: "#1F7A1F",
    700: "#1F5E3B", // dark green (center)
    900: "#064E3B",
};

export const red = {
  50: "#FEF2F2",
  100: "#FEE2E2",
  200: "#FECACA",
  300: "#FCA5A5",
  400: "#F87171",
  500: "#EF4444",   // Danger color in light mode
  600: "#DC2626",
  700: "#B91C1C",
  800: "#991B1B",
  900: "#7F1D1D",
};

export const purple = {
  50: "#FAF5FF",
  100: "#F3E8FF",
  200: "#E9D5FF",
  300: "#D8B4FE",
  400: "#C084FC",
  500: "#A855F7",
  600: "#9333EA",
  700: "#7E22CE",
  800: "#6B21A8",
  900: "#581C87",
};

export const violet = {
  50: "#F5F3FF",
  100: "#EDE9FE",
  200: "#DDD6FE",
  300: "#C4B5FD",
  400: "#A78BFA",
  500: "#8B5CF6",   // Accent color in light mode
  600: "#7C3AED",
  700: "#6D28D9",
  800: "#5B21B6",
  900: "#4C1D95",
};

export const amber = {
  50: "#FFFBEB",
  100: "#FEF3C7",
  200: "#FDE68A",
  300: "#FCD34D",
  400: "#FBBF24",
  500: "#F59E0B",   // Warning color in light mode
  600: "#D97706",
  700: "#B45309",
  800: "#92400E",
  900: "#78350F",
};

export const slate = {
  50: "#F8FAFC",
  100: "#F1F5F9",
  200: "#E2E8F0",
  300: "#CBD5E1",
  400: "#94A3B8",
  500: "#64748B",
  600: "#475569",
  700: "#334155",
  800: "#1E293B",
  900: "#0F172A",
};

export const gray = {
  50: "#F9FAFB",
  100: "#F3F4F6",   // Input background in light mode
  200: "#E5E7EB",   // Border color in light mode
  300: "#D1D5DB",   // Disabled color in light mode
  400: "#9CA3AF",
  500: "#6B7280",   // Text secondary in light mode
  600: "#4B5563",
  700: "#374151",
  800: "#1F2937",
  900: "#111827",   // Text primary in light mode
};

/* ============================================================================ */
/* COLOR COMBINATIONS - Pre-made theme variations */
/* ============================================================================ */

export const colorCombinations = {
  // Primary + Secondary combinations
  primary: {
    light: pink[100],
    main: pink[500],
    dark: pink[900],
  },
  secondary: {
    light: blue[100],
    main: blue[500],
    dark: blue[900],
  },
  success: {
    light: green[100],
    main: green[500],
    dark: green[900],
  },
  warning: {
    light: amber[100],
    main: amber[500],
    dark: amber[900],
  },
  danger: {
    light: red[100],
    main: red[500],
    dark: red[900],
  },
  accent: {
    light: violet[100],
    main: violet[500],
    dark: violet[900],
  },
};

/* ============================================================================ */
/* GRADIENTS FOR LIGHT MODE */
/* ============================================================================ */

export const gradients = {
  // Primary gradient
  primary: [pink[500], pink[600]],
  primaryReverse: [pink[600], pink[500]],

  // Secondary gradient
  secondary: [blue[500], blue[600]],
  secondaryReverse: [blue[600], blue[500]],

  // Success gradient
  success: [green[500], green[600]],
  successReverse: [green[600], green[500]],

  // Warning gradient
  warning: [amber[500], amber[600]],
  warningReverse: [amber[600], amber[500]],

  // Danger gradient
  danger: [red[500], red[600]],
  dangerReverse: [red[600], red[500]],

  // Accent gradient
  accent: [violet[500], violet[600]],
  accentReverse: [violet[600], violet[500]],

  // Multi-color gradients
  rainbow: [pink[500], violet[500], blue[500]],
  sunset: [red[500], amber[500], pink[500]],
  ocean: [blue[500], green[500], blue[600]],
};

/* ============================================================================ */
/* USAGE EXAMPLES */
/* ============================================================================ */

/**
 * Using Light Theme Colors:
 * 
 * import { lightTheme, pink, blue, gradients } from '@/theme/light';
 * 
 * // Use main theme colors
 * backgroundColor: lightTheme.primary     // #EC4899
 * color: lightTheme.text                  // #111827
 * borderColor: lightTheme.border         // #E5E7EB
 * 
 * // Use color palette for additional shades
 * backgroundColor: pink[300]             // Lighter pink
 * color: blue[200]                       // Even lighter blue
 * 
 * // Use color combinations
 * backgroundColor: colorCombinations.primary.light   // Light version
 * 
 * // Use gradients
 * <LinearGradient colors={gradients.primary} />
 * <LinearGradient colors={gradients.rainbow} />
 */