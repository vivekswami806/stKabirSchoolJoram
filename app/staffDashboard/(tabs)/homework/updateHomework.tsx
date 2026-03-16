import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { router, useLocalSearchParams } from "expo-router";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { ToastService } from "react-native-toastier";
import HomeworkForm from "./HomeworkForm";

const STORAGE_KEY = "UPDATE_HOMEWORK_DATA";

const UpdateHomework = () => {
  const { homeworkId } = useLocalSearchParams<{ homeworkId: string }>();
  const [initialValues, setInitialValues] = useState<any>(null);
  const [resetKey, setResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setInitialValues(JSON.parse(raw));
    });
  }, []);

  if (!initialValues) return null;

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
      formData.append("className", data.selectedClass.name);
      formData.append("section", data.selectedSection.name);
      formData.append("dueDate", moment(data.dateObj).format("YYYY-MM-DD"));
      // formData.append("homeworkDate", moment().format("YYYY-MM-DD"));
      if (data.attachment) {
        if (Platform.OS === "web") {
          const blob = await fetch(data.attachment.uri).then(r => r.blob());
          formData.append("files", new File([blob], data.attachment.name));
        } else {
          formData.append("files", data.attachment);
        }
      }

      // const logFormData = (formData: FormData) => {
      //   const fd: any = formData;
      
      //   if (fd?._parts) {
      //     fd._parts.forEach((part: any[]) => {
      //       console.log("----",part[0], part[1]);
      //     });
      //   } else if (fd?.entries) {
      //     for (const pair of fd.entries()) {
      //       console.log("----",pair[0], pair[1]);
      //     }
      //   } else {
      //     console.log("Unable to log FormData");
      //   }
      // };

      // logFormData(formData);

      let response =   await axios.put(
        `${API_BASE_URL}homework/updateHomeWork/${homeworkId}`,
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
      
      await AsyncStorage.removeItem(STORAGE_KEY);
      ToastService.show({
        type: "success",
        message: "Homework Update Successful",
        duration: 2500, contentContainerStyle: {flex: 1,}
      });
      setResetKey(prev => prev + 1);
      setLoading(false);
      
      router.back();
    } catch (e: any) {
      console.log("errrhomework|", e);
      setLoading(false);
      ToastService.show({
        type: "danger",
        message: "Network Error",
        duration: 2500, contentContainerStyle: {flex: 1,}
      });
    }
  };

  return (
    <HomeworkForm
      initialValues={initialValues}
      submitText="Update Homework"
      onSubmit={submit}
      resetKey={resetKey}
      loading= {loading}
    />
  );
};

export default UpdateHomework;
