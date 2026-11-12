import { FilePreviewData } from "@/helper/downloadnotice";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

interface FilePreviewModalProps {
  visible: boolean;
  fileData: FilePreviewData | null;
  isDark: boolean;
  onShare: () => void;
  onDownload: () => void;
  onOpenExternal: () => void;
  onClose: () => void;
  loading?: boolean;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]!);

function makePreviewHtml(
  base64: string,
  fileName: string,
  isDark: boolean
): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const encodedData = JSON.stringify(base64);
  const encodedName = JSON.stringify(fileName);
  const background = isDark ? "#0F172A" : "#FFFFFF";
  const foreground = isDark ? "#E5E7EB" : "#111827";
  const border = isDark ? "#334155" : "#E5E7EB";

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin:0; padding:12px; background:${background};
    color:${foreground}; font-family:Arial,sans-serif; }
  #status { padding:16px; text-align:center; }
  .page { margin:0 auto 12px; max-width:100%; }
  canvas { display:block; max-width:100%; height:auto; margin:auto; }
  .sheet { overflow-x:auto; margin-top:12px; }
  table { border-collapse:collapse; white-space:pre-wrap; }
  td,th { border:1px solid ${border}; padding:8px; min-width:75px;
    max-width:260px; overflow-wrap:anywhere; text-align:left; }
  th { background:${isDark ? "#1E293B" : "#F3F4F6"}; }
  pre { white-space:pre-wrap; overflow-wrap:anywhere; line-height:1.6; }
</style>
</head>
<body>
<div id="status">Preparing preview...</div>
<div id="content"></div>

<script>
const data = ${encodedData};
const fileName = ${encodedName};
const ext = ${JSON.stringify(ext)};
const status = document.getElementById("status");
const content = document.getElementById("content");

function bytesFromBase64(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function showError(error) {
  status.textContent = "Preview failed: " +
    (error && error.message ? error.message : String(error));
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Unable to load preview library"));
    document.head.appendChild(script);
  });
}

async function renderPdf() {
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const pdf = await pdfjsLib.getDocument({
    data: bytesFromBase64(data)
  }).promise;

  status.textContent = pdf.numPages + " page(s)";
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(
      (window.innerWidth - 24) / base.width, 1.8
    );
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.className = "page";
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    content.appendChild(canvas);

    await page.render({
      canvasContext: canvas.getContext("2d"),
      viewport
    }).promise;
  }
  status.remove();
}

async function renderExcel() {
  await loadScript(
    "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"
  );

  const workbook = XLSX.read(data, { type: "base64" });
  status.textContent = "Select a worksheet";
  const selector = document.createElement("select");
  selector.style.cssText = "padding:10px;max-width:100%;";
  const sheets = document.createElement("div");
  sheets.className = "sheet";
  content.appendChild(selector);
  content.appendChild(sheets);

  function renderSheet(name) {
    sheets.replaceChildren();
    const worksheet = workbook.Sheets[name];
    if (!worksheet) return;

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: false
    });

    const table = document.createElement("table");
    rows.forEach((row, index) => {
      const tr = document.createElement("tr");
      row.forEach((cell) => {
        const cellElement = document.createElement(
          index === 0 ? "th" : "td"
        );
        cellElement.textContent = String(cell ?? "");
        tr.appendChild(cellElement);
      });
      table.appendChild(tr);
    });
    sheets.appendChild(table);
  }

  workbook.SheetNames.forEach((name, index) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    selector.appendChild(option);
    if (index === 0) selector.value = name;
  });

  selector.addEventListener("change", () => renderSheet(selector.value));
  renderSheet(workbook.SheetNames[0]);
  status.remove();
}

async function renderWord() {
  if (ext === "doc") {
    throw new Error("Legacy .doc files need conversion to .docx or PDF.");
  }

  await loadScript(
    "https://unpkg.com/mammoth@1.9.0/mammoth.browser.min.js"
  );

  const result = await mammoth.extractRawText({
    arrayBuffer: bytesFromBase64(data).buffer
  });

  const pre = document.createElement("pre");
  pre.textContent = result.value || "This document contains no text.";
  content.appendChild(pre);
  status.remove();
}

(async () => {
  try {
    if (["pdf"].includes(ext)) await renderPdf();
    else if (["xls", "xlsx", "csv"].includes(ext)) await renderExcel();
    else if (["docx", "doc"].includes(ext)) await renderWord();
    else throw new Error("This file type has no in-app preview.");
  } catch (error) {
    showError(error);
  }
})();
</script>
</body>
</html>`;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  visible,
  fileData,
  isDark,
  onShare,
  onDownload,
  onOpenExternal,
  onClose,
  loading = false,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [webLoading, setWebLoading] = useState(true);
  const styles = getStyles(isDark);

  useEffect(() => {
    setImageLoading(true);
    setWebLoading(true);
  }, [fileData?.uri, visible]);

  const html = useMemo(() => {
    if (!fileData?.base64 || fileData.isImage) return null;

    return makePreviewHtml(
      fileData.base64,
      fileData.fileName,
      isDark
    );
  }, [fileData?.base64, fileData?.fileName, fileData?.isImage, isDark]);

  if (!fileData) return null;

  const canPreview = fileData.isPdf ||
    fileData.isDocument ||
    fileData.isExcel;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <MaterialIcons
              name="close"
              size={24}
              color={isDark ? "#E5E7EB" : "#000"}
            />
          </Pressable>

          <Text style={styles.headerTitle} numberOfLines={2}>
            {fileData.fileName}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.previewContainer}>
          {fileData.isImage ? (
            <ScrollView
              contentContainerStyle={styles.imageContent}
              maximumZoomScale={3}
            >
              {imageLoading && (
                <ActivityIndicator size="large" color="#3B82F6" />
              )}
              <Image
                source={{ uri: fileData.uri }}
                style={styles.previewImage}
                resizeMode="contain"
                onLoadEnd={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
            </ScrollView>
          ) : canPreview && html ? (
            <>
              {webLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.infoText}>Loading preview...</Text>
                </View>
              )}
              <WebView
                key={fileData.uri}
                source={{ html }}
                originWhitelist={["*"]}
                javaScriptEnabled
                domStorageEnabled
                onLoadEnd={() => setWebLoading(false)}
                onError={() => setWebLoading(false)}
                style={styles.webView}
              />
            </>
          ) : (
            <View style={styles.fileInfoContainer}>
              <Text style={styles.fileIconText}>
                {fileData.isPdf ? "📕" : "📄"}
              </Text>
              <Text style={styles.fileTypeName}>{fileData.fileType}</Text>
              <Text style={styles.fileName}>{fileData.fileName}</Text>
              <Text style={styles.infoText}>
                Preview unavailable. Use Open to view this file in another app.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.openBtn]}
            onPress={onOpenExternal}
            disabled={loading}
          >
            <MaterialIcons name="open-in-new" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Open</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.shareBtn]}
            onPress={onShare}
            disabled={loading}
          >
            <MaterialIcons name="share" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.downloadBtn]}
            onPress={onDownload}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="download" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Download</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#334155" : "#E5E7EB",
    },
    closeButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#E5E7EB" : "#000",
      marginHorizontal: 12,
      textAlign: "center",
    },
    previewContainer: {
      flex: 1,
    },
    webView: {
      flex: 1,
      backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
    },
    loadingOverlay: {
      position: "absolute",
      zIndex: 2,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
    },
    imageContent: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
    },
    previewImage: {
      width: "100%",
      height: 450,
    },
    fileInfoContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    fileIconText: {
      fontSize: 48,
      marginBottom: 12,
    },
    fileTypeName: {
      color: "#3B82F6",
      fontSize: 16,
      fontWeight: "600",
    },
    fileName: {
      color: isDark ? "#E5E7EB" : "#111827",
      fontSize: 16,
      fontWeight: "700",
      textAlign: "center",
      marginVertical: 12,
    },
    infoText: {
      color: isDark ? "#CBD5E1" : "#4B5563",
      textAlign: "center",
      marginTop: 8,
    },
    actionsContainer: {
      flexDirection: "row",
      gap: 10,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#334155" : "#E5E7EB",
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 8,
      gap: 6,
    },
    openBtn: { backgroundColor: "#3B82F6" },
    shareBtn: { backgroundColor: "#8B5CF6" },
    downloadBtn: { backgroundColor: "#22C55E" },
    actionBtnText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 13,
    },
  });
}

export default FilePreviewModal;