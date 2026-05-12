import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const CONVERSATIONS_KEY = "chat_conversations";
const ACTIVE_CONV_KEY = "chat_active_conversation";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface ChatContextValue {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  createConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addUserMessage: (content: string) => Message;
  addAssistantMessage: () => Message;
  updateStreamingMessage: (id: string, content: string) => void;
  finalizeMessage: (id: string, content: string) => void;
  clearMessages: () => void;
}

const ChatCtx = createContext<ChatContextValue | null>(null);

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function makeConversation(): Conversation {
  const id = generateId();
  return {
    id,
    title: "New Chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function titleFromMessages(messages: Message[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New Chat";
  return first.content.slice(0, 40) + (first.content.length > 40 ? "…" : "");
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);

  useEffect(() => {
    loadFromStorage();
  }, []);

  async function loadFromStorage() {
    try {
      const raw = await AsyncStorage.getItem(CONVERSATIONS_KEY);
      const convs: Conversation[] = raw ? JSON.parse(raw) : [];
      const activeId = await AsyncStorage.getItem(ACTIVE_CONV_KEY);

      if (convs.length === 0) {
        const fresh = makeConversation();
        setConversations([fresh]);
        setActiveConversation(fresh);
      } else {
        setConversations(convs);
        const found = convs.find((c) => c.id === activeId);
        setActiveConversation(found ?? convs[0]);
      }
    } catch {
      const fresh = makeConversation();
      setConversations([fresh]);
      setActiveConversation(fresh);
    }
  }

  async function persistConversations(convs: Conversation[]) {
    await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
  }

  const createConversation = useCallback(() => {
    const conv = makeConversation();
    setConversations((prev) => {
      const next = [conv, ...prev];
      persistConversations(next);
      return next;
    });
    setActiveConversation(conv);
    AsyncStorage.setItem(ACTIVE_CONV_KEY, conv.id);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const found = prev.find((c) => c.id === id);
      if (found) {
        setActiveConversation(found);
        AsyncStorage.setItem(ACTIVE_CONV_KEY, id);
      }
      return prev;
    });
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        persistConversations(next);
        if (activeConversation?.id === id) {
          const newActive = next[0] ?? makeConversation();
          if (next.length === 0) {
            const fresh = makeConversation();
            const withFresh = [fresh];
            persistConversations(withFresh);
            setActiveConversation(fresh);
            AsyncStorage.setItem(ACTIVE_CONV_KEY, fresh.id);
            return withFresh;
          }
          setActiveConversation(newActive);
          AsyncStorage.setItem(ACTIVE_CONV_KEY, newActive.id);
        }
        return next;
      });
    },
    [activeConversation]
  );

  const updateConv = useCallback(
    (updater: (conv: Conversation) => Conversation) => {
      if (!activeConversation) return;
      const id = activeConversation.id;
      setConversations((prev) => {
        const next = prev.map((c) => (c.id === id ? updater(c) : c));
        persistConversations(next);
        const updated = next.find((c) => c.id === id);
        if (updated) setActiveConversation(updated);
        return next;
      });
    },
    [activeConversation]
  );

  const addUserMessage = useCallback(
    (content: string): Message => {
      const msg: Message = {
        id: generateId(),
        role: "user",
        content,
        timestamp: Date.now(),
      };
      updateConv((conv) => ({
        ...conv,
        messages: [...conv.messages, msg],
        title: titleFromMessages([...conv.messages, msg]),
        updatedAt: Date.now(),
      }));
      return msg;
    },
    [updateConv]
  );

  const addAssistantMessage = useCallback((): Message => {
    const msg: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
    };
    updateConv((conv) => ({
      ...conv,
      messages: [...conv.messages, msg],
      updatedAt: Date.now(),
    }));
    return msg;
  }, [updateConv]);

  const updateStreamingMessage = useCallback(
    (id: string, content: string) => {
      if (!activeConversation) return;
      const convId = activeConversation.id;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === id ? { ...m, content, isStreaming: true } : m
                ),
              }
            : c
        )
      );
      setActiveConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === id ? { ...m, content, isStreaming: true } : m
              ),
            }
          : prev
      );
    },
    [activeConversation]
  );

  const finalizeMessage = useCallback(
    (id: string, content: string) => {
      updateConv((conv) => ({
        ...conv,
        messages: conv.messages.map((m) =>
          m.id === id ? { ...m, content, isStreaming: false } : m
        ),
        updatedAt: Date.now(),
      }));
    },
    [updateConv]
  );

  const clearMessages = useCallback(() => {
    updateConv((conv) => ({
      ...conv,
      messages: [],
      title: "New Chat",
      updatedAt: Date.now(),
    }));
  }, [updateConv]);

  const messages = activeConversation?.messages ?? [];

  return (
    <ChatCtx.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        createConversation,
        selectConversation,
        deleteConversation,
        addUserMessage,
        addAssistantMessage,
        updateStreamingMessage,
        finalizeMessage,
        clearMessages,
      }}
    >
      {children}
    </ChatCtx.Provider>
  );
}
