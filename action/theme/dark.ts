import { Theme } from "./themeReducer";

export const darkTheme: Theme = {
    mode: "light",
    background: "#F4FBF7",        // very light green tint (fresh & modern)
    cardBackground: "#FFFFFF",
    buttonText: "#FFFFFF",
    card: "#FFFFFF",
    text: "#356F50",              // dark neutral for readability
    textSecondary: "#356F50",

    primary: "#356F50",           // your green (main brand)
    secondary: "#1B2A6B",         // navy (from logo)
    accent: "#FFD700",            // gold highlight

    inputBackGround: "#E6F4EC",   // soft green input
    success: "#2E8B57",           // success green
    errorColor: "#DC143C",        // red

    border: "#D1E7DD",            // soft gold border
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