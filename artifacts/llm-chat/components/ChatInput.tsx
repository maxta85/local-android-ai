import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  isModelLoaded: boolean;
  disabled?: boolean;
}

export default function ChatInput({
  onSend,
  onStop,
  isGenerating,
  isModelLoaded,
  disabled,
}: Props) {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);
  const colors = useColors();
  const insets = useSafeAreaInsets();

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || !isModelLoaded || isGenerating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(trimmed);
    setText("");
    inputRef.current?.focus();
  }

  function handleStop() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStop();
  }

  const canSend = !!text.trim() && isModelLoaded && !isGenerating && !disabled;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.header,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : (Platform.OS === "web" ? 34 : 12),
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
    },
    inputWrapper: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 10,
      minHeight: 44,
      maxHeight: 120,
      justifyContent: "center",
    },
    input: {
      color: colors.foreground,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      paddingTop: 0,
      paddingBottom: 0,
      maxHeight: 100,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isGenerating ? colors.destructive : canSend ? colors.primary : colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={
              !isModelLoaded
                ? "Load a model to start chatting…"
                : "Message…"
            }
            placeholderTextColor={colors.mutedForeground}
            multiline
            onSubmitEditing={Platform.OS === "web" ? handleSend : undefined}
            blurOnSubmit={false}
            editable={isModelLoaded && !disabled}
            returnKeyType="send"
          />
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={isGenerating ? handleStop : handleSend}
          disabled={!isGenerating && !canSend}
        >
          <Feather
            name={isGenerating ? "square" : "send"}
            size={18}
            color={
              isGenerating || canSend ? "#fff" : colors.mutedForeground
            }
          />
        </Pressable>
      </View>
    </View>
  );
}
