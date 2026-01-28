import { useConversationContext } from "@/components/layout/AppLayout";
import VoiceOrb, { VoiceState } from "@/components/voice/VoiceOrb";
import { useIrisVoice } from "@/hooks/useIrisVoice";
import { useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const VoiceChat = () => {
  const {
    messages,
    addMessage,
    updateMessageStatus,
  } = useConversationContext();

  // Keep conversation history for backend sync
  const conversationHistoryRef = useRef<Message[]>([]);

  // Voice callbacks
  const handleUserTranscript = useCallback(async (transcript: string) => {
    try {
      const userMessage = await addMessage(transcript, 'user');
      setTimeout(() => updateMessageStatus(userMessage.id, 'transferred'), 300);
      conversationHistoryRef.current.push({ role: "user", content: transcript });
    } catch (error) {
      console.error('Failed to save user transcript:', error);
    }
  }, [addMessage, updateMessageStatus]);

  const handleAgentResponse = useCallback(async (response: string) => {
    try {
      await addMessage(response, 'assistant');
      conversationHistoryRef.current.push({ role: "assistant", content: response });
    } catch (error) {
      console.error('Failed to save agent response:', error);
    }
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

  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";
  const isDisconnected = connectionState === "disconnected";

  // Get status text
  const statusText = useMemo(() => {
    if (isConnecting) return "Connecting...";
    if (isConnected && isSpeaking) return "Iris is speaking...";
    if (isConnected) return "Listening...";
    return "Tap to talk with Iris";
  }, [isConnecting, isConnected, isSpeaking]);

  return (
    <div className="flex flex-1 flex-col h-full min-h-0">
      {/* Main voice interface */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        {/* Voice orb */}
        <VoiceOrb
          state={voiceState}
          inputVolume={inputVolume}
          outputVolume={outputVolume}
          className="mb-6"
        />

        {/* Status text */}
        <p className="mb-8 text-center text-lg text-muted-foreground">
          {statusText}
        </p>

        {/* Push to talk / End call button */}
        {isDisconnected ? (
          <Button
            size="lg"
            className={cn(
              "h-20 w-20 rounded-full transition-all duration-200",
              "bg-primary hover:bg-primary/90 hover:scale-105",
              "shadow-lg hover:shadow-xl"
            )}
            onClick={startCall}
            disabled={isConnecting}
          >
            <Phone className="h-8 w-8" />
          </Button>
        ) : (
          <Button
            variant="destructive"
            size="lg"
            className={cn(
              "h-20 w-20 rounded-full transition-all duration-200",
              "hover:scale-105 shadow-lg hover:shadow-xl"
            )}
            onClick={endCall}
          >
            <PhoneOff className="h-8 w-8" />
          </Button>
        )}

        {/* Connection state indicator */}
        {isConnecting && (
          <p className="mt-4 text-sm text-muted-foreground animate-pulse">
            Requesting microphone access...
          </p>
        )}
      </div>

      {/* Transcript history - compact at bottom */}
      {messages.length > 0 && (
        <div className="border-t border-border bg-muted/30">
          <ScrollArea className="h-32 px-4 py-2">
            <div className="space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "text-sm",
                    message.role === "user"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <span className="font-medium">
                    {message.role === "user" ? "You: " : "Iris: "}
                  </span>
                  {message.content}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default VoiceChat;
