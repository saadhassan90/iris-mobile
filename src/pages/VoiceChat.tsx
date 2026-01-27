import { useConversationContext } from "@/components/layout/AppLayout";
import ChatThread from "@/components/chat/ChatThread";
import MessageInput from "@/components/chat/MessageInput";
import { supabase } from "@/integrations/supabase/client";
import { useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const VoiceChat = () => {
  const {
    messages,
    isLoading,
    setIsLoading,
    addMessage,
    updateMessageStatus,
  } = useConversationContext();

  // Keep conversation history for context
  const conversationHistoryRef = useRef<Message[]>([]);

  const handleSendMessage = async (content: string) => {
    // Add user message to UI
    const userMessage = addMessage(content, 'user');
    
    // Mark as delivered
    setTimeout(() => {
      updateMessageStatus(userMessage.id, 'delivered');
    }, 300);

    // Add to conversation history
    conversationHistoryRef.current.push({ role: "user", content });

    setIsLoading(true);

    try {
      // Call clawdbot via edge function
      const { data, error } = await supabase.functions.invoke("clawdbot-chat", {
        body: {
          message: content,
          conversationHistory: conversationHistoryRef.current.slice(0, -1), // Exclude current message (already in 'message')
        },
      });

      // Mark as transferred (reached AI agent)
      updateMessageStatus(userMessage.id, 'transferred');

      if (error) {
        throw new Error(error.message || "Failed to get response");
      }

      const responseText = data?.response || "I couldn't process that request.";
      
      // Add assistant response to history and UI
      conversationHistoryRef.current.push({ role: "assistant", content: responseText });
      addMessage(responseText, 'assistant');

    } catch (error) {
      console.error("Chat error:", error);
      addMessage(
        "Sorry, I encountered an error. Please try again.",
        'assistant'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      updateMessageStatus(messageId, 'sending');
      setTimeout(() => {
        updateMessageStatus(messageId, 'delivered');
        setTimeout(() => {
          updateMessageStatus(messageId, 'transferred');
        }, 500);
      }, 500);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Chat thread */}
      <ChatThread
        messages={messages}
        isLoading={isLoading}
        onRetry={handleRetry}
        onSuggestionClick={handleSuggestionClick}
      />

      {/* Text-only message input (voice disabled) */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        hideVoiceButton={true}
        placeholder="Ask Iris"
      />
    </div>
  );
};

export default VoiceChat;
