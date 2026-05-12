import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Message } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  message: Message;
  onLongPress?: (message: Message) => void;
}

export default function MessageBubble({ message, onLongPress }: Props) {
  const colors = useColors();
  const isUser = message.role === "user";
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const styles = makeStyles(colors, isUser);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity
        onLongPress={() => onLongPress?.(message)}
        activeOpacity={0.85}
        style={styles.bubble}
      >
        {!isUser && (
          <View style={styles.aiLabel}>
            <Text style={styles.aiLabelText}>AI</Text>
          </View>
        )}
        <Text style={styles.text} selectable>
          {message.content}
          {message.isStreaming && <Text style={styles.cursor}>▊</Text>}
        </Text>
        <Text style={styles.time}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, isUser: boolean) {
  return StyleSheet.create({
    wrapper: {
      marginVertical: 4,
      marginHorizontal: 16,
      alignItems: isUser ? "flex-end" : "flex-start",
    },
    bubble: {
      maxWidth: "85%",
      backgroundColor: isUser ? colors.userBubble : colors.aiBubble,
      borderRadius: 18,
      borderBottomRightRadius: isUser ? 4 : 18,
      borderBottomLeftRadius: isUser ? 18 : 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 4,
    },
    aiLabel: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    aiLabelText: {
      color: "#fff",
      fontSize: 9,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
    text: {
      color: isUser ? colors.userBubbleForeground : colors.aiBubbleForeground,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: "Inter_400Regular",
    },
    cursor: {
      color: colors.primary,
    },
    time: {
      color: isUser
        ? "rgba(255,255,255,0.55)"
        : colors.mutedForeground,
      fontSize: 10,
      alignSelf: "flex-end",
      fontFamily: "Inter_400Regular",
    },
  });
}
