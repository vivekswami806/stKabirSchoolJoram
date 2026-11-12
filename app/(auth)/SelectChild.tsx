import { RootState, useAppDispatch } from "@/action/store";
import { logout, setSelectedChild, } from "@/action/student/userContext";

import { ThemeContext } from "@/action/theme/ThemeContext";
import { getImageUri } from "@/helper/ImageRender";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSelector } from "react-redux";

interface Child {
  id: string;
  studentName: string;
  studentClass?: string;
  studentAdmissionNumber?: string;
  studentImage?: string;
  studentGender?: string;
  studentDateOfBirth?: string;
}

export default function SelectChild() {
  const dispatch = useAppDispatch();

  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles();
  const  {children, userDetail}  = useSelector((state: RootState) => state.user);
  const [selectedChild, setSelectedChildState] =useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const autoRedirected = useRef(false);
  useEffect(() => {
    if (!Array.isArray(children) || children.length !== 1 || typeof children[0] !== "object" || children[0] === null || typeof children[0].id !== "string" || autoRedirected.current ) {
      return;
    }
  
    autoRedirected.current = true;
  
    const child = children[0];
  
    dispatch(setSelectedChild(child));
  
    setTimeout(() => {
      router.replace("/(tabs)/home");
    }, 0);
  }, [children, dispatch]);
  

  const handleContinue = () => {
    if (!selectedChild) {
      return;
    }
    const selectedChildData = children.find((child: Child) => child.id === selectedChild);
    if (!selectedChildData) {return}
    // console.log("Selected child:", selectedChildData);
    dispatch(setSelectedChild(selectedChildData));
    router.replace("/(tabs)/home");
  };

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/(auth)/studentlogin");
  };

 const renderChild = ({ item }: { item: Child }) => {
  const isSelected = selectedChild === item.id;

  const handleSelectChild = () => {
    if (loading) return;

    setSelectedChildState(item.id);
    dispatch(setSelectedChild(item));
    router.replace("/(tabs)/home");
  };

  return (
    <Pressable
      onPress={handleSelectChild}
      disabled={loading}
      style={[
        styles.childCard,
        {
          backgroundColor: theme.background,
          borderColor: isSelected
            ? theme.primary
            : theme.border,
        },
        isSelected && styles.selectedCard,
      ]}
    >
      {/* Selected icon */}
      <View
        style={[
          styles.radioContainer,
          {
            borderColor: isSelected
              ? theme.primary
              : theme.border,
          },
        ]}
      >
        {isSelected && (
          <View
            style={[
              styles.radioSelected,
              { backgroundColor: theme.primary },
            ]}
          />
        )}
      </View>

      {/* Student image */}
      <View style={styles.imageContainer}>
        {item.studentImage ? (
          <Image
            source={{ uri: getImageUri(item.studentImage) }}
            style={styles.studentImage}
          />
        ) : (
          <View
            style={[
              styles.placeholderImage,
              { backgroundColor: theme.primary + "20" },
            ]}
          >
            <Ionicons
              name="person"
              size={32}
              color={theme.primary}
            />
          </View>
        )}
      </View>

      {/* Student details */}
      <View style={styles.childInfo}>
        <Text
          style={[styles.studentName, { color: theme.text }]}
          numberOfLines={1}
        >
          {item.studentName}
        </Text>

        {item.studentClass && (
          <View style={styles.detailRow}>
            <Ionicons
              name="school-outline"
              size={15}
              color={theme.textSecondary}
            />
            <Text
              style={[
                styles.detailText,
                { color: theme.textSecondary },
              ]}
            >
              Class {item.studentClass}
            </Text>
          </View>
        )}

        {item.studentAdmissionNumber && (
          <View style={styles.detailRow}>
            <Ionicons
              name="card-outline"
              size={15}
              color={theme.textSecondary}
            />
            <Text
              style={[
                styles.detailText,
                { color: theme.textSecondary },
              ]}
            >
              Admission No: {item.studentAdmissionNumber}
            </Text>
          </View>
        )}
      </View>

      {/* Arrow */}
      <Ionicons
        name="chevron-forward"
        size={24}
        color={theme.textSecondary}
      />
    </Pressable>
  );
};

  /**
   * Empty state
   */
  if (!children || children.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor:
              theme.background,
          },
        ]}
      >
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIcon,
              {
                backgroundColor:
                  theme.primary + "15",
              },
            ]}
          >
            <Ionicons
              name="people-outline"
              size={50}
              color={theme.primary}
            />
          </View>

          <Text
            style={[
              styles.emptyTitle,
              {
                color: theme.text,
              },
            ]}
          >
            No Children Found
          </Text>

          <Text
            style={[
              styles.emptyDescription,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            We couldn't find any children
            associated with your account.
            Please contact the school
            administration.
          </Text>

          <Pressable
            onPress={handleLogout}
            style={[
              styles.logoutButton,
              {
                borderColor:
                  theme.border,
              },
            ]}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={theme.text}
            />

            <Text
              style={[
                styles.logoutText,
                {
                  color: theme.text,
                },
              ]}
            >
              Logout
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:theme.background,
        },
      ]}
    >
      {/* Header */}
      <LinearGradient colors={[theme.background, theme.background]} style={styles.header} >
        {/* <View style={styles.headerTop}> */}
          {/* <View style={styles.headerIcon}>
            <Ionicons
              name="people"
              size={28}
              color={theme.text}
            />
          </View> 

          <Pressable
            onPress={handleLogout}
            disabled={loading}
          >
            <Ionicons
              name="log-out-outline"
              size={25}
              color={theme.text}
            />
          </Pressable> */}
        {/* </View> */}

        {/* <Text style={[
            styles.sectionTitle,
            {
              color: theme.text,
            },
          ]}>
          Select Child
        </Text> */}

        {/* <Text style={{color:theme.text}}>
          Choose the child you want to continue with
        </Text> */}
      </LinearGradient>

      {/* Children */}
      <View style={styles.content}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.text,
            },
          ]}
        >
          Your Children
        </Text>

        <FlatList
          data={children}
          keyExtractor={(item) => item.id}
          renderItem={renderChild}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.listContent
          }
        />
      </View>

      {/* Bottom button */}
      <View
        style={[
          styles.bottomContainer,
          {
            backgroundColor: theme.background,
            borderTopColor: theme.border,
          },
        ]}
      >
        {/* <Pressable
          onPress={handleContinue}
          disabled={!selectedChild || loading}
          style={[
            styles.continueButton,
            {
              backgroundColor:theme.primary,
            },
            (!selectedChild || loading) &&
              styles.disabledButton,
          ]}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#fff"
            />
          ) : (
            <>
              <Text style={styles.continueText}>
                Continue
              </Text>

              <Ionicons
                name="arrow-forward"
                size={21}
                color="#fff"
              />
            </>
          )}
        </Pressable> */}
      </View>
    </SafeAreaView>
  );
}

const getStyles =()=>{  
return StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor:
      "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },

  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  listContent: {
    paddingBottom: 20,
  },

  childCard: {
    minHeight: 100,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  selectedCard: {
    borderWidth: 2,
  },

  radioContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  radioSelected: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  imageContainer: {
    marginRight: 12,
  },

  studentImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },

  placeholderImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
  },

  childInfo: {
    flex: 1,
  },

  studentName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  detailText: {
    fontSize: 12,
    marginLeft: 5,
  },

  bottomContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 15,
    borderTopWidth: 1,
  },

  continueButton: {
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  disabledButton: {
    opacity: 0.5,
  },

  continueText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },

  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 25,
  },

  logoutButton: {
    minWidth: 140,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
}