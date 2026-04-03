import { TIMER_FOR_BANNER } from "@/config";
import { getResponsiveImageSize } from "@/utils/responsivedesignsystem";
import { useEffect, useRef, useState } from "react";
import { Image, View } from "react-native";


const bannerImages = [
  require("../assets/bannerImage/banner1.jpeg"),
  require("../assets/bannerImage/banner2.jpeg"),
  require("../assets/bannerImage/banner3.jpeg"),
  require("../assets/bannerImage/banner4.jpeg"),
  require("../assets/bannerImage/banner5.jpeg"),
  require("../assets/bannerImage/banner6.jpeg"),
  require("../assets/bannerImage/banner7.jpeg"),
  // require("../assets/bannerImage/banner8.jpg"),
  // require("../assets/bannerImage/banner9.jpg"),
  // require("../assets/bannerImage/banner10.jpg"),
];

// ? Calculate dimensions once (const, not re-calculated on each render)
const bannerHeight = getResponsiveImageSize().fullWidth * (9 / 18);
const bannerWidth = getResponsiveImageSize().fullWidth;

/**
 * BannerImage Component
 * Auto-rotating carousel that displays banner images
 * - Cycles through images at TIMER_FOR_BANNER interval
 * - Properly cleans up on unmount
 * - Optimized re-renders
 */
export const BannerImage = () => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // ? Use ref to store interval ID

  useEffect(() => {
    // ? Only create interval once on mount
    intervalRef.current = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
    }, TIMER_FOR_BANNER);

    // ? Proper cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // ? Empty dependency array - runs once on mount only

  return (
    <View
      style={{
        width: bannerWidth,
        height: bannerHeight,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <Image
        source={bannerImages[currentBannerIndex]}
        style={{
          width: bannerWidth, // ? Use constant instead of recalculating
          height: bannerHeight, // ? Consistent with container height
          borderRadius: 10,
        }}
      />
    </View>
  );
};

//---------------------------------------------------------------------------------

// import { TIMER_FOR_BANNER } from "@/config";
// import { getResponsiveImageSize } from "@/utils/responsivedesignsystem";
// import { useEffect, useRef, useState } from "react";
// import { Animated, Image, StyleSheet, View } from "react-native";

// const bannerImages = [
//   require('../assets/bannerImage/banner1.jpeg'),
//   require('../assets/bannerImage/banner2.jpeg'),
//   require('../assets/bannerImage/banner3.jpeg'),
//   require('../assets/bannerImage/banner4.jpeg'),
//   require('../assets/bannerImage/banner5.jpeg'),
//   require('../assets/bannerImage/banner6.jpeg'),
//   require('../assets/bannerImage/banner7.jpeg'),
// ];

// export const BannerImage = () => {
//   const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
//   const fadeAnim = useRef(new Animated.Value(1)).current;

//   // Auto-rotate banners
//   useEffect(() => {
//     const interval = setInterval(() => {
//       Animated.timing(fadeAnim, {
//         toValue: 0,
//         duration: 300,
//         useNativeDriver: true,
//       }).start(() => {
//         setCurrentBannerIndex(prev => (prev + 1) % bannerImages.length);
//         fadeAnim.setValue(1);
//       });
//     }, TIMER_FOR_BANNER);

//     return () => clearInterval(interval);
//   }, []);

//   const bannerWidth = getResponsiveImageSize().fullWidth;
//   const bannerHeight = bannerWidth * 9 / 16; // 16:9 aspect ratio

//   return (
//     <View style={{ width: bannerWidth, height: bannerHeight, borderRadius: 16, overflow: 'hidden' }}>
//       {/* Blurred Background */}
//       <Image
//         source={bannerImages[currentBannerIndex]}
//         style={StyleSheet.absoluteFill}
//         blurRadius={15}
//         resizeMode="cover"
//       />
//       {/* Main Banner */}
//       <Animated.Image
//         source={bannerImages[currentBannerIndex]}
//         style={{
//           width: bannerWidth,
//           height: bannerHeight,
//           borderRadius: 16,
//           resizeMode: "cover",
//           opacity: fadeAnim,
//         }}
//       />
//     </View>
//   );
// };