// import { Theme } from "./themeReducer";

// export const darkTheme: Theme = {
//     mode: "dark",
  
//     // Backgrounds
//     background: "#0F172A",        // deep slate (NOT pure black)
//     cardBackground: "#1E293B",
//     card: "#1E293B",
  
//     // Text
//     text: "#F9FAFB",
//     textSecondary: "#94A3B8",
  
//     // Brand Colors (same family as light)
//     primary: "#F472B6",          // softer pink for dark mode
//     secondary: "#60A5FA",        // lighter blue
//     accent: "#A78BFA",           // soft violet
//     success: "#34D399",
  
//     // UI Elements
//     buttonText: "#FFFFFF",
//     inputBackGround: "#334155",
//     border: "#334155",
//     errorColor: "#F87171",
//   };

// src/theme/light.ts
import { Theme } from "./themeReducer";

export const darkTheme: Theme = {
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
  
    inputBackGround: "#E0E7FF",     // light blue tint
    border: "#CBD5F5",
  
    success: "#22C55E",             // consistent with logo green
    errorColor: "#DC2626",      // soft gold border
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
    400: "#F87171",
    500: "#DC143C", // flame red
    600: "#B22222",
    700: "#8B0000",
    900: "#5A0000",
};