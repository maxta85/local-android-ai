import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { DownloadState, ModelFile, useLlama } from "@/context/LlamaContext";
import { ModelPreset } from "@/utils/models";
import { useColors } from "@/hooks/useColors";

interface Props {
  preset: ModelPreset;
  downloadedFile?: ModelFile;
  downloadState?: DownloadState;
  isActive: boolean;
  onLoad: () => void;
}

export default function ModelCard({
  preset,
  downloadedFile,
  downloadState,
  isActive,
  onLoad,
}: Props) {
  const colors = useColors();
  const { downloadModel, cancelDownload, deleteModel } = useLlama();

  const isDownloaded = !!downloadedFile;
  const isDownloading = downloadState?.isDownloading ?? false;
  const progress = downloadState?.progress ?? 0;
  const hasError = !!downloadState?.error;

  function handleDownload() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    downloadModel(preset);
  }

  function handleCancel() {
    cancelDownload(preset.id);
  }

  function handleDelete() {
    Alert.alert(
      "Delete Model",
      `Remove ${preset.name}? You'll need to re-download it.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            deleteModel(preset.filename);
          },
        },
      ]
    );
  }

  function handleLoad() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLoad();
  }

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 6,
      borderWidth: isActive ? 1.5 : 0,
      borderColor: isActive ? colors.primary : "transparent",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 6,
    },
    nameRow: {
      flex: 1,
      gap: 4,
    },
    name: {
      color: colors.foreground,
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
    tagsRow: {
      flexDirection: "row",
      gap: 6,
      flexWrap: "wrap" as const,
      marginTop: 4,
    },
    tag: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    tagText: {
      color: colors.primary,
      fontSize: 10,
      fontFamily: "Inter_500Medium",
    },
    description: {
      color: colors.mutedForeground,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
      marginBottom: 10,
    },
    meta: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    metaText: {
      color: colors.mutedForeground,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: "hidden" as const,
      marginBottom: 10,
    },
    progressFill: {
      height: 4,
      backgroundColor: colors.primary,
      borderRadius: 2,
      width: `${Math.round(progress * 100)}%`,
    },
    footer: {
      flexDirection: "row",
      gap: 8,
    },
    btn: {
      flex: 1,
      height: 38,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
    },
    btnPrimary: {
      backgroundColor: colors.primary,
    },
    btnSecondary: {
      backgroundColor: colors.surface,
    },
    btnDestructive: {
      backgroundColor: colors.surface,
    },
    btnText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },
    btnTextPrimary: {
      color: "#fff",
    },
    btnTextMuted: {
      color: colors.mutedForeground,
    },
    btnTextDestructive: {
      color: colors.destructive,
    },
    activeChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.primary + "22",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: "flex-end" as const,
    },
    activeText: {
      color: colors.primary,
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
    },
    errorBox: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      gap: 6,
      marginTop: 10,
      backgroundColor: colors.destructive + "18",
      borderRadius: 8,
      padding: 8,
    },
    errorText: {
      color: colors.destructive,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      flex: 1,
      lineHeight: 17,
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{preset.name}</Text>
          <View style={styles.tagsRow}>
            {preset.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
        {isActive && (
          <View style={styles.activeChip}>
            <Feather name="zap" size={11} color={colors.primary} />
            <Text style={styles.activeText}>Active</Text>
          </View>
        )}
      </View>

      <Text style={styles.description}>{preset.description}</Text>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Feather name="cpu" size={12} color={colors.mutedForeground} />
          <Text style={styles.metaText}>{preset.paramCount}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="hard-drive" size={12} color={colors.mutedForeground} />
          <Text style={styles.metaText}>{preset.size}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="layers" size={12} color={colors.mutedForeground} />
          <Text style={styles.metaText}>{preset.quantization}</Text>
        </View>
      </View>

      {isDownloading && (
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      )}

      <View style={styles.footer}>
        {!isDownloaded && !isDownloading && (
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={handleDownload}
            activeOpacity={0.85}
          >
            <Feather name="download" size={14} color="#fff" />
            <Text style={[styles.btnText, styles.btnTextPrimary]}>
              Download {preset.size}
            </Text>
          </TouchableOpacity>
        )}

        {isDownloading && (
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={handleCancel}
            activeOpacity={0.85}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.btnText, styles.btnTextMuted]}>
              {Math.round(progress * 100)}% — Cancel
            </Text>
          </TouchableOpacity>
        )}

        {isDownloaded && !isActive && (
          <>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleLoad}
              activeOpacity={0.85}
            >
              <Feather name="zap" size={14} color="#fff" />
              <Text style={[styles.btnText, styles.btnTextPrimary]}>
                Load
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnDestructive]}
              onPress={handleDelete}
              activeOpacity={0.85}
            >
              <Feather name="trash-2" size={14} color={colors.destructive} />
              <Text style={[styles.btnText, styles.btnTextDestructive]}>
                Delete
              </Text>
            </TouchableOpacity>
          </>
        )}

        {isDownloaded && isActive && (
          <TouchableOpacity
            style={[styles.btn, styles.btnDestructive]}
            onPress={handleDelete}
            activeOpacity={0.85}
          >
            <Feather name="trash-2" size={14} color={colors.destructive} />
            <Text style={[styles.btnText, styles.btnTextDestructive]}>
              Remove
            </Text>
          </TouchableOpacity>
        )}

        {hasError && !isDownloaded && (
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={handleDownload}
            activeOpacity={0.85}
          >
            <Feather name="refresh-cw" size={14} color="#fff" />
            <Text style={[styles.btnText, styles.btnTextPrimary]}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>

      {hasError && downloadState?.error && (
        <View style={styles.errorBox}>
          <Feather name="alert-circle" size={13} color={colors.destructive} />
          <Text style={styles.errorText}>{downloadState.error}</Text>
        </View>
      )}
    </View>
  );
}
