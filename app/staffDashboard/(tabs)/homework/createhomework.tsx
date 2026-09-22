// CreateHomework.tsx
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import moment from "moment";
import React, { useState } from "react";
import { Platform } from "react-native";
import { ToastService } from "react-native-toastier";
import HomeworkForm from "./HomeworkForm";

const CreateHomework = () => {
  const [resetKey, setResetKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const submit = async (data: any) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();
      const tenantId = Buffer.from(encodedTenant!, "base64").toString("utf-8");

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("subject", data.subject);
      formData.append("className", data.selectedClass.value);
      formData.append("section", data.selectedSection.value);
      formData.append("homeworkDate", moment().format("YYYY-MM-DD"));
      formData.append("dueDate", moment(data.dateObj).format("YYYY-MM-DD"));

      if (data.attachment) {
        if (Platform.OS === "web") {
          const blob = await fetch(data.attachment.uri).then((r) => r.blob());
          formData.append("files", new File([blob], data.attachment.name));
        } else {
          formData.append("files", data.attachment);
        }
      }

      await axios.post(`${API_BASE_URL}homework/createHomeWork`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
          "X-Device-ID": deviceId,
          "Content-Type": "multipart/form-data",
        },
      });

      ToastService.show({ type: "success", message: "Homework created successfully", duration: 2500, contentContainerStyle: { flex: 1 } });
      setResetKey((prev) => prev + 1);
      return true;
    } catch (e: any) {
      console.log("Create homework error:", e);
      ToastService.show({ type: "danger", message: e?.response?.data?.message || "Failed to create homework", duration: 2500, contentContainerStyle: { flex: 1 } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <HomeworkForm
      submitText="Publish Homework"
      onSubmit={submit}
      resetKey={resetKey}
      loading={loading}
    />
  );
};

export default CreateHomework;