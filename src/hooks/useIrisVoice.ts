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
  const micStreamRef = useRef<MediaStream | null>(null);
  
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

      // Ensure mic is released if the SDK disconnects unexpectedly.
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setInputVolume(0);
      setOutputVolume(0);
    },
    onMessage: (payload) => {
      // The SDK can emit different payload shapes depending on connection type/version.
      // Handle both the legacy { role, message } shape and the event-based { type, ... } shape.
      console.log("Message from Iris:", payload);

      try {
        // Event-based payloads
        if ((payload as any)?.type === "user_transcript") {
          const transcript = (payload as any)?.user_transcription_event?.user_transcript;
          if (typeof transcript === "string" && transcript.trim()) {
            optionsRef.current.onUserTranscript?.(transcript);
          }
          return;
        }

        if ((payload as any)?.type === "agent_response") {
          const response = (payload as any)?.agent_response_event?.agent_response;
          if (typeof response === "string" && response.trim()) {
            optionsRef.current.onAgentResponse?.(response);
          }
          return;
        }

        // Legacy payload shape
        if ((payload as any)?.role === "user") {
          const msg = (payload as any)?.message;
          if (typeof msg === "string" && msg.trim()) {
            optionsRef.current.onUserTranscript?.(msg);
          }
          return;
        }

        if ((payload as any)?.role === "agent") {
          const msg = (payload as any)?.message;
          if (typeof msg === "string" && msg.trim()) {
            optionsRef.current.onAgentResponse?.(msg);
          }
          return;
        }
      } catch (e) {
        console.warn("Failed to parse ElevenLabs message payload", e);
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
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Get signed URL from edge function
      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token");

      if (error) {
        throw new Error(error.message || "Failed to get signed URL");
      }

      if (!data?.signedUrl) {
        throw new Error("No signed URL received from server");
      }

      // Start the conversation with WebSocket (more stable than WebRTC)
      await conversation.startSession({
        signedUrl: data.signedUrl,
        connectionType: "websocket",
      } as any);

    } catch (error: any) {
      console.error("Failed to start call:", error);
      setConnectionState("disconnected");

      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }

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

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
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
