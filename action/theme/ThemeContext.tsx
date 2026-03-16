// src/theme/ThemeContext.ts
import { createContext } from "react";
import { ThemeState } from "./themeReducer";

// Default value: null initially
export const ThemeContext = createContext<ThemeState | null>(null);
