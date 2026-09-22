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

interface Props {
  item: any;
  onDone: () => void;
}

const UpdateHomework = ({ item, onDone }: Props) => {
  const [loading, setLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const submit = async (data: any) => {
    setLoading(true);
    try {
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
      formData.append("dueDate", moment(data.dateObj).format("YYYY-MM-DD"));
      formData.append("homeworkDate", moment(new Date()).format("YYYY-MM-DD"));

      if (data?.attachment) {
        formData.append("files", {
          uri: data?.attachment.uri,
          name: data?.attachment.name,
          type: data?.attachment.type,
        } as any);
      }

      await axios.post(
        `${API_BASE_URL}homework/updateHomeWork/${item.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "X-Device-ID": deviceId,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      ToastService.show({ type: "success", message: "Homework updated successfully", duration: 2500, contentContainerStyle: { flex: 1 } });
      setResetKey((p) => p + 1);
      onDone(); // ✅ go back to check tab
    } catch (e: any) {
      console.log("Update error:",  e?.response?.data?.message);
      ToastService.show({ type: "danger", message: e?.response?.data?.message || "Failed to update", duration: 2500, contentContainerStyle: { flex: 1 } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <HomeworkForm
      initialValues={item}
      submitText="Update Homework"
      onSubmit={submit}
      resetKey={resetKey}
      loading={loading}
    />
  );
};

export default UpdateHomework;