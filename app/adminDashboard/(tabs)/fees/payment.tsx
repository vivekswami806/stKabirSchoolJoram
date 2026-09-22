import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
    // console.log("---params|", params);
    
  const title = params.title;
  const rawAmount = params.amount;
  

  const themeState = useContext(ThemeContext);
  if (!themeState) return null;

  const { theme } = themeState;
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [loading, setLoading] = useState(false);

  const amountInPaise = Math.round(Number(rawAmount) * 100);
  // console.log("--- rawAmount|amountInPaise", amountInPaise);

  const handlePayment = async () => {
    if (loading) return;

    if (!amountInPaise || amountInPaise <= 0) {
      Alert.alert("Invalid Amount", "Payment amount is not valid.");
      return;
    }

    setLoading(true);

    const options = {
      key: "YOUR_RAZORPAY_KEY_ID", // backend
      amount: amountInPaise,
      currency: "INR",
      name: "Your App Name",  // jisko pay krna h uska name
      description: title,
      image: "https://your-logo-url.com/logo.png", // school logo
      prefill: {
        email: "customer@example.com",
        contact: "9999999999",
        name: "Customer Name",
      },
      theme: {
        color: "#765432",
      },
    };

    try {
      // const data = await RazorpayCheckout.open(options);
      // Alert.alert(
      //   "Payment Successful",
      //   `Payment ID: ${data.razorpay_payment_id}`
      // );
      // router.back();
    } catch (error: any) {
      Alert.alert(
        "Payment Failed",
        error?.description || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.paymentTitle}>{title}</Text>

        <Text style={styles.currency}>₹</Text>
        <Text style={styles.paymentAmount}>{rawAmount}</Text>

        <TouchableOpacity
          style={[
            styles.payButton,
            loading && { opacity: 0.7 },
          ]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.payButtonText}>Pay Securely</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.secureText}>
          🔒 100% Secure Payment via Razorpay
        </Text>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: Platform.OS === "ios" ? 50 : 30,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
    },
    card: {
      margin: 16,
      padding: 24,
      borderRadius: 16,
      backgroundColor: "#fff",
      alignItems: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    paymentTitle: {
      fontSize: 18,
      color: theme.text,
      marginBottom: 16,
      textAlign: "center",
    },
    currency: {
      fontSize: 28,
      color: theme.primary,
    },
    paymentAmount: {
      fontSize: 48,
      fontWeight: "bold",
      color: theme.primary,
      marginBottom: 24,
    },
    payButton: {
      width: "100%",
      backgroundColor: theme.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    payButtonText: {
      color: "#000",
      fontSize: 18,
      fontWeight: "600",
    },
    secureText: {
      marginTop: 16,
      fontSize: 12,
      color: "#777",
    },
  });








// --------------------------------------------------------------------------------------------
// import { ThemeContext } from "@/action/theme/ThemeContext";
// import { Theme } from "@/action/theme/themeReducer";
// import { API_BASE_URL } from "@/config";
// import { Ionicons } from "@expo/vector-icons";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useContext, useMemo, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Platform,
//   SafeAreaView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// export default function PaymentScreen() {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//     // console.log("---params|", params);
    
//   const title = params.title;
//   const rawAmount = params.amount;
  

//   const themeState = useContext(ThemeContext);
//   if (!themeState) return null;

//   const { theme } = themeState;
//   const styles = useMemo(() => getStyles(theme), [theme]);

//   const [loading, setLoading] = useState(false);

//   const amountInPaise = Math.round(Number(rawAmount) * 100);
//   // console.log("--- rawAmount|amountInPaise", amountInPaise);

//   const handlePayment = async () => {
//     if (loading) return;

//     // Validation
//     if (!rawAmount || Number(rawAmount) <= 0) {
//       Alert.alert("Invalid Amount", "Payment amount is not valid.");
//       return;
//     }

//     if (!schoolId) {
//       Alert.alert("Error", "School information not found");
//       return;
//     }

//     setLoading(true);

//     try {
//       // Step 1: Get Razorpay Key & Order from backend
//       // Backend will fetch the correct Razorpay credentials for the school
//       const paymentInitResponse = await fetch(
//         `${API_BASE_URL}/api/payments/initiate`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${userToken}`,
//           },
//           body: JSON.stringify({
//             schoolId: schoolId,
//             title: title,
//             amount: Number(rawAmount),
//             customerEmail: user?.email,
//             customerPhone: user?.phone,
//           }),
//         }
//       );

//       if (!paymentInitResponse.ok) {
//         const errorData = await paymentInitResponse.json();
//         throw new Error(errorData.message || "Failed to initiate payment");
//       }

//       const paymentData = await paymentInitResponse.json();

//       // Step 2: Open Razorpay with school-specific credentials
//       // The key comes from backend - each school has its own Razorpay account
//       const options = {
//         key: paymentData.razorpayKeyId, // School's Razorpay public key
//         amount: paymentData.amount, // Amount in paise
//         currency: "INR",
//         name: paymentData.schoolName,
//         description: title,
//         order_id: paymentData.orderId,
//         image: user?.schoolLogo || "https://default-logo.png",
//         prefill: {
//           email: user?.email,
//           contact: user?.phone,
//           name: user?.name,
//         },
//         theme: {
//           color: theme.primary,
//         },
//         notes: {
//           schoolId: schoolId.toString(),
//           userId: user?.id.toString(),
//           paymentTitle: title,
//         },
//       };

//       const data = await RazorpayCheckout.open(options);

//       // Step 3: Verify payment on backend
//       // Backend will use school-specific secret key to verify
//       const verifyResponse = await fetch(
//         `${process.env.EXPO_PUBLIC_API_URL}/api/payments/verify`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${userToken}`,
//           },
//           body: JSON.stringify({
//             razorpay_payment_id: data.razorpay_payment_id,
//             razorpay_order_id: data.razorpay_order_id,
//             razorpay_signature: data.razorpay_signature,
//             schoolId: schoolId,
//           }),
//         }
//       );

//       if (verifyResponse.ok) {
//         const verifyData = await verifyResponse.json();
//         Alert.alert(
//           "Payment Successful",
//           `Payment ID: ${data.razorpay_payment_id}`,
//           [
//             {
//               text: "OK",
//               onPress: () => router.back(),
//             },
//           ]
//         );
//       } else {
//         const errorData = await verifyResponse.json();
//         Alert.alert("Verification Failed", errorData.message || "Could not verify payment");
//       }
//     } catch (error: any) {
//       if (error.code === "CANCELLED") {
//         Alert.alert("Payment Cancelled", "You cancelled the payment");
//       } else {
//         Alert.alert(
//           "Payment Failed",
//           error?.description || error?.message || "Something went wrong"
//         );
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar
//         barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
//         backgroundColor={theme.background}
//       />

//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={26} color={theme.text} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Checkout</Text>
//         <View style={{ width: 26 }} />
//       </View>

//       {/* Card */}
//       <View style={styles.card}>
//         <Text style={styles.paymentTitle}>{title}</Text>

//         <Text style={styles.currency}>₹</Text>
//         <Text style={styles.paymentAmount}>{rawAmount}</Text>

//         <TouchableOpacity
//           style={[
//             styles.payButton,
//             loading && { opacity: 0.7 },
//           ]}
//           onPress={handlePayment}
//           disabled={loading}
//         >
//           {loading ? (
//             <ActivityIndicator color="#000" />
//           ) : (
//             <Text style={styles.payButtonText}>Pay Securely</Text>
//           )}
//         </TouchableOpacity>

//         <Text style={styles.secureText}>
//           🔒 100% Secure Payment via Razorpay
//         </Text>
//       </View>
//     </SafeAreaView>
//   );
// }

// const getStyles = (theme: Theme) =>
//   StyleSheet.create({
//     container: {
//       flex: 1,
//       backgroundColor: theme.background,
//       paddingTop: Platform.OS === "ios" ? 50 : 30,
//     },
//     header: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//       paddingHorizontal: 16,
//       paddingVertical: 12,
//     },
//     headerTitle: {
//       fontSize: 20,
//       fontWeight: "700",
//       color: theme.text,
//     },
//     card: {
//       margin: 16,
//       padding: 24,
//       borderRadius: 16,
//       backgroundColor: "#fff",
//       alignItems: "center",
//       elevation: 4,
//       shadowColor: "#000",
//       shadowOpacity: 0.1,
//       shadowRadius: 10,
//     },
//     paymentTitle: {
//       fontSize: 18,
//       color: theme.text,
//       marginBottom: 16,
//       textAlign: "center",
//     },
//     currency: {
//       fontSize: 28,
//       color: theme.primary,
//     },
//     paymentAmount: {
//       fontSize: 48,
//       fontWeight: "bold",
//       color: theme.primary,
//       marginBottom: 24,
//     },
//     payButton: {
//       width: "100%",
//       backgroundColor: theme.primary,
//       paddingVertical: 16,
//       borderRadius: 12,
//       alignItems: "center",
//     },
//     payButtonText: {
//       color: "#000",
//       fontSize: 18,
//       fontWeight: "600",
//     },
//     secureText: {
//       marginTop: 16,
//       fontSize: 12,
//       color: "#777",
//     },
//   });
