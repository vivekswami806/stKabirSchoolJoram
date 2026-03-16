// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import React, { useEffect } from "react";
// import {
//     Modal,
//     Platform,
//     Pressable,
//     StyleSheet,
//     Text,
//     View,
// } from "react-native";
// // import { BlurView } from "expo-blur";

// type PopupType = "success" | "error" | "failed";

// interface ModernPopupProps {
//     visible: boolean;
//     type: PopupType;
//     message: string;
//     autoClose?: boolean;
//     duration?: number;
//     onClose: () => void;
// }

// /* ✅ Safe Lottie import (mobile only) */
// let LottieView: any = null;
// console.log("Platform", Platform);

// if (Platform.OS !== "web") {
//     LottieView = require("lottie-react-native").default;
// }

// export default function ModernPopup({
//     visible,
//     type,
//     message,
//     autoClose = true,
//     duration = 2000,
//     onClose,
// }: ModernPopupProps) {

//     useEffect(() => {
//         if (visible && autoClose) {
//             const timer = setTimeout(onClose, duration);
//             return () => clearTimeout(timer);
//         }
//     }, [visible]);

//     if (!visible) return null;

//     const isSuccess = type === "success";

//     return (
//         <Modal transparent visible={visible} animationType="fade">
//             {/* 🖱 Tap outside to close */}
//             <Pressable style={styles.fullScreen} onPress={onClose}>
//                 {/* 🌫 Blur background (fallback for web) */}
//                 {Platform.OS === "web" ? (
//                     <View style={styles.webOverlay} />
//                 ) : ( null
//                     // <BlurView intensity={40} tint="dark" style={styles.blur} /> 
//                 )}

//                 {/* Stop click propagation */}
//                 <Pressable style={styles.center} onPress={() => {}}>
//                     <LinearGradient
//                         colors={
//                             isSuccess
//                                 ? ["#43cea2", "#185a9d"]
//                                 : ["#ff416c", "#ff4b2b"]
//                         }
//                         style={styles.card}
//                     >
//                         {/* 🎬 Animation */}
//                         {Platform.OS !== "web" && LottieView ? (
//                             <LottieView
//                                 source={
//                                     isSuccess
//                                         ? require("@/assets/lottie/success.json")
//                                         : require("@/assets/lottie/error.json")
//                                 }
//                                 autoPlay
//                                 loop={false}
//                                 style={styles.lottie}
//                             />
//                         ) : (
//                             <Ionicons
//                                 name={isSuccess ? "checkmark-circle" : "close-circle"}
//                                 size={90}
//                                 color="#fff"
//                             />
//                         )}

//                         <Text style={styles.title}>
//                             {isSuccess ? "Success" : "Oops!"}
//                         </Text>

//                         <Text style={styles.message}>{message}</Text>
//                     </LinearGradient>
//                 </Pressable>
//             </Pressable>
//         </Modal>
//     );
// }

// const styles = StyleSheet.create({
//     fullScreen: {
//         flex: 1,
//     },
//     blur: {
//         ...StyleSheet.absoluteFillObject,
//     },
//     webOverlay: {
//         ...StyleSheet.absoluteFillObject,
//         backgroundColor: "rgba(0,0,0,0.6)",
//     },
//     center: {
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//     },
//     card: {
//         width: "80%",
//         borderRadius: 22,
//         padding: 25,
//         alignItems: "center",
//         elevation: 10,
//     },
//     lottie: {
//         width: 120,
//         height: 120,
//     },
//     title: {
//         fontSize: 22,
//         fontWeight: "700",
//         color: "#fff",
//         marginTop: 10,
//     },
//     message: {
//         fontSize: 14,
//         color: "#fff",
//         textAlign: "center",
//         marginTop: 10,
//     },
// });
