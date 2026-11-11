import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ChatMessage } from '../types';
import { minyxMobile } from '../services/minyxEngine';
import { colors, radius, spacing } from '../theme';

interface ChatScreenProps {
  initialPrompt?: string;
}

export default function ChatScreen({ initialPrompt }: ChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'companion',
      text: 'Salutations Eric. Je me souviens de nos avancées sur le projet SAHELION et de notre préparation pour le Hackathon Meta. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: '11:00',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isProcessing) return;

    setInputText('');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const companionReply = await minyxMobile.processUserMessage(text);
      setMessages((prev) => [...prev, companionReply]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={80}
    >
      <View style={styles.topPanel}>
        <View style={styles.memoryIndicator}>
          <View style={styles.memoryDot} />
          <Text style={styles.memoryText}>MemoClaw actif</Text>
        </View>
        <Text style={styles.topTitle}>Conversation avec Kael</Text>
        <Text style={styles.topSubtitle}>
          Une interface plus simple, centrée sur l'échange et les actions utiles.
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <View
              key={msg.id}
              style={[styles.messageBubble, isUser ? styles.userBubble : styles.companionBubble]}
            >
              <View style={styles.bubbleMeta}>
                <Text style={styles.senderHeader}>{isUser ? 'Vous' : 'Kael'}</Text>
                <Text style={styles.timestampText}>{msg.timestamp}</Text>
              </View>
              <Text style={styles.messageText}>{msg.text}</Text>

              {/* Tool Execution Card (Meta Llama Tool Call) */}
              {msg.toolCall && (
                <View style={styles.toolCard}>
                  <View style={styles.toolHeader}>
                    <Text style={styles.toolIcon}>
                      {msg.toolCall.tool === 'create_reminder' ? '⏰' : '🔍'}
                    </Text>
                    <Text style={styles.toolTitle}>
                      {msg.toolCall.tool === 'create_reminder'
                        ? 'ACTION MOBILE EXÉCUTÉE : RAPPEL CRÉÉ'
                        : 'ACTION EXÉCUTÉE : RECHERCHE WEB'}
                    </Text>
                  </View>

                  <Text style={styles.toolSummary}>{msg.toolCall.summary}</Text>

                  {msg.toolCall.details && (
                    <View style={styles.toolDetails}>
                      {msg.toolCall.tool === 'create_reminder' ? (
                        <Text style={styles.toolDetailText}>
                          ✓ Notification locale enregistrée sur votre smartphone.
                        </Text>
                      ) : (
                        <Text style={styles.toolDetailText}>
                          {msg.toolCall.details.summary}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {isProcessing && (
          <View style={[styles.messageBubble, styles.companionBubble]}>
            <View style={styles.thinkingRow}>
              <ActivityIndicator size="small" color="#38bdf8" />
              <Text style={styles.thinkingText}>Llama 3.3 consulte MemoClaw & réfléchit...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Écris un message ou demande une tâche..."
          placeholderTextColor="#64748b"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
        />

        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          activeOpacity={0.7}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isProcessing}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topPanel: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 12,
    gap: 6,
  },
  memoryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  memoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  memoryText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  topTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  topSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 8,
  },
  companionBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 8,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  senderHeader: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.72)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  timestampText: {
    color: 'rgba(255, 255, 255, 0.54)',
    fontSize: 10,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  toolCard: {
    marginTop: 10,
    backgroundColor: colors.successSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    padding: 10,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  toolIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  toolTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 0.5,
  },
  toolSummary: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  toolDetails: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(52, 211, 153, 0.2)',
  },
  toolDetailText: {
    fontSize: 11,
    color: '#d1fae5',
    lineHeight: 16,
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  thinkingText: {
    color: colors.primary,
    fontSize: 12,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surfaceStrong,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(56, 189, 248, 0.3)',
  },
  sendIcon: {
    color: '#04111d',
    fontSize: 16,
    marginLeft: 2,
  },
});
