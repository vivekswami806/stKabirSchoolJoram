import { darkTheme } from "./dark";
import { lightTheme } from "./light";

export const THEME_ACTIONS = {
  SET_SYSTEM_THEME: "SET_SYSTEM_THEME",
} as const;

export type Mode = "light" | "dark";

export interface Theme {
  primary: any;
  mode: Mode;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border?: string;
  cardBackground?: string;
  inputBackGround?: string;
  errorColor?: string;
  buttonText?: string;
  secondary?: string;
  success?: string;
  accent?: string;
  warning?: string;
  danger?: string;
  divider?: string;
  disabled?: string;
}

export interface ThemeState {
  theme: Theme;
}

export interface ThemeAction {
  type: typeof THEME_ACTIONS.SET_SYSTEM_THEME;
  payload: Mode;
}

export const themeInitialState: ThemeState = {
  theme: lightTheme,
};

export function themeReducer(
  state: ThemeState,
  action: ThemeAction
): ThemeState {
  switch (action.type) {
    case THEME_ACTIONS.SET_SYSTEM_THEME:
      return {
        ...state,
        theme: action.payload === "dark" ? darkTheme : lightTheme,
      };

    default:
      return state;
  }
}
