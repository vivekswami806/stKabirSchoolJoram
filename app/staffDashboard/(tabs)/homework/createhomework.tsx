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
      formData.append("className", data.selectedClass.name);
      formData.append("section", data.selectedSection.name);
      formData.append("homeworkDate", moment().format("YYYY-MM-DD"));
      formData.append("dueDate", moment(data.dateObj).format("YYYY-MM-DD"));

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
      //       console.log(part[0], part[1]);
      //     });
      //   } else if (fd?.entries) {
      //     for (const pair of fd.entries()) {
      //       console.log(pair[0], pair[1]);
      //     }
      //   } else {
      //     console.log("Unable to log FormData");
      //   }
      // };

      // logFormData(formData);

      const res = await axios.post(`${API_BASE_URL}homework/createHomeWork`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
          "X-Device-ID": deviceId,
          "Content-Type": "multipart/form-data",
        },
      });
      // console.log("--res|", res);
        
      ToastService.show({
        type: "success",
        message: "Homework created",
        duration: 2500, contentContainerStyle: {flex: 1,}
      });
      setResetKey(prev => prev + 1); // 🔥 RESET FORM
      setLoading(false);
      return true;
    } catch (e: any) {
      setLoading(false);
      console.log("---e", e);
      
      ToastService.show({
        type: "danger",
        message: "Network Error",
        duration: 2500, contentContainerStyle: {flex: 1,}
      });
    }
  };

  return   <HomeworkForm
  submitText="Publish Homework"
  onSubmit={submit}
  resetKey={resetKey}
  loading= {loading}
/>;
};

export default CreateHomework;
