import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChatInput from "@/components/ChatInput";
import MessageBubble from "@/components/MessageBubble";
import { Message, useChat } from "@/context/ChatContext";
import { useLlama } from "@/context/LlamaContext";
import { useColors } from "@/hooks/useColors";
import { formatPrompt } from "@/utils/chatTemplates";
import { ChatTemplate } from "@/utils/models";

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    messages,
    addUserMessage,
    addAssistantMessage,
    updateStreamingMessage,
    finalizeMessage,
    clearMessages,
    createConversation,
    conversations,
    activeConversation,
  } = useChat();
  const {
    isModelLoaded,
    isGenerating,
    activeModel,
    generate,
    stopGeneration,
    settings,
    isLoadingModel,
    isNativeAvailable,
  } = useLlama();

  const streamingIdRef = useRef<string | null>(null);
  const streamingContentRef = useRef<string>("");
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(
    async (text: string) => {
      if (!isModelLoaded || isGenerating) return;

      addUserMessage(text);

      const currentMessages = activeConversation?.messages ?? [];
      const historyForPrompt = [
        ...currentMessages,
        { role: "user" as const, content: text },
      ].map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const template: ChatTemplate =
        activeModel?.preset?.chatTemplate ?? settings.chatTemplate;

      const prompt = formatPrompt(
        historyForPrompt,
        settings.systemPrompt,
        template
      );

      const assistantMsg = addAssistantMessage();
      streamingIdRef.current = assistantMsg.id;
      streamingContentRef.current = "";

      try {
        const fullResponse = await generate(prompt, (token) => {
          streamingContentRef.current += token;
          updateStreamingMessage(
            streamingIdRef.current!,
            streamingContentRef.current
          );
        });
        finalizeMessage(
          streamingIdRef.current!,
          fullResponse || streamingContentRef.current
        );
      } catch (e: any) {
        finalizeMessage(streamingIdRef.current!, "[Error: " + (e?.message ?? "generation failed") + "]");
      }
    },
    [
      isModelLoaded,
      isGenerating,
      addUserMessage,
      addAssistantMessage,
      updateStreamingMessage,
      finalizeMessage,
      generate,
      activeModel,
      settings,
      activeConversation,
    ]
  );

  function handleLongPress(message: Message) {
    Alert.alert("Message", undefined, [
      {
        text: "Copy",
        onPress: () => {
          Clipboard.setStringAsync(message.content);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: insets.top > 0 ? insets.top + 8 : (Platform.OS === "web" ? 67 : 16),
      paddingBottom: 12,
      backgroundColor: colors.header,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    modelChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      maxWidth: 200,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: isModelLoaded ? "#22c55e" : "#f59e0b",
    },
    modelName: {
      color: colors.foreground,
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      flexShrink: 1,
    },
    headerRight: {
      flexDirection: "row",
      gap: 4,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingTop: 12,
      paddingBottom: 8,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      gap: 12,
      marginTop: 80,
    },
    emptyTitle: {
      color: colors.foreground,
      fontSize: 22,
      fontFamily: "Inter_600SemiBold",
      textAlign: "center",
    },
    emptySubtitle: {
      color: colors.mutedForeground,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      lineHeight: 20,
    },
    noModelBtn: {
      marginTop: 8,
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    noModelBtnText: {
      color: "#fff",
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },
    warningBanner: {
      backgroundColor: "#f59e0b22",
      borderRadius: 10,
      marginHorizontal: 16,
      marginTop: 8,
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    warningText: {
      color: "#f59e0b",
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      flex: 1,
      lineHeight: 16,
    },
  });

  const reversed = [...messages].reverse();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            style={styles.modelChip}
            onPress={() => router.push("/(tabs)/models")}
          >
            <View style={styles.dot} />
            <Text style={styles.modelName} numberOfLines={1}>
              {isLoadingModel
                ? "Loading…"
                : activeModel
                ? activeModel.preset?.name ?? activeModel.filename
                : "No model"}
            </Text>
            <Feather name="chevron-down" size={12} color={colors.mutedForeground} />
          </Pressable>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              createConversation();
            }}
          >
            <Feather name="plus" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/(tabs)/settings")}
          >
            <Feather name="settings" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {!isNativeAvailable && (
        <View style={styles.warningBanner}>
          <Feather name="alert-triangle" size={14} color="#f59e0b" />
          <Text style={styles.warningText}>
            Native build required for on-device LLM inference. Preview mode is active — scan the QR code in Expo Go on your S26 Ultra.
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={reversed}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble message={item} onLongPress={handleLongPress} />
        )}
        inverted
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!!reversed.length}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {activeModel
                  ? `Ready to chat`
                  : "Pick a model to begin"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeModel
                  ? `${activeModel.preset?.name ?? activeModel.filename} is loaded and running locally on your device.`
                  : "Download and load an LLM — everything runs 100% offline on your phone."}
              </Text>
              {!activeModel && (
                <TouchableOpacity
                  style={styles.noModelBtn}
                  onPress={() => router.push("/(tabs)/models")}
                >
                  <Text style={styles.noModelBtnText}>Browse Models</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />

      <ChatInput
        onSend={handleSend}
        onStop={stopGeneration}
        isGenerating={isGenerating}
        isModelLoaded={isModelLoaded}
      />
    </KeyboardAvoidingView>
  );
}
