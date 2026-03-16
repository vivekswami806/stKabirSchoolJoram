import { Platform, useWindowDimensions } from "react-native";

const BASE_WIDTH = 390; // iPhone 14 / 6.1"

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const scale = width / BASE_WIDTH;

  const s = (size: number) => Math.round(size * scale);

  const isTablet = width >= 768;
  const isSmallPhone = width < 360;
  const isTallPhone = height / width > 2;

  return {
    width,
    height,
    scale,
    s,
    isTablet,
    isSmallPhone,
    isTallPhone,
    isIOS: Platform.OS === "ios",
    isAndroid: Platform.OS === "android",
  };
}
