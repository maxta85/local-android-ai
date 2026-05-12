import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLlama } from "@/context/LlamaContext";
import { useColors } from "@/hooks/useColors";
import { ChatTemplate } from "@/utils/models";

const TEMPLATES: { value: ChatTemplate; label: string }[] = [
  { value: "chatml", label: "ChatML (Qwen, Phi, etc.)" },
  { value: "llama3", label: "Llama 3 (Meta)" },
  { value: "mistral", label: "Mistral / Mixtral" },
  { value: "gemma", label: "Gemma (Google)" },
  { value: "alpaca", label: "Alpaca / Generic" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useLlama();

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
    },
    section: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 8,
    },
    sectionTitle: {
      color: colors.mutedForeground,
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 12,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      marginHorizontal: 16,
      overflow: "hidden" as const,
    },
    row: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowLast: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    rowLabel: {
      color: colors.foreground,
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
    rowValue: {
      color: colors.primary,
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },
    rowHint: {
      color: colors.mutedForeground,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
    },
    slider: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 8,
    },
    sliderTrack: {
      flex: 1,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: "hidden" as const,
    },
    sliderFill: {
      height: 4,
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    sliderBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    systemPromptInput: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 12,
      color: colors.foreground,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      lineHeight: 20,
      marginHorizontal: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 100,
    },
    templateRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    templateRowLast: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    templateLabel: {
      color: colors.foreground,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    spacer: {
      height:
        insets.bottom > 0
          ? insets.bottom + 24
          : Platform.OS === "web"
          ? 34
          : 24,
    },
  });

  function SliderRow({
    label,
    hint,
    value,
    min,
    max,
    step,
    onChange,
    format,
  }: {
    label: string;
    hint: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
    format?: (v: number) => string;
  }) {
    const pct = ((value - min) / (max - min)) * 100;
    const displayValue = format ? format(value) : value.toString();

    function decrement() {
      const next = Math.max(min, parseFloat((value - step).toFixed(2)));
      onChange(next);
    }
    function increment() {
      const next = Math.min(max, parseFloat((value + step).toFixed(2)));
      onChange(next);
    }

    return (
      <View style={styles.row}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowValue}>{displayValue}</Text>
        </View>
        <Text style={styles.rowHint}>{hint}</Text>
        <View style={styles.slider}>
          <TouchableOpacity style={styles.sliderBtn} onPress={decrement}>
            <Feather name="minus" size={14} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${pct}%` }]} />
          </View>
          <TouchableOpacity style={styles.sliderBtn} onPress={increment}>
            <Feather name="plus" size={14} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Prompt</Text>
        </View>
        <TextInput
          style={styles.systemPromptInput}
          value={settings.systemPrompt}
          onChangeText={(v) => updateSettings({ systemPrompt: v })}
          multiline
          placeholderTextColor={colors.mutedForeground}
          placeholder="Describe the AI's personality and behavior…"
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generation</Text>
        </View>
        <View style={styles.card}>
          <SliderRow
            label="Temperature"
            hint="Higher = more creative, lower = more focused"
            value={settings.temperature}
            min={0}
            max={2}
            step={0.05}
            onChange={(v) => updateSettings({ temperature: v })}
            format={(v) => v.toFixed(2)}
          />
          <SliderRow
            label="Top P"
            hint="Nucleus sampling cutoff"
            value={settings.topP}
            min={0.1}
            max={1}
            step={0.05}
            onChange={(v) => updateSettings({ topP: v })}
            format={(v) => v.toFixed(2)}
          />
          <SliderRow
            label="Top K"
            hint="Top-K sampling"
            value={settings.topK}
            min={1}
            max={100}
            step={1}
            onChange={(v) => updateSettings({ topK: v })}
          />
          <SliderRow
            label="Max Tokens"
            hint="Maximum tokens per response"
            value={settings.maxTokens}
            min={64}
            max={2048}
            step={64}
            onChange={(v) => updateSettings({ maxTokens: v })}
          />
          <SliderRow
            label="Repeat Penalty"
            hint="Penalize repeated tokens (1 = off)"
            value={settings.repeatPenalty}
            min={1}
            max={2}
            step={0.05}
            onChange={(v) => updateSettings({ repeatPenalty: v })}
            format={(v) => v.toFixed(2)}
          />
          <View style={styles.rowLast}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowLabel}>Context Length</Text>
              <Text style={styles.rowValue}>{settings.nCtx}</Text>
            </View>
            <Text style={styles.rowHint}>
              Tokens of memory (higher uses more RAM)
            </Text>
            <View style={styles.slider}>
              <TouchableOpacity
                style={styles.sliderBtn}
                onPress={() =>
                  updateSettings({ nCtx: Math.max(512, settings.nCtx - 512) })
                }
              >
                <Feather name="minus" size={14} color={colors.foreground} />
              </TouchableOpacity>
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderFill,
                    {
                      width: `${((settings.nCtx - 512) / (8192 - 512)) * 100}%`,
                    },
                  ]}
                />
              </View>
              <TouchableOpacity
                style={styles.sliderBtn}
                onPress={() =>
                  updateSettings({ nCtx: Math.min(8192, settings.nCtx + 512) })
                }
              >
                <Feather name="plus" size={14} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chat Template</Text>
        </View>
        <View style={styles.card}>
          {TEMPLATES.map((t, i) => (
            <Pressable
              key={t.value}
              style={
                i < TEMPLATES.length - 1
                  ? styles.templateRow
                  : styles.templateRowLast
              }
              onPress={() => updateSettings({ chatTemplate: t.value })}
            >
              <Text style={styles.templateLabel}>{t.label}</Text>
              {settings.chatTemplate === t.value && (
                <Feather name="check" size={18} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hardware</Text>
        </View>
        <View style={styles.card}>
          <SliderRow
            label="GPU Layers"
            hint="Vulkan GPU offload layers (0 = CPU only)"
            value={settings.nGpuLayers}
            min={0}
            max={99}
            step={1}
            onChange={(v) => updateSettings({ nGpuLayers: v })}
          />
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}
