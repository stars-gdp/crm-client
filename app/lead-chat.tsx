import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { observer } from "mobx-react";
import { format } from "date-fns";
import { API_URL, API_ENDPOINT } from "./config/api.config";
import leadStore from "./stores/leads.store";
import { useRouter } from "expo-router";
import SocketService from "@/app/services/socket.service";
import LeadActionsPopup from "@/app/components/popups/lead-actions.popup";

// Interface for conversation messages
interface IMessage {
  lead_id: number;
  message_id: number;
  media_id: string | null;
  lead_name: string;
  lead_phone: string;
  message_text: string;
  direction: "incoming" | "outgoing";
  timestamp: string | null;
}

// Message bubble component
const MessageBubble = ({ message }: { message: IMessage }) => {
  const isOutgoing = message.direction === "outgoing";
  const formattedTime = message.timestamp
    ? format(new Date(message.timestamp), "MMM dd, h:mm a")
    : "Sending...";

  return (
    <View
      style={[
        styles.messageBubbleContainer,
        isOutgoing
          ? styles.outgoingMessageContainer
          : styles.incomingMessageContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isOutgoing ? styles.outgoingBubble : styles.incomingBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isOutgoing ? styles.outgoingText : styles.incomingText,
          ]}
        >
          {message.message_text}
        </Text>

        {message.media_id && (
          <View style={styles.mediaIndicator}>
            <Text style={styles.mediaIndicatorText}>📎 Media attachment</Text>
          </View>
        )}

        <Text
          style={[
            styles.messageTime,
            isOutgoing ? styles.outgoingTime : styles.incomingTime,
          ]}
        >
          {formattedTime}
        </Text>
      </View>
    </View>
  );
};

// Lead chat screen component
const LeadChat = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const handleMessageActivity = (data: any) => {
      const currentSelectedLead = leadStore.selectedLead;
      if (data.leadPhone === currentSelectedLead?.lead_phone) {
        fetchConversations();
      }
    };

    SocketService.onMessageActivity(handleMessageActivity);

    // Don't forget to clean up the socket event listener
    return () => {
      SocketService.offMessageActivity(handleMessageActivity);
    };
  }, []);

  // Function to fetch conversations
  const fetchConversations = async () => {
    if (!leadStore.selectedLead) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}${API_ENDPOINT}/leads/phone/${leadStore.selectedLead.lead_phone}/conversations`,
      );

      if (!response.ok) {
        throw new Error(`Error fetching conversations: ${response.status}`);
      }

      const data = await response.json();
      setMessages(data);
    } catch (err) {
      setError(
        `Failed to load conversations: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to send a new message
  const sendMessage = async () => {
    if (!leadStore.selectedLead || !newMessage.trim()) return;

    setIsSending(true);

    // Create a temporary message to show immediately in the UI
    const tempMessage: IMessage = {
      lead_id: leadStore.selectedLead.id,
      message_id: -Date.now(), // Temporary negative ID
      media_id: null,
      lead_name: leadStore.selectedLead.lead_name,
      lead_phone: leadStore.selectedLead.lead_phone,
      message_text: newMessage,
      direction: "outgoing",
      timestamp: null,
    };

    // Add to messages
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await fetch(
        `${API_URL}${API_ENDPOINT}/leads/phone/${leadStore.selectedLead.lead_phone}/send-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: newMessage }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // Refresh the conversation to get the updated message with proper ID
        fetchConversations();
      } else {
        throw new Error("Failed to send message");
      }
    } catch (err) {
      setError(
        `Failed to send message: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      console.error(err);

      // Remove the temporary message
      setMessages((prev) =>
        prev.filter((m) => m.message_id !== tempMessage.message_id),
      );
    } finally {
      setIsSending(false);
    }
  };

  const router = useRouter();

  // Fetch conversations when component mounts or selected lead changes
  useEffect(() => {
    if (leadStore.selectedLead) {
      fetchConversations();
    } else {
      setMessages([]);
    }
  }, [leadStore.selectedLead?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  // If no lead is selected, show a placeholder
  if (!leadStore.selectedLead) {
    return (
      <SafeAreaView style={styles.noSelectionContainer}>
        <Text style={styles.noSelectionText}>
          Please select a lead to view the conversation
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header with lead info */}
      <View style={styles.header}>
        {Platform.OS !== "web" && (
          <TouchableOpacity
            onPress={() => {
              leadStore.selectLead(null);
              router.back();
            }}
            style={{ height: "100%", width: 50, backgroundColor: "red" }}
          />
        )}
        <View>
          <Text style={styles.headerTitle}>
            {leadStore.selectedLead.lead_name}
          </Text>
          <Text style={styles.headerSubtitle}>
            {leadStore.selectedLead.lead_phone}
          </Text>
        </View>
      </View>

      {/* Message list */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {isLoading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        ) : error && messages.length === 0 ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchConversations}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => `msg-${item.message_id}`}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={true}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>
                  Send a message to start the conversation
                </Text>
              </View>
            }
          />
        )}

        {/* Input area */}
        <View style={styles.inputContainer}>
          <LeadActionsPopup />
          <TextInput
            returnKeyType={"done"}
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            multiline
            maxLength={1000}
            autoCapitalize="sentences"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !newMessage.trim() || isSending
                ? styles.sendButtonDisabled
                : null,
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Styles optimized for web and mobile
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  noSelectionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  noSelectionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  header: {
    gap: 10,
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ff3b30",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#007aff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    padding: 10,
    paddingBottom: 20,
  },
  messageBubbleContainer: {
    marginVertical: 5,
    maxWidth: "80%",
  },
  outgoingMessageContainer: {
    alignSelf: "flex-end",
  },
  incomingMessageContainer: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    borderRadius: 18,
    padding: 12,
    minWidth: 80,
  },
  outgoingBubble: {
    backgroundColor: "#DCF8C6",
    borderTopRightRadius: 4,
  },
  incomingBubble: {
    backgroundColor: "white",
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  outgoingText: {
    color: "#303030",
  },
  incomingText: {
    color: "#303030",
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  outgoingTime: {
    color: "#7c8c7c",
  },
  incomingTime: {
    color: "#8c8c8c",
  },
  mediaIndicator: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
    padding: 6,
    marginTop: 6,
  },
  mediaIndicatorText: {
    fontSize: 13,
    color: "#555",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#999",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    gap: 8,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 10, // To center text vertically
    paddingRight: 10,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: "#128C7E",
    width: 50,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: "#A8DBAD",
  },
  sendButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default observer(LeadChat);
