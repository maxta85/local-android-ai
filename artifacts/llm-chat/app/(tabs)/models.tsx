import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ModelCard from "@/components/ModelCard";
import { ModelFile, useLlama } from "@/context/LlamaContext";
import { useColors } from "@/hooks/useColors";
import { PRESET_MODELS } from "@/utils/models";

export default function ModelsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    downloadedModels,
    activeModel,
    isLoadingModel,
    loadModelError,
    downloads,
    loadModel,
    downloadModel,
  } = useLlama();
  const [customUrl, setCustomUrl] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  async function handleLoad(modelFile: ModelFile) {
    await loadModel(modelFile);
    router.back();
  }

  function handleCustomDownload() {
    const trimmed = customUrl.trim();
    if (!trimmed.endsWith(".gguf")) {
      Alert.alert("Invalid URL", "URL must point to a .gguf file.");
      return;
    }
    const filename = trimmed.split("/").pop() ?? "custom.gguf";
    downloadModel({
      id: "custom-" + Date.now(),
      name: filename,
      description: "Custom model",
      paramCount: "?",
      size: "?",
      sizeBytes: 0,
      quantization: "?",
      url: trimmed,
      filename,
      chatTemplate: "chatml",
      stopTokens: ["</s>", "<|im_end|>"],
      recommendedContextLength: 4096,
      tags: ["custom"],
    });
    setCustomUrl("");
    setShowCustom(false);
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop:
        insets.top > 0
          ? insets.top + 8
          : Platform.OS === "web"
          ? 67
          : 16,
      paddingBottom: 14,
      backgroundColor: colors.header,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      color: colors.foreground,
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      flex: 1,
    },
    addBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    section: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 8,
    },
    sectionTitle: {
      color: colors.mutedForeground,
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    errorBanner: {
      backgroundColor: colors.destructive + "22",
      borderRadius: 10,
      marginHorizontal: 16,
      marginTop: 8,
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    errorText: {
      color: colors.destructive,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      flex: 1,
    },
    loadingBanner: {
      backgroundColor: colors.primary + "22",
      borderRadius: 10,
      marginHorizontal: 16,
      marginTop: 8,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    loadingText: {
      color: colors.primary,
      fontSize: 13,
      fontFamily: "Inter_500Medium",
    },
    customUrlBox: {
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      gap: 10,
    },
    customLabel: {
      color: colors.foreground,
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
    customInput: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.foreground,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      borderWidth: 1,
      borderColor: colors.border,
    },
    customBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    customBtnText: {
      color: "#fff",
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },
    spacer: {
      height: insets.bottom > 0 ? insets.bottom + 8 : (Platform.OS === "web" ? 34 : 20),
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Models</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCustom((v) => !v)}
        >
          <Feather
            name={showCustom ? "x" : "link"}
            size={16}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoadingModel && (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading model into memory…</Text>
          </View>
        )}

        {!!loadModelError && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color={colors.destructive} />
            <Text style={styles.errorText}>{loadModelError}</Text>
          </View>
        )}

        {showCustom && (
          <View style={styles.section}>
            <View style={styles.customUrlBox}>
              <Text style={styles.customLabel}>Custom GGUF URL</Text>
              <TextInput
                style={styles.customInput}
                value={customUrl}
                onChangeText={setCustomUrl}
                placeholder="https://huggingface.co/.../model.gguf"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.customBtn}
                onPress={handleCustomDownload}
              >
                <Text style={styles.customBtnText}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Models</Text>
        </View>

        {PRESET_MODELS.map((preset) => {
          const file = downloadedModels.find(
            (m) => m.filename === preset.filename
          );
          return (
            <ModelCard
              key={preset.id}
              preset={preset}
              downloadedFile={file}
              downloadState={downloads[preset.id]}
              isActive={activeModel?.filename === preset.filename}
              onLoad={() => file && handleLoad(file)}
            />
          );
        })}

        {downloadedModels.filter((m) => m.isCustom).length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Custom Models</Text>
            </View>
            {downloadedModels
              .filter((m) => m.isCustom)
              .map((file) => (
                <ModelCard
                  key={file.filename}
                  preset={{
                    id: file.filename,
                    name: file.filename.replace(".gguf", ""),
                    description: "Custom downloaded model",
                    paramCount: "?",
                    size:
                      file.sizeBytes > 0
                        ? (file.sizeBytes / 1e9).toFixed(1) + " GB"
                        : "?",
                    sizeBytes: file.sizeBytes,
                    quantization: "?",
                    url: "",
                    filename: file.filename,
                    chatTemplate: "chatml",
                    stopTokens: ["</s>", "<|im_end|>"],
                    recommendedContextLength: 4096,
                    tags: ["custom"],
                  }}
                  downloadedFile={file}
                  isActive={activeModel?.filename === file.filename}
                  onLoad={() => handleLoad(file)}
                />
              ))}
          </>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}
