import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Skeleton from "./Skeleton";

interface BannerType {
  titleLine1?: string;
  titleLine2?: string;
  buttonText?: string;
  route?: string;
  image?: string;
}

export default function BannerHeaderCompSchool() {
  const router = useRouter();

  const [bannerData, setBannerData] = useState<BannerType | null>(null);
  const [bannerLoading, setBannerLoading] = useState<boolean>(false);

  const fetchBanner = useCallback(async () => {
    try {
      setBannerLoading(true);

      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();
      if (!token || !encodedTenant) {
        console.warn("Auth missing");
        setBannerLoading(false);
        return;
      }

      // ✅ React Native safe base64 decode
      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      const res = await axios.get(
        `${API_BASE_URL}auth/getTenantProfile`,
        {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Tenant-ID": tenantId,
              'X-Device-ID': deviceId
            },
          }
      );
      
      // console.log("---getTenantProfile |", res.data);
      
      const data = res.data;
      
      if (Array.isArray(data)) {
          setBannerData(data.length > 0 ? data[0] : null);
        } else {
            setBannerData(data);
        }
    } catch (err:any) {
        console.log(axios.getUri())
        console.error("Banner fetch error:", err.message);
      setBannerData(null);
    } finally {
      setBannerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanner();
  }, [fetchBanner]);

  return (
    <ScrollView style={styles.container}>
      {bannerLoading ? (
        <Skeleton isDark={false}/>
      ) : bannerData ? (
        <View style={styles.bannerCard}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>
              {bannerData.titleLine1 ?? ""}
            </Text>
            <Text style={styles.bannerTitle}>
              {bannerData.titleLine2 ?? ""}
            </Text>

            <TouchableOpacity
              style={styles.bannerButton}
              onPress={() => {
                if (bannerData.route) {
                  router.replace(bannerData.route as any);
                }
              }}
            >
              <Text style={styles.bannerButtonText}>
                {bannerData.buttonText ?? "Check Now"}
              </Text>
            </TouchableOpacity>
          </View>

          {bannerData.image && (
            <Image
              source={{ uri: bannerData.image }}
              style={styles.bannerImage}
              resizeMode="contain"
            />
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  bannerCard: {
    flexDirection: "row",
    backgroundColor: "#4A90E2",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  bannerButton: {
    marginTop: 10,
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  bannerButtonText: {
    color: "#4A90E2",
    fontWeight: "bold",
  },
  bannerImage: {
    width: 100,
    height: 100,
    marginLeft: 10,
  },
});