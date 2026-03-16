import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { API_CONFIG, getAuthHeaders } from "./constant/dummyData";


export const fetchAllFees = async (
  admissionNo: string,
  academicYear: string
) => {
  try {

    const [token, encodedTenant, deviceId] = await Promise.all([
      AsyncStorage.getItem("auth_token"),
      AsyncStorage.getItem("auth_tenant"),
      getDeviceId(),
    ]);

    if (!token || !encodedTenant) {
      throw new Error("Auth missing");
    }

    const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

    const response = await axios.get(
      `${API_BASE_URL}receipts/getAllReceiptsByAdmissionNumber`,
      {
        params: {
          admissionNo,
          academicYear,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
          "X-Device-ID": deviceId,
        },
      }
    );

    console.log("Fees Response:", response.data);

    return response.data;
  } catch (error:any) {
    console.error("Error fetching fees:", error.message);
    throw error;
  }
};

/**
 * Pay selected fees
 */
export const payFees = async (
  feeIds: any[],
  authToken?: string
) => {
  if (API_CONFIG.USE_DUMMY_DATA) {
    return new Promise((resolve) => {
      setTimeout(
        () =>
          resolve({
            success: true,
            message: "Payment successful",
            transactionId: `TXN${Date.now()}`,
          }),
        1000
      );
    });
  }

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAY_FEES}`,
      {
        method: "POST",
        headers: getAuthHeaders("authToken"),
        body: JSON.stringify({ feeIds }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
};

/**
 * Download receipt
 */
export const downloadReceipt = async (
  transactionId: unknown,
  authToken?: string
) => {
  if (API_CONFIG.USE_DUMMY_DATA) {
    return new Promise((resolve) => {
      setTimeout(
        () =>
          resolve({
            success: true,
            url: `https://example.com/receipt/${transactionId}.pdf`,
          }),
        500
      );
    });
  }

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOWNLOAD_RECEIPT}/${transactionId}`,
      {
        method: "GET",
        headers: getAuthHeaders("authToken"),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error downloading receipt:", error);
    throw error;
  }
};
