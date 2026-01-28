import { useCallback } from "react";
import { useConversationContext } from "@/components/layout/AppLayout";
import ChatThread from "@/components/chat/ChatThread";
import MessageInput from "@/components/chat/MessageInput";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Chat = () => {
  const {
    messages,
    addMessage,
    updateMessageStatus,
  } = useConversationContext();

  const handleSendMessage = useCallback(async (content: string, files?: File[]) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage = addMessage(content, 'user');
    setTimeout(() => updateMessageStatus(userMessage.id, 'transferred'), 300);

    // Build conversation history for context
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const { data, error } = await supabase.functions.invoke('clawdbot-chat', {
        body: {
          message: content,
          conversationHistory,
        },
      });

      if (error) throw error;

      if (data?.response) {
        addMessage(data.response, 'assistant');
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response. Please try again.');
    }
  }, [messages, addMessage, updateMessageStatus]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSendMessage(suggestion);
  }, [handleSendMessage]);

  const handleRetry = useCallback((messageId: string) => {
    // Find the message and resend
    const message = messages.find(m => m.id === messageId);
    if (message && message.role === 'user') {
      handleSendMessage(message.content);
    }
  }, [messages, handleSendMessage]);

  return (
    <div className="flex flex-1 flex-col h-full min-h-0">
      <ChatThread
        messages={messages}
        onRetry={handleRetry}
        onSuggestionClick={handleSuggestionClick}
      />
      <MessageInput
        onSendMessage={handleSendMessage}
        placeholder="Message Iris..."
      />
    </div>
  );
};

export default Chat;
