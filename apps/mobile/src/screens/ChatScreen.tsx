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
      {/* Top MemoClaw indicator */}
      <View style={styles.memoryIndicator}>
        <View style={styles.memoryDot} />
        <Text style={styles.memoryText}>MemoClaw actif • 5 souvenirs injectés dans Llama 3.3</Text>
      </View>

      {/* Messages Feed */}
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
              <Text style={styles.senderHeader}>
                {isUser ? 'Vous' : '💧 Kael (Esprit de l\'Eau)'} • {msg.timestamp}
              </Text>
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

      {/* Input Bar */}
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
    backgroundColor: '#030712',
  },
  memoryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 47, 73, 0.4)',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
  },
  memoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00f0ff',
    marginRight: 6,
  },
  memoryText: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0284c7',
    borderBottomRightRadius: 4,
  },
  companionBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderBottomLeftRadius: 4,
  },
  senderHeader: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#f8fafc',
  },
  toolCard: {
    marginTop: 10,
    backgroundColor: 'rgba(2, 44, 34, 0.5)',
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
    color: '#34d399',
    letterSpacing: 0.5,
  },
  toolSummary: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a7f3d0',
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
    color: '#7dd3fc',
    fontSize: 12,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(56, 189, 248, 0.25)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(2, 132, 199, 0.3)',
  },
  sendIcon: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 2,
  },
});
