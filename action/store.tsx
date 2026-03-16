import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./student/userContext";
export const store = configureStore({
  reducer: {
    user: userReducer,
  },
});

// Types
import { useDispatch } from "react-redux";

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
