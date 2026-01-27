import { useConversationContext } from "@/components/layout/AppLayout";
import VoiceOrb from "@/components/voice/VoiceOrb";
import ChatThread from "@/components/chat/ChatThread";
import MessageInput from "@/components/chat/MessageInput";
import { useIrisVoice } from "@/hooks/useIrisVoice";
import { Button } from "@/components/ui/button";
import { PhoneOff } from "lucide-react";

const VoiceChat = () => {
  const {
    messages,
    isLoading,
    setIsLoading,
    addMessage,
    updateMessageStatus,
  } = useConversationContext();

  const {
    connectionState,
    isSpeaking,
    inputVolume,
    outputVolume,
    startCall,
    endCall,
  } = useIrisVoice({
    onUserTranscript: (transcript) => {
      const msg = addMessage(transcript, 'user');
      // Mark as transferred since it came from voice
      updateMessageStatus(msg.id, 'transferred');
    },
    onAgentResponse: (response) => {
      addMessage(response, 'assistant');
    },
  });

  const isVoiceActive = connectionState === "connected" || connectionState === "connecting";
  const isConnecting = connectionState === "connecting";

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

  // Determine voice state for orb visualization
  const getVoiceState = () => {
    if (connectionState === "connecting") return "processing";
    if (connectionState === "connected") {
      if (isSpeaking) return "speaking";
      return "listening";
    }
    return "idle";
  };

  const getStatusText = () => {
    if (connectionState === "connecting") return "Connecting to Iris...";
    if (connectionState === "connected") {
      if (isSpeaking) return "Iris is speaking...";
      return "Listening...";
    }
    return "";
  };

  // Voice Mode UI
  if (isVoiceActive) {
    return (
      <div className="flex flex-1 flex-col">
        {/* Voice orb section - centered when in voice mode */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <VoiceOrb 
            state={getVoiceState()} 
            inputVolume={inputVolume}
            outputVolume={outputVolume}
          />
          <p className="mt-6 text-sm font-medium text-muted-foreground">
            {getStatusText()}
          </p>
          
          {/* End call button */}
          <Button
            variant="destructive"
            size="lg"
            className="mt-8 gap-2 rounded-full px-8"
            onClick={endCall}
          >
            <PhoneOff className="h-5 w-5" />
            End Call
          </Button>
        </div>

        {/* Scrollable chat thread below (collapsed view) */}
        {messages.length > 0 && (
          <div className="border-t max-h-48 overflow-hidden">
            <ChatThread
              messages={messages}
              isLoading={false}
              onRetry={handleRetry}
            />
          </div>
        )}
      </div>
    );
  }

  // Text Mode UI (default)
  return (
    <div className="flex flex-1 flex-col">
      {/* Chat thread */}
      <ChatThread
        messages={messages}
        isLoading={isLoading}
        onRetry={handleRetry}
      />

      {/* Message input with integrated voice button */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onVoiceStart={startCall}
        onVoiceStop={endCall}
        isListening={false}
        isConnecting={isConnecting}
        disabled={isLoading}
      />
    </div>
  );
};

export default VoiceChat;
