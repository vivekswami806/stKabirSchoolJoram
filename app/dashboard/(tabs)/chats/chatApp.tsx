// import { RootState } from "@/action/store";
// import { ThemeContext } from "@/action/theme/ThemeContext";
// import chatApiService from "@/helper/chatApiService";
// import {
//   DBMessage,
//   addMessageToDB,
//   getMessagesFromDB,
//   getPendingMessages,
//   initChatDB,
//   markMessageAsSent
// } from "@/helper/chatSQLiteDB.native";
// import { Ionicons } from "@expo/vector-icons";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, {
//   useCallback,
//   useContext,
//   useEffect,
//   useRef,
//   useState,
// } from "react";
// import {
//   ActivityIndicator,
//   FlatList,
//   KeyboardAvoidingView,
//   Platform,
//   SafeAreaView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useSelector } from "react-redux";

// /* ================================================================
//    POLLING INTERVAL — adjust to taste (3000ms = 3 seconds)
//    ================================================================ */
// const POLL_INTERVAL_MS = 30000;

// export default function ChatApp() {
//   const { id, name, members, emoji } = useLocalSearchParams();
//   const chatId = id as string;
//   const groupId = parseInt(chatId, 10);
//   const router = useRouter();

//   /* ---- Auth / user ---- */
//   const { userDetail } = useSelector((state: RootState) => state.user);
//   // myUserId comes from Redux; fallback to AsyncStorage if needed
//   const myUserId: string = userDetail?.id ?? "";
//   const myName: string = userDetail?.name ?? "Me";

//   /* ---- Theme ---- */
//   const themeState = useContext(ThemeContext);
//   if (!themeState) return null;
//   const { theme } = themeState;
//   const styles = getStyles(theme);
//   const isDark = theme.mode === "dark";

//   /* ================= STATE ================= */
//   const [messages, setMessages] = useState<DBMessage[]>([]);
//   const [text, setText] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [sending, setSending] = useState(false);

//   /**
//    * Track the timestamp of the newest message we've fetched from the server.
//    * On each poll we send this as `after=<timestamp>` so the server returns
//    * only NEW messages — not the full history every time.
//    */
//   const lastFetchedAtRef = useRef<number>(0);

//   /* Refs to avoid stale closures in intervals */
//   const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const isMountedRef = useRef(true);

//   /* ================= INIT ================= */
//   useEffect(() => {
//     isMountedRef.current = true;
//     initChatDB();
//     loadLocalMessages();
//     fetchRemoteMessages(); // initial fetch
//     startPolling();

//     return () => {
//       isMountedRef.current = false;
//       stopPolling();
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   /* ================= LOCAL LOAD ================= */
//   const loadLocalMessages = () => {
//     try {
//       const local = getMessagesFromDB(chatId, 0, 50);
//       if (isMountedRef.current) setMessages(local);
//     } catch (e) {
//       console.error("loadLocalMessages error:", e);
//     } finally {
//       if (isMountedRef.current) setLoading(false);
//     }
//   };

//   /* ================= POLLING ================= */
//   const startPolling = () => {
//     stopPolling(); // clear any existing interval
//     pollingRef.current = setInterval(() => {
//       fetchRemoteMessages();
//       syncPendingMessages();
//     }, POLL_INTERVAL_MS);
//   };

//   const stopPolling = () => {
//     if (pollingRef.current) {
//       clearInterval(pollingRef.current);
//       pollingRef.current = null;
//     }
//   };

//   /* ================= FETCH REMOTE MESSAGES ================= */
//   /**
//    * Gets messages from server.
//    * After the first load we send `afterTimestamp` so only new messages come back.
//    * New messages are merged into SQLite and the local state.
//    */
//   const fetchRemoteMessages = useCallback(async () => {
//     try {
//       const remoteMessages = await chatApiService.getGroupMessages(groupId);
  
//       if (!remoteMessages.length) return;
  
//       remoteMessages.forEach((msg) => {
//         const dbMsg: DBMessage = {
//           id: msg.id.toString(),
//           chatId,
//           text: msg.content,
//           sender: msg.senderId === userDetail.id ? "me" : "other",
//           senderName: msg.senderName,
//           timestamp: new Date(msg.createdAt).getTime(),
//           status: "sent",
//           synced: true,
//         };
  
//         addMessageToDB(chatId, dbMsg);
//       });
  
//       const updated = getMessagesFromDB(chatId, 0, 100);
//       setMessages(updated);
//     } catch {
//     }
//   }, [chatId, groupId]);
  

//   /* ================= SYNC PENDING (offline → online) ================= */
//   /**
//    * Any message still in SQLite with status='pending' and synced=0
//    * gets retried here on every poll tick.
//    */
//   const syncPendingMessages = useCallback(async () => {
//     const pending = getPendingMessages(chatId);
//     if (!pending.length) return;
  
//     for (const msg of pending) {
//       try {
//         await chatApiService.sendMessage({groupId, content: msg.text});
//         markMessageAsSent(msg.id);
//       } catch {
//         // keep pending
//       }
//     }
//   }, [chatId, groupId]);
  

//   /* ================= SEND MESSAGE ================= */
//   const sendMessage = async () => {
//     const trimmed = text.trim();
//     if (!trimmed) return;
  
//     const localId = `local_${Date.now()}`;
  
//     const optimisticMsg: DBMessage = {
//       id: localId,
//       chatId,
//       text: trimmed,
//       sender: "me",
//       senderName: myName,
//       timestamp: Date.now(),
//       status: "pending",
//       synced: false,
//     };
  
//     addMessageToDB(chatId, optimisticMsg);
//     setMessages((prev) => [optimisticMsg, ...prev]);
//     setText("");
  
//     try {
//       await chatApiService.sendMessage({
//         groupId,
//         content: trimmed,
//       });
  
//       markMessageAsSent(localId);
  
//       setMessages((prev) =>
//         prev.map((m) =>
//           m.id === localId ? { ...m, status: "sent", synced: true } : m
//         )
//       );
  
//     } catch {
//     }
//   };
  

//   /* ================= LOAD MORE (pagination) ================= */
//   const [offset, setOffset] = useState(50);
//   const [hasMore, setHasMore] = useState(true);

//   const loadMore = () => {
//     if (!hasMore) return;
//     const batch = getMessagesFromDB(chatId, offset, 30);
//     if (batch.length < 30) setHasMore(false);
//     if (batch.length) {
//       setMessages((prev) => [...prev, ...batch]);
//       setOffset((o) => o + 30);
//     }
//   };

//   /* ================= HELPERS ================= */
//   const formatTime = (t: number) =>
//     new Date(t).toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     });

//   const statusIcon = (status: DBMessage["status"]) => {
//     switch (status) {
//       case "read":
//         return "✓✓"; // blue ticks ideally
//       case "delivered":
//         return "✓✓";
//       case "sent":
//         return "✓";
//       case "pending":
//       default:
//         return "🕐";
//     }
//   };

//   /* ================= RENDER ITEM ================= */
//   const renderItem = ({ item }: { item: DBMessage }) => {
//     const isMe = item.sender === "me";
//     return (
//       <View
//         style={[
//           styles.bubbleWrapper,
//           isMe ? styles.wrapperMe : styles.wrapperOther,
//         ]}
//       >
//         {!isMe && item.senderName ? (
//           <Text style={styles.senderName}>{item.senderName}</Text>
//         ) : null}

//         <View
//           style={[
//             styles.messageBubble,
//             isMe ? styles.myBubble : styles.otherBubble,
//           ]}
//         >
//           <Text
//             style={[
//               styles.messageText,
//               isMe ? styles.textMe : styles.textOther,
//             ]}
//           >
//             {item.text}
//           </Text>

//           <View style={styles.metaRow}>
//             <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
//               {formatTime(item.timestamp)}
//             </Text>
//             {isMe && (
//               <Text
//                 style={[
//                   styles.statusIcon,
//                   item.status === "read" && styles.statusRead,
//                   item.status === "pending" && styles.statusPending,
//                 ]}
//               >
//                 {" "}
//                 {statusIcon(item.status)}
//               </Text>
//             )}
//           </View>
//         </View>
//       </View>
//     );
//   };

//   /* ================= LOADING SCREEN ================= */
//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <ActivityIndicator
//           size="large"
//           color={theme.primary}
//           style={{ marginTop: 60 }}
//         />
//       </SafeAreaView>
//     );
//   }

//   /* ================= MAIN RENDER ================= */
//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar
//         barStyle={isDark ? "light-content" : "dark-content"}
//       />

//       {/* ---- HEADER ---- */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
//           <Ionicons name="arrow-back" size={24} color={theme.text} />
//         </TouchableOpacity>

//         <View style={styles.headerInfo}>
//           <Text style={styles.headerTitle}>
//             {emoji} {name}
//           </Text>
//           <Text style={styles.headerSub}>{members} Members</Text>
//         </View>
//         </View>

//       {/* ---- MESSAGES + INPUT ---- */}
//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
//       >
//         <FlatList
//           data={messages}
//           keyExtractor={(item) => item.id}
//           renderItem={renderItem}
//           inverted
//           onEndReached={loadMore}
//           onEndReachedThreshold={0.4}
//           contentContainerStyle={styles.messageList}
//           ListEmptyComponent={
//             <View style={styles.emptyContainer}>
//               <Ionicons
//                 name="chatbubble-ellipses-outline"
//                 size={40}
//                 color={isDark ? "#555" : "#ccc"}
//               />
//               <Text style={styles.emptyText}>
//                 No messages yet. Say hello! 👋
//               </Text>
//             </View>
//           }
//         />

//         {/* ---- INPUT BAR ---- */}
//         <View style={styles.inputContainer}>
//           <TextInput
//             style={styles.input}
//             placeholder="Type a message..."
//             placeholderTextColor={isDark ? "#666" : "#aaa"}
//             value={text}
//             onChangeText={setText}
//             multiline
//             maxLength={2000}
//             onSubmitEditing={sendMessage}
//             blurOnSubmit={false}
//           />

//           <TouchableOpacity
//             onPress={sendMessage}
//             disabled={!text.trim() || sending}
//             style={[
//               styles.sendBtn,
//               (!text.trim() || sending) && styles.sendBtnDisabled,
//             ]}
//           >
//             {sending ? (
//               <ActivityIndicator size="small" color="#fff" />
//             ) : (
//               <Ionicons name="send" size={18} color="#fff" />
//             )}
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// /* ================= STYLES ================= */
// const getStyles = (theme: any) => {
//   const isDark = theme.mode === "dark";
//   return StyleSheet.create({
//     container: {
//       flex: 1,
//       backgroundColor: isDark ? "#0B1220" : "#F0F4F8",
//       paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight ?? 0,
//     },

//     /* Header */
//     header: {
//       flexDirection: "row",
//       alignItems: "center",
//       paddingHorizontal: 12,
//       paddingVertical: 12,
//       borderBottomWidth: 1,
//       borderBottomColor: isDark ? "#1E2D40" : "#DDE3EA",
//       backgroundColor: isDark ? "#0D1B2A" : "#FFFFFF",
//     },
//     backBtn: { padding: 4, marginRight: 8 },
//     headerInfo: { flex: 1 },
//     headerTitle: {
//       fontSize: 17,
//       fontWeight: "700",
//       color: isDark ? "#EAF0FB" : "#0B1220",
//     },
//     headerSub: {
//       fontSize: 12,
//       color: isDark ? "#6A85A0" : "#8A9BAE",
//       marginTop: 1,
//     },
//     onlineDot: {
//       width: 10,
//       height: 10,
//       borderRadius: 5,
//       marginLeft: 8,
//     },

//     /* Offline banner */
//     offlineBanner: {
//       flexDirection: "row",
//       alignItems: "center",
//       backgroundColor: "#FF3B30",
//       paddingVertical: 6,
//       paddingHorizontal: 14,
//       gap: 6,
//     },
//     offlineText: {
//       color: "#fff",
//       fontSize: 12,
//       fontWeight: "500",
//     },

//     /* Message list */
//     messageList: {
//       paddingHorizontal: 12,
//       paddingVertical: 16,
//     },

//     /* Empty state */
//     emptyContainer: {
//       flex: 1,
//       alignItems: "center",
//       justifyContent: "center",
//       paddingTop: 80,
//       gap: 12,
//       // FlatList inverted flips everything — transform fixes empty state orientation
//       transform: [{ scaleY: -1 }],
//     },
//     emptyText: {
//       color: isDark ? "#4A6280" : "#A0AEBA",
//       fontSize: 15,
//       textAlign: "center",
//     },

//     /* Bubbles */
//     bubbleWrapper: {
//       marginBottom: 6,
//       maxWidth: "78%",
//     },
//     wrapperMe: { alignSelf: "flex-end" },
//     wrapperOther: { alignSelf: "flex-start" },

//     senderName: {
//       fontSize: 11,
//       fontWeight: "600",
//       color: "#F09A1A",
//       marginBottom: 3,
//       marginLeft: 4,
//     },

//     messageBubble: {
//       paddingHorizontal: 14,
//       paddingVertical: 10,
//       borderRadius: 18,
//     },
//     myBubble: {
//       backgroundColor: theme.primary ?? "#4A90E2",
//       borderBottomRightRadius: 4,
//     },
//     otherBubble: {
//       backgroundColor: isDark ? "#1E2D40" : "#FFFFFF",
//       borderTopLeftRadius: 4,
//       // Shadow for light mode
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 1 },
//       shadowOpacity: isDark ? 0 : 0.06,
//       shadowRadius: 2,
//       elevation: isDark ? 0 : 1,
//     },

//     messageText: { fontSize: 15, lineHeight: 21 },
//     textMe: { color: "#FFFFFF" },
//     textOther: { color: isDark ? "#D0DFF0" : "#1A2530" },

//     metaRow: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "flex-end",
//       marginTop: 4,
//     },
//     messageTime: {
//       fontSize: 10,
//       color: isDark ? "#4A6280" : "#9AAABB",
//     },
//     messageTimeMe: { color: "rgba(255,255,255,0.65)" },

//     statusIcon: {
//       fontSize: 11,
//       color: "rgba(255,255,255,0.65)",
//     },
//     statusRead: { color: "#7DDCFF" },    // blue ticks
//     statusPending: { color: "rgba(255,255,255,0.4)" },

//     /* Input bar */
//     inputContainer: {
//       flexDirection: "row",
//       alignItems: "flex-end",
//       paddingHorizontal: 12,
//       paddingVertical: 10,
//       borderTopWidth: 1,
//       borderTopColor: isDark ? "#1E2D40" : "#DDE3EA",
//       backgroundColor: isDark ? "#0D1B2A" : "#FFFFFF",
//       gap: 8,
//     },
//     input: {
//       flex: 1,
//       minHeight: 40,
//       maxHeight: 120,
//       backgroundColor: isDark ? "#1A2A3A" : "#F2F5F8",
//       borderRadius: 20,
//       paddingHorizontal: 16,
//       paddingVertical: Platform.OS === "ios" ? 10 : 6,
//       fontSize: 15,
//       color: isDark ? "#EAF0FB" : "#0B1220",
//     },
//     sendBtn: {
//       width: 40,
//       height: 40,
//       borderRadius: 20,
//       backgroundColor: theme.primary ?? "#4A90E2",
//       alignItems: "center",
//       justifyContent: "center",
//       marginBottom: 1,
//     },
//     sendBtnDisabled: {
//       opacity: 0.4,
//     },
//   });
// };