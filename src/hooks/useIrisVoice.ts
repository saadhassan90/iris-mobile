import { useConversation } from "@elevenlabs/react";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type VoiceConnectionState = "disconnected" | "connecting" | "connected";

interface UseIrisVoiceOptions {
  onUserTranscript?: (transcript: string) => void;
  onAgentResponse?: (response: string) => void;
}

export const useIrisVoice = (options: UseIrisVoiceOptions = {}) => {
  const { toast } = useToast();
  const [connectionState, setConnectionState] = useState<VoiceConnectionState>("disconnected");
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const optionsRef = useRef(options);
  
  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to Iris");
      setConnectionState("connected");
    },
    onDisconnect: () => {
      console.log("Disconnected from Iris");
      setConnectionState("disconnected");
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setInputVolume(0);
      setOutputVolume(0);
    },
    onMessage: (payload) => {
      console.log("Message from Iris:", payload);
      
      // The payload has { message, role, source } structure
      if (payload.role === "user" && optionsRef.current.onUserTranscript) {
        optionsRef.current.onUserTranscript(payload.message);
      }
      
      if (payload.role === "agent" && optionsRef.current.onAgentResponse) {
        optionsRef.current.onAgentResponse(payload.message);
      }
    },
    onError: (message, context) => {
      console.error("Iris conversation error:", message, context);
      setConnectionState("disconnected");
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: message || "Failed to connect to Iris. Please try again.",
      });
    },
  });

  // Poll audio levels when connected
  useEffect(() => {
    if (connectionState === "connected") {
      const updateVolumes = () => {
        setInputVolume(conversation.getInputVolume());
        setOutputVolume(conversation.getOutputVolume());
        animationFrameRef.current = requestAnimationFrame(updateVolumes);
      };
      animationFrameRef.current = requestAnimationFrame(updateVolumes);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [connectionState, conversation]);

  const startCall = useCallback(async () => {
    if (connectionState !== "disconnected") return;

    setConnectionState("connecting");

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from edge function
      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token");

      if (error) {
        throw new Error(error.message || "Failed to get conversation token");
      }

      if (!data?.token) {
        throw new Error("No token received from server");
      }

      // Start the conversation with WebRTC
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      } as any);

    } catch (error: any) {
      console.error("Failed to start call:", error);
      setConnectionState("disconnected");

      if (error.name === "NotAllowedError" || error.message?.includes("permission")) {
        toast({
          variant: "destructive",
          title: "Microphone Access Required",
          description: "Please allow microphone access to talk to Iris.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: error.message || "Failed to connect to Iris. Please try again.",
        });
      }
    }
  }, [connectionState, conversation, toast]);

  const endCall = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error("Failed to end call:", error);
    }
    setConnectionState("disconnected");
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
