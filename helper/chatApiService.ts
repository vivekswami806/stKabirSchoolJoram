import { API_BASE_URL } from "@/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError } from "axios";
import { Buffer } from "buffer";
import { getDeviceId } from "./getDeviceId";

/* ================= AXIOS INSTANCE ================= */

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

/* ================= INTERCEPTOR ================= */

axiosInstance.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("auth_token");
    const encodedTenant = await AsyncStorage.getItem("auth_tenant");
    const deviceId = await getDeviceId();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (encodedTenant) {
      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
      config.headers["X-Tenant-ID"] = tenantId;
    }

    if (deviceId) {
      config.headers["X-Device-ID"] = deviceId;
    }
  } catch (error) {
    console.error("Axios interceptor error:", error);
  }

  return config;
});

/* ================= TYPES ================= */

export interface ChatGroupAPI {
  id: number;
  name: string;
  description: string;
  groupType: string;
  className: string;
  section: string;
  memberCount: number;
  allowStudentMessages: boolean;
  announcementMode: boolean;
  active: boolean;
  createdAt: string;
}

export interface StudentAPI {
  id: string;
  name: string;
  studentClass: string;
  classSection: string;
  mobileNumber: string;
}

export interface CreateGroupMember {
  userId: string;
  userName: string;
}

export interface CreateGroupPayload {
  name: string;
  description: string;
  groupType: "CLASS_SECTION";
  className: string;
  section: string;
  allowStudentMessages: boolean;
  announcementMode: boolean;
  members: CreateGroupMember[];
}

export interface SendMessagePayload {
  groupId: number;
  content: string;
}

export interface APIMessage {
  id: number;
  groupId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

/* ================= SERVICE ================= */

class ChatApiService {
  /* -------- GROUPS -------- */

  async getGroups(userId: string): Promise<ChatGroupAPI[]> {
    try {
      const res = await axiosInstance.get("chat/myGroups", {
        params: { userId }
      });
  
      console.log("Response:", res.data);
  
      return res.data ?? [];
    } catch (error) {
      this.handleError("Get Groups", error);
      throw error;
    }
  }

  async createGroup(payload: CreateGroupPayload): Promise<ChatGroupAPI> {
    try {
      const res = await axiosInstance.post("chat/createGroup", payload);
      return res.data;
    } catch (error) {
      this.handleError("Create Group", error);
      throw error;
    }
  }

  async deleteGroup(groupId: number): Promise<void> {
    try {
      await axiosInstance.delete(`chat/deleteGroup/${groupId}`);
    } catch (error) {
      this.handleError("Delete Group", error);
      throw error;
    }
  }

  /* -------- STUDENTS -------- */

  async getStudentsByClass(
    studentClass: string,
    section: string
  ): Promise<StudentAPI[]> {
    try {
      const res = await axiosInstance.get(
        `student/giveAllActiveStudentByClass`,
        {
          params: { studentClass, section },
        }
      );

      return (res.data?.data ?? []).map((s: any) => ({
        id: s.id,
        name: s.studentName,
        studentClass: s.studentClass,
        classSection: s.classSection,
        mobileNumber: String(s.studentPhoneNumber),
      }));
    } catch (error) {
      this.handleError("Get Students", error);
      throw error;
    }
  }

  /* -------- MESSAGES -------- */

  async getGroupMessages(groupId: number): Promise<APIMessage[]> {
    console.log("---getGroupMessages|", groupId);
    
    try {
      const res = await axiosInstance.post(`getMessageGroup/${groupId}`);
      return res.data ?? [];
    } catch (error) {
      this.handleError("Get Group Messages", error);
      throw error;
    }
  }

  async sendMessage(payload: SendMessagePayload): Promise<APIMessage> {
    console.log("Send Message|payload", payload);
    
    try {
      const res = await axiosInstance.post(
        `chat/messages/sendMessage`,
        payload
      );
      console.log("---chat/messages/sendMessage",res.data);
      
      return res.data;
    } catch (error) {
      this.handleError("Send Message", error);
      throw error;
    }
  }

  async markAsRead(messageId: number): Promise<void> {
    try {
      await axiosInstance.patch(`chat/messages/${messageId}/read`);
    } catch (error) {
      console.warn("Mark as read failed:", error);
    }
  }

  /* -------- ERROR HANDLER -------- */

  private handleError(context: string, error: unknown) {
    if (axios.isAxiosError(error)) {
      const err = error as AxiosError<any>;
      console.error(
        `${context} Error:`,
        err.response?.data || err.message
      );
    } else {
      console.error(`${context} Error:`, error);
    }
  }
}

export default new ChatApiService();
