import { Dimensions, PixelRatio, Platform } from "react-native";

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ============= DEVICE CLASSIFICATION =============
export const SCREEN_SIZES = {
  SMALL_PHONE: 320,        // iPhone SE, older phones
  MEDIUM_PHONE: 375,       // iPhone 12/13/14
  LARGE_PHONE: 414,        // iPhone 12 Pro Max, Android large phones
  EXTRA_LARGE_PHONE: 428,  // iPhone 14 Pro Max
  TABLET: 600,             // iPad mini, small tablets
  LARGE_TABLET: 768,       // iPad, large tablets
  DESKTOP: 1024,           // iPad Pro, desktop
};

export const getDeviceType = () => {
  if (SCREEN_WIDTH < SCREEN_SIZES.TABLET) {
    return "PHONE";
  } else if (SCREEN_WIDTH < SCREEN_SIZES.LARGE_TABLET) {
    return "TABLET";
  } else {
    return "LARGE_TABLET";
  }
};

export const getPhoneSize = () => {
  if (SCREEN_WIDTH < SCREEN_SIZES.SMALL_PHONE) return "XS";
  if (SCREEN_WIDTH < SCREEN_SIZES.MEDIUM_PHONE) return "SM";
  if (SCREEN_WIDTH < SCREEN_SIZES.LARGE_PHONE) return "MD";
  if (SCREEN_WIDTH < SCREEN_SIZES.EXTRA_LARGE_PHONE) return "LG";
  return "XL";
};

// ============= RESPONSIVE SCALING =============
const BASE_WIDTH = 375; // Reference width
const BASE_HEIGHT = 812; // Reference height (iPhone 12)

/**
 * Scale based on screen width (primary method)
 * Use this for most UI elements
 */
export const scaleW = (size: number): number => {
  const newSize = (SCREEN_WIDTH / BASE_WIDTH) * size;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scale based on screen height
 * Use this for vertical spacing and layouts
 */
export const scaleH = (size: number): number => {
  const newSize = (SCREEN_HEIGHT / BASE_HEIGHT) * size;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Modular scale - for proportional sizing
 * Creates harmony between different text sizes and spacing
 */
export const scaleFont = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  
  if (Platform.OS === "ios") {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    // Android needs slight adjustment
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

/**
 * Smart padding that adapts to device size
 * Returns different padding values based on device type
 */
export const getResponsivePadding = () => {
  const deviceType = getDeviceType();
  
  if (deviceType === "PHONE") {
    return {
      xs: scaleW(8),
      sm: scaleW(12),
      md: scaleW(16),
      lg: scaleW(20),
      xl: scaleW(24),
      xxl: scaleW(32),
    };
  } else if (deviceType === "TABLET") {
    return {
      xs: scaleW(12),
      sm: scaleW(16),
      md: scaleW(20),
      lg: scaleW(28),
      xl: scaleW(32),
      xxl: scaleW(40),
    };
  } else {
    // Large tablet/desktop
    return {
      xs: scaleW(16),
      sm: scaleW(20),
      md: scaleW(28),
      lg: scaleW(36),
      xl: scaleW(44),
      xxl: scaleW(56),
    };
  }
};

/**
 * Safe area padding that accounts for notches and home indicators
 */
export const getSafeAreaPadding = () => {
  // You may need to integrate with react-native-safe-area-context for actual insets
  return {
    top: scaleH(Platform.OS === "ios" ? 44 : 24),
    bottom: scaleH(Platform.OS === "ios" ? 34 : 24),
    horizontal: scaleW(16),
  };
};

/**
 * Get responsive container width
 * Prevents content from stretching too wide on tablets
 */
export const getContainerWidth = () => {
  const deviceType = getDeviceType();
  
  if (deviceType === "PHONE") {
    return SCREEN_WIDTH;
  } else if (deviceType === "TABLET") {
    return Math.min(SCREEN_WIDTH * 0.95, 600);
  } else {
    return Math.min(SCREEN_WIDTH * 0.9, 800);
  }
};

/**
 * Responsive gap/margin for grid or flex layouts
 */
export const getResponsiveGap = () => {
  const phoneSize = getPhoneSize();
  
  switch (phoneSize) {
    case "XS":
    case "SM":
      return scaleW(8);
    case "MD":
      return scaleW(12);
    case "LG":
    case "XL":
      return scaleW(16);
    default:
      return scaleW(12);
  }
};

/**
 * Responsive font sizes with device awareness
 */
export const getResponsiveFontSize = () => {
  const phoneSize = getPhoneSize();
  
  return {
    // Heading sizes
    h1: phoneSize === "XS" ? scaleFont(24) : scaleFont(28),
    h2: phoneSize === "XS" ? scaleFont(20) : scaleFont(24),
    h3: phoneSize === "XS" ? scaleFont(18) : scaleFont(20),
    
    // Body text
    body: phoneSize === "XS" ? scaleFont(13) : scaleFont(14),
    bodyLarge: phoneSize === "XS" ? scaleFont(14) : scaleFont(16),
    
    // Caption/small text
    caption: scaleFont(12),
    small: scaleFont(11),
    tiny: scaleFont(10),
  };
};

/**
 * Responsive button/touch target size
 * Follows Material Design recommendations (48x48 minimum)
 */
export const getResponsiveButtonSize = () => {
  const baseHeight = scaleH(48);
  return {
    small: baseHeight * 0.8,
    medium: baseHeight,
    large: baseHeight * 1.2,
  };
};

/**
 * Responsive image dimensions
 */
export const getResponsiveImageSize = () => {
  return {
    avatar: scaleW(40),
    small: scaleW(80),
    medium: scaleW(120),
    large: scaleW(160),
    fullWidth: getContainerWidth(),
  };
};

/**
 * Get layout mode for different screen sizes
 */
export const getLayoutMode = () => {
  const deviceType = getDeviceType();
  
  return {
    isSingleColumn: deviceType === "PHONE",
    isTwoColumn: deviceType === "TABLET",
    isThreeColumn: deviceType === "LARGE_TABLET",
  };
};

// ============= DEVICE INFO =============
export const DeviceInfo = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  aspectRatio: SCREEN_WIDTH / SCREEN_HEIGHT,
  isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
  isPortrait: SCREEN_HEIGHT > SCREEN_WIDTH,
  deviceType: getDeviceType(),
  phoneSize: getPhoneSize(),
  platform: Platform.OS,
  pixelRatio: PixelRatio.get(),
};

// Export all utilities
export default {
  scaleW,
  scaleH,
  scaleFont,
  getResponsivePadding,
  getSafeAreaPadding,
  getContainerWidth,
  getResponsiveGap,
  getResponsiveFontSize,
  getResponsiveButtonSize,
  getResponsiveImageSize,
  getLayoutMode,
  DeviceInfo,
  SCREEN_SIZES,
  getDeviceType,
  getPhoneSize,
};