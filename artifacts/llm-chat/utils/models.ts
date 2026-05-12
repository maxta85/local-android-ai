export type ChatTemplate = "chatml" | "llama3" | "mistral" | "gemma" | "alpaca";

export interface ModelPreset {
  id: string;
  name: string;
  description: string;
  paramCount: string;
  size: string;
  sizeBytes: number;
  quantization: string;
  url: string;
  filename: string;
  chatTemplate: ChatTemplate;
  stopTokens: string[];
  recommendedContextLength: number;
  tags: string[];
}

export const PRESET_MODELS: ModelPreset[] = [
  {
    id: "phi-3.5-mini-q4",
    name: "Phi-3.5 Mini",
    description: "Microsoft's compact powerhouse. Fast replies, strong reasoning.",
    paramCount: "3.8B",
    size: "2.4 GB",
    sizeBytes: 2_400_000_000,
    quantization: "Q4_K_M",
    url: "https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf",
    filename: "Phi-3.5-mini-instruct-Q4_K_M.gguf",
    chatTemplate: "chatml",
    stopTokens: ["<|im_end|>", "<|end|>", "<|endoftext|>"],
    recommendedContextLength: 4096,
    tags: ["fast", "compact", "recommended"],
  },
  {
    id: "llama-3.2-3b-q4",
    name: "Llama 3.2 3B",
    description: "Meta's lightning-fast small model. Best for quick conversations.",
    paramCount: "3B",
    size: "2.0 GB",
    sizeBytes: 2_000_000_000,
    quantization: "Q4_K_M",
    url: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
    filename: "Llama-3.2-3B-Instruct-Q4_K_M.gguf",
    chatTemplate: "llama3",
    stopTokens: ["<|eot_id|>", "<|end_of_text|>", "<|start_header_id|>"],
    recommendedContextLength: 4096,
    tags: ["fast", "compact"],
  },
  {
    id: "mistral-7b-v03-q4",
    name: "Mistral 7B",
    description: "Balanced speed and intelligence. Great all-rounder for any task.",
    paramCount: "7B",
    size: "4.1 GB",
    sizeBytes: 4_100_000_000,
    quantization: "Q4_K_M",
    url: "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf",
    filename: "mistral-7b-instruct-v0.2.Q4_K_M.gguf",
    chatTemplate: "mistral",
    stopTokens: ["</s>", "[/INST]"],
    recommendedContextLength: 4096,
    tags: ["balanced", "popular"],
  },
  {
    id: "qwen2.5-7b-q4",
    name: "Qwen 2.5 7B",
    description: "Alibaba's top 7B model. Exceptional reasoning and multilingual.",
    paramCount: "7B",
    size: "4.7 GB",
    sizeBytes: 4_700_000_000,
    quantization: "Q4_K_M",
    url: "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF/resolve/main/qwen2.5-7b-instruct-q4_k_m.gguf",
    filename: "qwen2.5-7b-instruct-q4_k_m.gguf",
    chatTemplate: "chatml",
    stopTokens: ["<|im_end|>", "<|endoftext|>"],
    recommendedContextLength: 8192,
    tags: ["smart", "multilingual"],
  },
  {
    id: "gemma2-9b-q4",
    name: "Gemma 2 9B",
    description: "Google's most capable on-device model. Deep, nuanced responses.",
    paramCount: "9B",
    size: "5.7 GB",
    sizeBytes: 5_700_000_000,
    quantization: "Q4_K_M",
    url: "https://huggingface.co/bartowski/gemma-2-9b-it-GGUF/resolve/main/gemma-2-9b-it-Q4_K_M.gguf",
    filename: "gemma-2-9b-it-Q4_K_M.gguf",
    chatTemplate: "gemma",
    stopTokens: ["<end_of_turn>", "<eos>"],
    recommendedContextLength: 4096,
    tags: ["powerful", "google"],
  },
];

export function getModelById(id: string): ModelPreset | undefined {
  return PRESET_MODELS.find((m) => m.id === id);
}

export function getModelByFilename(filename: string): ModelPreset | undefined {
  return PRESET_MODELS.find((m) => m.filename === filename);
}
