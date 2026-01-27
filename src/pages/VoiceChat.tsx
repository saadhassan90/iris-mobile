import { useState } from "react";
import { useConversationContext } from "@/components/layout/AppLayout";
import VoiceOrb, { VoiceState } from "@/components/voice/VoiceOrb";
import ChatThread from "@/components/chat/ChatThread";
import MessageInput from "@/components/chat/MessageInput";

const VoiceChat = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [isListening, setIsListening] = useState(false);

  const {
    messages,
    isLoading,
    setIsLoading,
    addMessage,
    updateMessageStatus,
  } = useConversationContext();

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage = addMessage(content, 'user');
    
    // Simulate API call - delivered status
    setTimeout(() => {
      updateMessageStatus(userMessage.id, 'delivered');
    }, 500);

    // Simulate transfer to AI agent
    setTimeout(() => {
      updateMessageStatus(userMessage.id, 'transferred');
    }, 1000);

    // Simulate AI response
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addMessage(
        "I've received your message! This is a simulated response. Once connected to the clawdbot AI backend, you'll get real responses here.",
        'assistant'
      );
    }, 2500);
  };

  const handleVoiceStart = () => {
    setIsListening(true);
    setVoiceState("listening");
    
    // Simulate voice processing after 3 seconds
    setTimeout(() => {
      setVoiceState("processing");
      setTimeout(() => {
        // Simulate transcribed message
        handleSendMessage("This is a simulated voice message transcription.");
        setVoiceState("idle");
        setIsListening(false);
      }, 1500);
    }, 3000);
  };

  const handleVoiceStop = () => {
    setIsListening(false);
    if (voiceState === "listening") {
      setVoiceState("processing");
      setTimeout(() => {
        handleSendMessage("Voice message stopped early - transcription would go here.");
        setVoiceState("idle");
      }, 1000);
    } else {
      setVoiceState("idle");
    }
  };

  const handleRetry = (messageId: string) => {
    // Find the message and retry sending it
    const message = messages.find(m => m.id === messageId);
    if (message) {
      updateMessageStatus(messageId, 'sending');
      // Simulate retry
      setTimeout(() => {
        updateMessageStatus(messageId, 'delivered');
        setTimeout(() => {
          updateMessageStatus(messageId, 'transferred');
        }, 500);
      }, 500);
    }
  };

  const getStatusText = () => {
    switch (voiceState) {
      case "listening":
        return "Listening...";
      case "processing":
        return "Processing...";
      case "speaking":
        return "Speaking...";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Voice orb section - visible when actively listening/processing */}
      {voiceState !== "idle" && (
        <div className="flex flex-col items-center justify-center py-6 border-b">
          <VoiceOrb state={voiceState} />
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            {getStatusText()}
          </p>
        </div>
      )}

      {/* Chat thread */}
      <ChatThread
        messages={messages}
        isLoading={isLoading}
        onRetry={handleRetry}
      />

      {/* Message input with integrated voice button */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onVoiceStart={handleVoiceStart}
        onVoiceStop={handleVoiceStop}
        isListening={isListening}
        disabled={isLoading}
      />
    </div>
  );
};

export default VoiceChat;
