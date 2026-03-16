// import React, { useState } from "react";
// import {
//   FlatList,
//   Platform,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View
// } from "react-native";

// import { DayType, TeacherNote } from "@/helper/teacherNotesDb";
// import { Ionicons } from "@expo/vector-icons";
// import { router } from "expo-router";
// import { NoteCard } from "./teachernotecard";

// export default function TeacherNotesScreen() {
//   const [notes, setNotes] = useState<TeacherNote[]>([]);
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [dayType, setDayType] = useState<DayType>("today");

//   // useEffect(() => {
//   //   initDB();
//   //   handleDailyUpdate();
  
//   //   const stats = getYesterdayStats();
//   //   console.log("Yesterday success:", stats.successRate + "%");
  
//   //   if (hasPendingYesterdayNotes()) {
//   //     Alert.alert("⚠️ You have unfinished tasks from yesterday");
//   //   }
  
//   //   setNotes(getNotes());
//   // }, []);
  

//   const loadNotes = async () => {
//     // const data = await getNotes();
//     // setNotes(data);
//   };

//   const createNote = async () => {
//     if (!title) return;

//     // await addNote({
//     //   title,
//     //   description,
//     //   dayType,
//     //   status: "pending",
//     //   createdAt: new Date().toISOString()
//     // });

//     setTitle("");
//     setDescription("");
//     loadNotes();
//   };

//   const changeStatus = async (id: number, status: "completed" | "failed") => {
//     // await updateStatus(id, status);
//     // loadNotes();
//   };

//   return (
//     <View style={styles.container}>
//        <View style={styles.headerRow}>
//        <TouchableOpacity onPress={() => router.push("/(tabs)/home")}>
//            <Ionicons name="arrow-back" size={26} style={styles.backButton} />
//          </TouchableOpacity>
//          <Text style={styles.headerText}>Teachers Note</Text>
//          <View style={{ width: 24 }} />
//        </View>

//       {/* Create Note */}
//       <TextInput
//         placeholder="Title"
//         value={title}
//         onChangeText={setTitle}
//         style={styles.input}
//       />

//       <TextInput
//         placeholder="Description"
//         value={description}
//         onChangeText={setDescription}
//         style={styles.input}
//       />

//       <View style={styles.dayRow}>
//         {["yesterday", "today", "tomorrow"].map(d => (
//           <TouchableOpacity
//             key={d}
//             style={[
//               styles.dayBtn,
//               dayType === d && styles.dayActive
//             ]}
//             onPress={() => setDayType(d as DayType)}
//           >
//             <Text>{d}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <TouchableOpacity style={styles.addBtn} onPress={createNote}>
//         <Text style={styles.addText}>Add Note</Text>
//       </TouchableOpacity>

//       {/* Notes List */}
//       <FlatList
//         data={notes}
//         keyExtractor={item => item.id!.toString()}
//         renderItem={({ item }) => (
//           <NoteCard
//             note={item}
//             onStatusChange={status =>
//               changeStatus(item.id!, status)
//             }
//           />
//         )}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20
//   },
  
//     headerRow: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//       paddingTop: Platform.OS === "ios" ? 30 : 20,
//       paddingBottom: 16,
//       paddingHorizontal: 20,
//       // backgroundColor: "#000104",
//       borderBottomWidth: 1,
//       borderBottomColor: "#e9ecef",
//     },

//     backButton: {
//       width: 40,
//       color:"#000104",
//     },
//     headerText: {
//             fontSize: 20,
//             fontWeight: "600",
//             color: "#000104",
//           },
//   header: {
//     fontSize: 22,
//     fontWeight: "700",
//     marginBottom: 16
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     padding: 10,
//     borderRadius: 8,
//     marginBottom: 10
//   },
//   dayRow: {
//     flexDirection: "row",
//     marginBottom: 10
//   },
//   dayBtn: {
//     padding: 8,
//     marginRight: 10,
//     borderRadius: 8,
//     backgroundColor: "#eee"
//   },
//   dayActive: {
//     backgroundColor: "#6C63FF"
//   },
//   addBtn: {
//     backgroundColor: "#6C63FF",
//     padding: 12,
//     borderRadius: 10,
//     marginBottom: 16
//   },
//   addText: {
//     color: "#fff",
//     textAlign: "center",
//     fontWeight: "600"
//   }
// });


