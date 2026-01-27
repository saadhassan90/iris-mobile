import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type VoiceConnectionState = "disconnected" | "connecting" | "connected";

interface UseIrisVoiceOptions {
  onUserTranscript?: (transcript: string) => void;
  onAgentResponse?: (response: string) => void;
  onError?: (error: string) => void;
}

export const useIrisVoice = (options: UseIrisVoiceOptions = {}) => {
  const { toast } = useToast();
  const [connectionState, setConnectionState] = useState<VoiceConnectionState>("disconnected");
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  
  const optionsRef = useRef(options);
  const volumeIntervalRef = useRef<number | null>(null);

  // Keep options ref in sync
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      setConnectionState("connected");
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
      setConnectionState("disconnected");
      setInputVolume(0);
      setOutputVolume(0);
      
      // Stop volume monitoring
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
        volumeIntervalRef.current = null;
      }
    },
    onMessage: (message) => {
      // MessagePayload has: message (string), role ("user" | "agent"), source ("user" | "ai")
      console.log("ElevenLabs message:", message);
      
      if (message.role === "user") {
        optionsRef.current.onUserTranscript?.(message.message);
      } else if (message.role === "agent") {
        optionsRef.current.onAgentResponse?.(message.message);
      }
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      setConnectionState("disconnected");
      
      const errorMessage = typeof error === "string" ? error : "Voice connection failed";
      optionsRef.current.onError?.(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Voice Error",
        description: errorMessage,
      });
    },
  });

  // Monitor audio levels when connected
  useEffect(() => {
    if (conversation.status === "connected" && !volumeIntervalRef.current) {
      volumeIntervalRef.current = window.setInterval(() => {
        try {
          const input = conversation.getInputVolume?.() ?? 0;
          const output = conversation.getOutputVolume?.() ?? 0;
          setInputVolume(input);
          setOutputVolume(output);
        } catch {
          // Ignore errors from volume methods
        }
      }, 50);
    }
    
    return () => {
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
        volumeIntervalRef.current = null;
      }
    };
  }, [conversation.status, conversation]);

  const startCall = useCallback(async () => {
    if (connectionState !== "disconnected") return;

    setConnectionState("connecting");

    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from edge function
      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token");

      if (error) {
        throw new Error(error.message || "Failed to get conversation token");
      }

      if (!data?.signedUrl) {
        throw new Error("No signed URL received from server");
      }

      // Start the conversation with the signed URL
      await conversation.startSession({
        signedUrl: data.signedUrl,
      });

    } catch (error: any) {
      console.error("Failed to start call:", error);
      setConnectionState("disconnected");

      if (error.name === "NotAllowedError") {
        toast({
          variant: "destructive",
          title: "Microphone Access Required",
          description: "Please allow microphone access to talk to Iris.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: error.message || "Failed to start voice session.",
        });
      }
    }
  }, [connectionState, conversation, toast]);

  const endCall = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error("Error ending call:", error);
    }
    
    setConnectionState("disconnected");
    setInputVolume(0);
    setOutputVolume(0);
  }, [conversation]);

  return {
    connectionState,
    isSpeaking: conversation.isSpeaking,
    inputVolume,
    outputVolume,
    startCall,
    endCall,
  };
};
