import { ChatTemplate } from "./models";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export function formatPrompt(
  messages: ChatMessage[],
  systemPrompt: string,
  template: ChatTemplate
): string {
  switch (template) {
    case "chatml": {
      let prompt = `<|im_start|>system\n${systemPrompt}<|im_end|>\n`;
      for (const msg of messages) {
        prompt += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
      }
      prompt += "<|im_start|>assistant\n";
      return prompt;
    }

    case "llama3": {
      let prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|>`;
      for (const msg of messages) {
        const role = msg.role === "user" ? "user" : "assistant";
        prompt += `<|start_header_id|>${role}<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
      }
      prompt += "<|start_header_id|>assistant<|end_header_id|>\n\n";
      return prompt;
    }

    case "mistral": {
      let prompt = "";
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (msg.role === "user") {
          const content =
            i === 0 ? `${systemPrompt}\n\n${msg.content}` : msg.content;
          prompt += `[INST] ${content} [/INST]`;
        } else {
          prompt += ` ${msg.content}</s>`;
        }
      }
      return prompt;
    }

    case "gemma": {
      let prompt = `<start_of_turn>user\n${systemPrompt}\n\n`;
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (msg.role === "user") {
          if (i === 0) {
            prompt += `${msg.content}<end_of_turn>\n<start_of_turn>model\n`;
          } else {
            prompt += `<start_of_turn>user\n${msg.content}<end_of_turn>\n<start_of_turn>model\n`;
          }
        } else {
          prompt += `${msg.content}<end_of_turn>\n`;
        }
      }
      return prompt;
    }

    case "alpaca":
    default: {
      let prompt = `### System:\n${systemPrompt}\n\n`;
      for (const msg of messages) {
        if (msg.role === "user") {
          prompt += `### Human:\n${msg.content}\n\n`;
        } else {
          prompt += `### Assistant:\n${msg.content}\n\n`;
        }
      }
      prompt += "### Assistant:\n";
      return prompt;
    }
  }
}
