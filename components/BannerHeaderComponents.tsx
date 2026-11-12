import { TIMER_FOR_BANNER } from "@/config";
import { getResponsiveImageSize } from "@/utils/responsivedesignsystem";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const bannerImages = [
  require("../assets/bannerImage/banner1.jpeg"),
  require("../assets/bannerImage/banner2.jpeg"),
  require("../assets/bannerImage/banner3.jpeg"),
  require("../assets/bannerImage/banner4.jpeg"),
  // require("../assets/bannerImage/banner5.jpeg"),
  require("../assets/bannerImage/banner6.jpeg"),
  // require("../assets/bannerImage/banner7.jpeg"),
  // require("../assets/bannerImage/banner8.jpeg"),
  // require("../assets/bannerImage/banner9.jpeg"),
  // require("../assets/bannerImage/banner10.jpeg"),
  // require("../assets/bannerImage/banner11.jpeg"),
];

// Calculated once (module scope) - not re-derived on every render.
const bannerWidth = getResponsiveImageSize().fullWidth;
const bannerHeight = bannerWidth * (11 / 18);

/**
 * BannerImage
 * Auto-rotating, swipeable banner carousel.
 * - Cycles automatically every TIMER_FOR_BANNER ms
 * - User can swipe between banners at any time
 * - Autoplay pauses while the user is dragging and resumes after
 * - Dot indicators show the current position
 * - Cleans up its interval on unmount
 */
export const BannerImage = () => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndexRef = useRef(0); // avoids stale closures inside setInterval

  const clearAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    clearAutoplay();
    intervalRef.current = setInterval(() => {
      const nextIndex = (currentIndexRef.current + 1) % bannerImages.length;
      currentIndexRef.current = nextIndex;
      setCurrentBannerIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * bannerWidth, animated: true });
    }, TIMER_FOR_BANNER);
  }, [clearAutoplay]);

  useEffect(() => {
    startAutoplay();
    return clearAutoplay;
  }, [startAutoplay, clearAutoplay]);

  // User grabbed the banner - stop autoplay so it doesn't fight their swipe.
  const onScrollBeginDrag = useCallback(() => {
    clearAutoplay();
  }, [clearAutoplay]);

  // User let go - snap our index state to wherever they landed, then
  // resume autoplay from there.
  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const newIndex = Math.round(event.nativeEvent.contentOffset.x / bannerWidth);
      currentIndexRef.current = newIndex;
      setCurrentBannerIndex(newIndex);
      startAutoplay();
    },
    [startAutoplay]
  );

  return (
    <View style={{ width: bannerWidth }}>
      <View
        style={{
          width: bannerWidth,
          height: bannerHeight,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={onScrollBeginDrag}
          onMomentumScrollEnd={onMomentumScrollEnd}
          scrollEventThrottle={16}
        >
          {bannerImages.map((image, index) => (
            <Image
              key={index}
              source={image}
              accessible
              accessibilityRole="image"
              accessibilityLabel={`Banner ${index + 1} of ${bannerImages.length}`}
              style={{
                width: bannerWidth,
                height: bannerHeight,
              }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.dotsContainer}>
        {bannerImages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentBannerIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: "#333",
    width: 16, // active dot stretches into a pill, common carousel pattern
  },
  dotInactive: {
    backgroundColor: "#ccc",
  },
});


// import { bannerImages } from "@/appIcons/appIcons";
// import { TIMER_FOR_BANNER } from "@/config";
// import { getResponsiveImageSize } from "@/utils/responsivedesignsystem";
// import { useCallback, useEffect, useRef, useState } from "react";
// import {
//   Image,
//   NativeScrollEvent,
//   NativeSyntheticEvent,
//   ScrollView,
//   StyleSheet,
//   View,
// } from "react-native";

// const bannerWidth = getResponsiveImageSize().fullWidth;
// const bannerHeight = bannerWidth * (11 / 18);

// export const BannerImage = () => {
//   const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

//   const scrollViewRef = useRef<ScrollView>(null);
//   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const currentIndexRef = useRef(0);

//   const clearAutoplay = useCallback(() => {
//     if (intervalRef.current) {
//       clearInterval(intervalRef.current);
//       intervalRef.current = null;
//     }
//   }, []);

//   const startAutoplay = useCallback(() => {
//     clearAutoplay();

//     intervalRef.current = setInterval(() => {
//       const nextIndex = (currentIndexRef.current + 1) % bannerImages.length;

//       currentIndexRef.current = nextIndex;
//       setCurrentBannerIndex(nextIndex);

//       scrollViewRef.current?.scrollTo({
//         x: nextIndex * bannerWidth,
//         animated: true,
//       });
//     }, TIMER_FOR_BANNER);
//   }, [clearAutoplay]);

//   useEffect(() => {
//     startAutoplay();

//     return () => {
//       clearAutoplay();
//     };
//   }, [startAutoplay, clearAutoplay]);

//   const onScrollBeginDrag = useCallback(() => {
//     clearAutoplay();
//   }, [clearAutoplay]);

//   const onMomentumScrollEnd = useCallback(
//     (event: NativeSyntheticEvent<NativeScrollEvent>) => {
//       const newIndex = Math.round(
//         event.nativeEvent.contentOffset.x / bannerWidth
//       );

//       currentIndexRef.current = newIndex;
//       setCurrentBannerIndex(newIndex);

//       startAutoplay();
//     },
//     [startAutoplay]
//   );

// return (
//     <View style={{ width: bannerWidth }}>
//       <View
//         style={{
//           width: bannerWidth,
//           height: bannerHeight,
//           borderRadius: 16,
//           overflow: "hidden",
//         }}
//       >
//         <ScrollView
//           ref={scrollViewRef}
//           horizontal
//           pagingEnabled
//           showsHorizontalScrollIndicator={false}
//           onScrollBeginDrag={onScrollBeginDrag}
//           onMomentumScrollEnd={onMomentumScrollEnd}
//           scrollEventThrottle={16}
//         >
//          {bannerImages.map((image, index) => (
//   <Image
//     key={index}
//     source={{ uri: image.uri }}  // Change this line
//     style={{
//       width: bannerWidth,
//       height: bannerHeight,
//     }}
//     resizeMode="cover"
//     accessible
//     accessibilityRole="image"
//     accessibilityLabel={`Banner ${index + 1}`}
//   />
// ))}
//         </ScrollView>
//       </View>

//       <View style={styles.dotsContainer}>
//         {bannerImages.map((_, index) => (
//           <View
//             key={index}
//             style={[
//               styles.dot,
//               index === currentBannerIndex
//                 ? styles.dotActive
//                 : styles.dotInactive,
//             ]}
//           />
//         ))}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   dotsContainer: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 4,
//     gap: 6,
//   },
//   dot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//   },
//   dotActive: {
//     backgroundColor: "#333",
//     width: 16,
//   },
//   dotInactive: {
//     backgroundColor: "#ccc",
//   },
// });