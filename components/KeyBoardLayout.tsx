import React from "react";
import { Platform, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

interface Props {
  children: React.ReactNode;
  extraScrollHeight?: number;
}

export default function KeyboardLayout({
  children,
  extraScrollHeight = 20,
}: Props) {
  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      enableAutomaticScroll
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={Platform.OS === 'ios' ? extraScrollHeight : 40}
      extraHeight={Platform.OS === 'android' ? 100 : 0}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      keyboardOpeningTime={0}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
});