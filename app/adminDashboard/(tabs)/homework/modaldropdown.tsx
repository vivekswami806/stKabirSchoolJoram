// components/ModalDropdown.tsx
import React, { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

interface Props {
  visible: boolean;
  data: any[];
  labelKey: string;
  onSelect: (item: any) => void;
  onClose: () => void;
  loading?: boolean;
}

const ModalDropdown: React.FC<Props> = ({
  visible,
  data,
  labelKey,
  onSelect,
  onClose,
  loading,
}) => {
  const [search, setSearch] = useState("");

  const filtered = data.filter((item) =>
    item[labelKey].toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>Select Option</Text>

          {/* SEARCH BAR */}
          {/* <TextInput
            style={styles.search}
            placeholder="Search…"
            value={search}
            onChangeText={setSearch}
          /> */}

          {/* LOADING */}
          {loading ? (
            <ActivityIndicator size={26} color="#6C63FF" />
          ) : (
            <ScrollView style={{ maxHeight: 300 }}>
              {filtered.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.item}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={styles.itemText}>{item[labelKey]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ModalDropdown;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000055",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  search: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  itemText: { fontSize: 16 },
  closeBtn: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#6C63FF",
    borderRadius: 8,
  },
  closeText: { color: "#fff", fontWeight: "600" },
});
