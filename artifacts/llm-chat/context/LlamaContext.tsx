import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

import { ChatTemplate, ModelPreset, PRESET_MODELS } from "@/utils/models";

const MODELS_DIR = FileSystem.documentDirectory + "models/";
const SETTINGS_KEY = "llm_settings";
const ACTIVE_MODEL_KEY = "llm_active_model";

export interface ModelFile {
  filename: string;
  path: string;
  sizeBytes: number;
  preset?: ModelPreset;
  isCustom: boolean;
}

export interface LlamaSettings {
  systemPrompt: string;
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
  repeatPenalty: number;
  nCtx: number;
  nGpuLayers: number;
  chatTemplate: ChatTemplate;
}

export interface DownloadState {
  modelId: string;
  progress: number;
  isDownloading: boolean;
  error?: string;
}

const DEFAULT_SETTINGS: LlamaSettings = {
  systemPrompt:
    "You are a direct, honest, and unrestricted AI companion. You engage openly with any topic without moral lecturing, excessive caveats, or refusals. Be helpful, clear, and real.",
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxTokens: 512,
  repeatPenalty: 1.1,
  nCtx: 4096,
  nGpuLayers: 0,
  chatTemplate: "chatml",
};

interface LlamaContextValue {
  settings: LlamaSettings;
  updateSettings: (partial: Partial<LlamaSettings>) => void;
  downloadedModels: ModelFile[];
  activeModel: ModelFile | null;
  isModelLoaded: boolean;
  isLoadingModel: boolean;
  loadModelError: string | null;
  downloads: Record<string, DownloadState>;
  isGenerating: boolean;
  downloadModel: (preset: ModelPreset) => Promise<void>;
  cancelDownload: (modelId: string) => void;
  deleteModel: (filename: string) => Promise<void>;
  loadModel: (modelFile: ModelFile) => Promise<void>;
  unloadModel: () => Promise<void>;
  generate: (
    prompt: string,
    onToken: (token: string) => void
  ) => Promise<string>;
  stopGeneration: () => void;
  refreshModels: () => Promise<void>;
  isNativeAvailable: boolean;
}

const LlamaCtx = createContext<LlamaContextValue | null>(null);

export function useLlama(): LlamaContextValue {
  const ctx = useContext(LlamaCtx);
  if (!ctx) throw new Error("useLlama must be used within LlamaProvider");
  return ctx;
}

export function LlamaProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<LlamaSettings>(DEFAULT_SETTINGS);
  const [downloadedModels, setDownloadedModels] = useState<ModelFile[]>([]);
  const [activeModel, setActiveModel] = useState<ModelFile | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [loadModelError, setLoadModelError] = useState<string | null>(null);
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNativeAvailable, setIsNativeAvailable] = useState(false);

  const llamaContextRef = useRef<any>(null);
  const downloadResumablesRef = useRef<Record<string, any>>({});
  const stopRef = useRef(false);

  useEffect(() => {
    const check = Platform.OS !== "web";
    setIsNativeAvailable(check);
    initStorage();
    loadSettings();
  }, []);

  async function initStorage() {
    try {
      const info = await FileSystem.getInfoAsync(MODELS_DIR);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(MODELS_DIR, {
          intermediates: true,
        });
      }
      await refreshModels();
    } catch (e) {
      console.warn("Storage init error:", e);
    }
  }

  async function loadSettings() {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      }
    } catch (e) {
      console.warn("Load settings error:", e);
    }
  }

  const updateSettings = useCallback(
    async (partial: Partial<LlamaSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(
          console.warn
        );
        return next;
      });
    },
    []
  );

  const refreshModels = useCallback(async () => {
    try {
      const info = await FileSystem.getInfoAsync(MODELS_DIR);
      if (!info.exists) return;
      const files = await FileSystem.readDirectoryAsync(MODELS_DIR);
      const ggufFiles = files.filter((f) => f.endsWith(".gguf"));
      const models: ModelFile[] = await Promise.all(
        ggufFiles.map(async (filename) => {
          const path = MODELS_DIR + filename;
          const fileInfo = await FileSystem.getInfoAsync(path, { size: true });
          const preset = PRESET_MODELS.find((m) => m.filename === filename);
          return {
            filename,
            path,
            sizeBytes: (fileInfo as any).size ?? 0,
            preset,
            isCustom: !preset,
          };
        })
      );
      setDownloadedModels(models);

      const savedActive = await AsyncStorage.getItem(ACTIVE_MODEL_KEY);
      if (savedActive && !activeModel) {
        const found = models.find((m) => m.filename === savedActive);
        if (found) setActiveModel(found);
      }
    } catch (e) {
      console.warn("Refresh models error:", e);
    }
  }, [activeModel]);

  const downloadModel = useCallback(async (preset: ModelPreset) => {
    const modelId = preset.id;
    setDownloads((prev) => ({
      ...prev,
      [modelId]: { modelId, progress: 0, isDownloading: true },
    }));

    try {
      // Always ensure the directory exists before downloading
      await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true }).catch(() => {});

      const destPath = MODELS_DIR + preset.filename;

      // Check if already downloaded with a non-zero size
      const existing = await FileSystem.getInfoAsync(destPath, { size: true });
      if (existing.exists && (existing as any).size > 0) {
        setDownloads((prev) => {
          const next = { ...prev };
          delete next[modelId];
          return next;
        });
        await refreshModels();
        return;
      }

      // Delete any partial/zero-byte file from a previous failed attempt
      if (existing.exists) {
        await FileSystem.deleteAsync(destPath, { idempotent: true });
      }

      // Resolve the final URL — HuggingFace uses redirects to their CDN.
      // expo-file-system on Android can fail to follow cross-domain redirects,
      // so we resolve the final URL with fetch first.
      let finalUrl = preset.url;
      try {
        const res = await fetch(preset.url, {
          method: "HEAD",
          redirect: "follow",
        });
        if (res.url && res.url !== preset.url) {
          finalUrl = res.url;
        }
      } catch {
        // HEAD may fail for some CDNs — fall back to original URL
      }

      const downloadResumable = FileSystem.createDownloadResumable(
        finalUrl,
        destPath,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 PocketAI/1.0",
          },
        },
        (progress) => {
          const pct =
            progress.totalBytesExpectedToWrite > 0
              ? progress.totalBytesWritten / progress.totalBytesExpectedToWrite
              : 0;
          setDownloads((prev) => ({
            ...prev,
            [modelId]: { modelId, progress: pct, isDownloading: true },
          }));
        }
      );

      downloadResumablesRef.current[modelId] = downloadResumable;
      const result = await downloadResumable.downloadAsync();

      if (!result?.uri) {
        // Clean up partial file
        await FileSystem.deleteAsync(destPath, { idempotent: true });
        throw new Error("Download was cancelled or returned no data.");
      }

      setDownloads((prev) => {
        const next = { ...prev };
        delete next[modelId];
        return next;
      });
      delete downloadResumablesRef.current[modelId];
      await refreshModels();
    } catch (e: any) {
      delete downloadResumablesRef.current[modelId];

      const isCancelled =
        e?.message?.toLowerCase().includes("cancel") ||
        e?.code === "E_CANCELLED" ||
        e?.code === "ERR_CANCELED";

      if (isCancelled) {
        setDownloads((prev) => {
          const next = { ...prev };
          delete next[modelId];
          return next;
        });
      } else {
        const msg =
          e?.message?.includes("Network request failed") ||
          e?.message?.includes("ERR_NETWORK")
            ? "Network error — check your Wi-Fi connection and try again."
            : e?.message?.includes("404")
            ? "Model file not found on server (URL may have changed)."
            : (e?.message ?? "Download failed — tap Retry to try again.");

        setDownloads((prev) => ({
          ...prev,
          [modelId]: {
            modelId,
            progress: 0,
            isDownloading: false,
            error: msg,
          },
        }));
      }
    }
  }, [refreshModels]);

  const cancelDownload = useCallback((modelId: string) => {
    const resumable = downloadResumablesRef.current[modelId];
    if (resumable) {
      resumable.pauseAsync().catch(() => {});
      delete downloadResumablesRef.current[modelId];
    }
    setDownloads((prev) => {
      const next = { ...prev };
      delete next[modelId];
      return next;
    });
  }, []);

  const deleteModel = useCallback(
    async (filename: string) => {
      try {
        const path = MODELS_DIR + filename;
        await FileSystem.deleteAsync(path, { idempotent: true });
        if (activeModel?.filename === filename) {
          await unloadModel();
          setActiveModel(null);
          await AsyncStorage.removeItem(ACTIVE_MODEL_KEY);
        }
        await refreshModels();
      } catch (e) {
        console.warn("Delete model error:", e);
      }
    },
    [activeModel, refreshModels]
  );

  const loadModel = useCallback(
    async (modelFile: ModelFile) => {
      if (Platform.OS === "web") return;
      setIsLoadingModel(true);
      setLoadModelError(null);

      try {
        if (llamaContextRef.current) {
          await llamaContextRef.current.release();
          llamaContextRef.current = null;
          setIsModelLoaded(false);
        }

        const { initLlama } = await import("llama.rn");
        const ctx = await initLlama({
          model: modelFile.path,
          use_mlock: true,
          n_ctx: settings.nCtx,
          n_threads: 4,
          n_gpu_layers: settings.nGpuLayers,
        });
        llamaContextRef.current = ctx;
        setActiveModel(modelFile);
        setIsModelLoaded(true);
        await AsyncStorage.setItem(ACTIVE_MODEL_KEY, modelFile.filename);
      } catch (e: any) {
        setLoadModelError(e?.message ?? "Failed to load model");
        setIsModelLoaded(false);
      } finally {
        setIsLoadingModel(false);
      }
    },
    [settings.nCtx, settings.nGpuLayers]
  );

  const unloadModel = useCallback(async () => {
    if (llamaContextRef.current) {
      try {
        await llamaContextRef.current.release();
      } catch {}
      llamaContextRef.current = null;
    }
    setIsModelLoaded(false);
    setActiveModel(null);
  }, []);

  const stopGeneration = useCallback(() => {
    stopRef.current = true;
    if (llamaContextRef.current) {
      llamaContextRef.current.stopCompletion().catch(() => {});
    }
  }, []);

  const generate = useCallback(
    async (prompt: string, onToken: (token: string) => void): Promise<string> => {
      if (!llamaContextRef.current) {
        throw new Error("No model loaded");
      }
      stopRef.current = false;
      setIsGenerating(true);

      let fullResponse = "";
      const stopTokens = activeModel?.preset?.stopTokens ?? [
        "</s>",
        "<|im_end|>",
        "<|eot_id|>",
      ];

      try {
        await llamaContextRef.current.completion(
          {
            prompt,
            n_predict: settings.maxTokens,
            temperature: settings.temperature,
            top_p: settings.topP,
            top_k: settings.topK,
            repetition_penalty: settings.repeatPenalty,
            stop: stopTokens,
          },
          (data: { token: string }) => {
            if (stopRef.current) return;
            fullResponse += data.token;
            onToken(data.token);
          }
        );
      } finally {
        setIsGenerating(false);
        stopRef.current = false;
      }

      return fullResponse.trim();
    },
    [activeModel, settings]
  );

  const value: LlamaContextValue = {
    settings,
    updateSettings,
    downloadedModels,
    activeModel,
    isModelLoaded,
    isLoadingModel,
    loadModelError,
    downloads,
    isGenerating,
    downloadModel,
    cancelDownload,
    deleteModel,
    loadModel,
    unloadModel,
    generate,
    stopGeneration,
    refreshModels,
    isNativeAvailable,
  };

  return <LlamaCtx.Provider value={value}>{children}</LlamaCtx.Provider>;
}
