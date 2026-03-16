// src/theme/ThemeProvider.tsx
import React, { ReactNode, useEffect, useReducer } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import { ThemeContext } from "./ThemeContext";
import { Mode, THEME_ACTIONS, themeInitialState, themeReducer } from "./themeReducer";

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [state, dispatch] = useReducer(themeReducer, themeInitialState);

  const applySystemTheme = () => {
    const colorScheme: ColorSchemeName = Appearance.getColorScheme(); // "light" | "dark" | null

    // Fix: fallback to "light" if null
    const mode: Mode = colorScheme === "dark" ? "dark" : "light";

    dispatch({
      type: THEME_ACTIONS.SET_SYSTEM_THEME,
      payload: mode,
    });
  };

  useEffect(() => {
    applySystemTheme();
    const listener = Appearance.addChangeListener(applySystemTheme);

    return () => listener.remove();
  }, []);

  return (
    <ThemeContext.Provider value={state}>
      {children}
    </ThemeContext.Provider>
  );
};
