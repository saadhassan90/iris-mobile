import { useConversationContext } from "@/components/layout/AppLayout";
import ChatThread from "@/components/chat/ChatThread";
import MessageInput from "@/components/chat/MessageInput";
import VoiceOrb, { VoiceState } from "@/components/voice/VoiceOrb";
import { useIrisVoice } from "@/hooks/useIrisVoice";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";

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

  // Keep conversation history for text mode
  const conversationHistoryRef = useRef<Message[]>([]);

  // Voice callbacks
  const handleUserTranscript = useCallback((transcript: string) => {
    const userMessage = addMessage(transcript, 'user');
    setTimeout(() => updateMessageStatus(userMessage.id, 'transferred'), 300);
    conversationHistoryRef.current.push({ role: "user", content: transcript });
  }, [addMessage, updateMessageStatus]);

  const handleAgentResponse = useCallback((response: string) => {
    addMessage(response, 'assistant');
    conversationHistoryRef.current.push({ role: "assistant", content: response });
  }, [addMessage]);

  // Initialize voice hook
  const {
    connectionState,
    isSpeaking,
    inputVolume,
    outputVolume,
    startCall,
    endCall,
  } = useIrisVoice({
    onUserTranscript: handleUserTranscript,
    onAgentResponse: handleAgentResponse,
  });

  // Determine voice orb state
  const voiceState: VoiceState = useMemo(() => {
    if (connectionState === "connecting") return "processing";
    if (connectionState === "connected") {
      if (isSpeaking) return "speaking";
      return "listening";
    }
    return "idle";
  }, [connectionState, isSpeaking]);

  const isVoiceActive = connectionState !== "disconnected";

  // Handle text message send
  const handleSendMessage = async (content: string) => {
    const userMessage = addMessage(content, 'user');
    
    setTimeout(() => {
      updateMessageStatus(userMessage.id, 'delivered');
    }, 300);

    conversationHistoryRef.current.push({ role: "user", content });

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("clawdbot-chat", {
        body: {
          message: content,
          conversationHistory: conversationHistoryRef.current.slice(0, -1),
        },
      });

      updateMessageStatus(userMessage.id, 'transferred');

      if (error) {
        throw new Error(error.message || "Failed to get response");
      }

      const responseText = data?.response || "I couldn't process that request.";
      
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

  const handleVoiceToggle = () => {
    if (isVoiceActive) {
      endCall();
    } else {
      startCall();
    }
  };

  return (
    <div className="flex flex-1 flex-col h-full min-h-0">
      {/* Voice mode overlay */}
      {isVoiceActive && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
          {/* Voice orb */}
          <VoiceOrb
            state={voiceState}
            inputVolume={inputVolume}
            outputVolume={outputVolume}
            className="mb-8"
          />
          
          {/* Status text */}
          <p className="mb-8 text-lg text-muted-foreground">
            {connectionState === "connecting" && "Connecting..."}
            {connectionState === "connected" && isSpeaking && "Iris is speaking..."}
            {connectionState === "connected" && !isSpeaking && "Listening..."}
          </p>

          {/* End call button */}
          <Button
            variant="destructive"
            size="lg"
            className="h-14 w-14 rounded-full"
            onClick={endCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Chat thread - scrollable */}
      <ChatThread
        messages={messages}
        isLoading={isLoading}
        onRetry={handleRetry}
        onSuggestionClick={handleSuggestionClick}
      />

      {/* Message input with voice button */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        placeholder="Ask Iris"
        onVoiceClick={handleVoiceToggle}
        isVoiceActive={isVoiceActive}
        voiceConnecting={connectionState === "connecting"}
      />
    </div>
  );
};

export default VoiceChat;
