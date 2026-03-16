import { Theme } from "./themeReducer";

export const darkTheme: Theme = {
     mode: "dark",        // TypeScript now knows this is "dark"
    background: "#15151f",
    card: "#020617",
    text: "#E5E7EB",
    textSecondary: "#9CA3AF",
    primary: "#F54927",

    // mode: "light",       // TypeScript now knows this is "light"
    // background: "rgba(245, 244, 243, 1)",
    // card: "#FFFFFF",
    // text: "#111827",
    // textSecondary: "#6B7280",
    // primary: "#F54927",
};