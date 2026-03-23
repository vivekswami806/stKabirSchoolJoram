import { Theme } from "./themeReducer";

export const darkTheme: Theme = {
    mode: "dark",
  
    // Backgrounds
    background: "#0F172A",        // deep slate (NOT pure black)
    cardBackground: "#1E293B",
    card: "#1E293B",
  
    // Text
    text: "#F9FAFB",
    textSecondary: "#94A3B8",
  
    // Brand Colors (same family as light)
    primary: "#F472B6",          // softer pink for dark mode
    secondary: "#60A5FA",        // lighter blue
    accent: "#A78BFA",           // soft violet
    success: "#34D399",
  
    // UI Elements
    buttonText: "#FFFFFF",
    inputBackGround: "#334155",
    border: "#334155",
    errorColor: "#F87171",
  };