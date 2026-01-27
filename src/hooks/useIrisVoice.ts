import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation, useScribe, CommitStrategy } from "@elevenlabs/react";
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
  const [partialTranscript, setPartialTranscript] = useState("");
  
  const optionsRef = useRef(options);
  const volumeIntervalRef = useRef<number | null>(null);
  const lastCommittedRef = useRef<string>("");

  // Keep options ref in sync
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Scribe v2 for real-time transcription
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data: { text: string }) => {
      console.log("Scribe partial:", data.text);
      setPartialTranscript(data.text);
    },
    onCommittedTranscript: (data: { text: string }) => {
      console.log("Scribe committed:", data.text);
      if (data.text && data.text !== lastCommittedRef.current) {
        lastCommittedRef.current = data.text;
        optionsRef.current.onUserTranscript?.(data.text);
      }
      setPartialTranscript("");
    },
  });

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
      setPartialTranscript("");
      
      // Stop volume monitoring
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
        volumeIntervalRef.current = null;
      }
    },
    onMessage: (message) => {
      console.log("ElevenLabs message:", JSON.stringify(message, null, 2));
      
      // Handle agent responses
      if (message.role === "agent" && message.message) {
        console.log("Agent response received:", message.message);
        optionsRef.current.onAgentResponse?.(message.message);
      }
      // Also handle user transcripts if ElevenLabs sends them
      if (message.role === "user" && message.message) {
        console.log("User transcript from agent:", message.message);
        // Don't duplicate if scribe already sent this
        if (message.message !== lastCommittedRef.current) {
          lastCommittedRef.current = message.message;
          optionsRef.current.onUserTranscript?.(message.message);
        }
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
      // Request microphone permission
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted");
      stream.getTracks().forEach(track => track.stop());

      // Get both tokens in parallel
      console.log("Fetching tokens...");
      const [conversationRes, scribeRes] = await Promise.all([
        supabase.functions.invoke("elevenlabs-conversation-token"),
        supabase.functions.invoke("elevenlabs-scribe-token"),
      ]);

      if (conversationRes.error) {
        throw new Error(conversationRes.error.message || "Failed to get conversation token");
      }
      if (!conversationRes.data?.signedUrl) {
        throw new Error("No signed URL received");
      }

      // Start conversation
      console.log("Starting ElevenLabs session...");
      await conversation.startSession({
        signedUrl: conversationRes.data.signedUrl,
      });

      // Start scribe if token available (optional enhancement)
      if (scribeRes.data?.token) {
        console.log("Starting Scribe v2...");
        try {
          await scribe.connect({
            token: scribeRes.data.token,
            microphone: {
              echoCancellation: true,
              noiseSuppression: true,
            },
          });
          console.log("Scribe connected");
        } catch (scribeError) {
          console.warn("Scribe failed to connect, continuing without:", scribeError);
        }
      }

      console.log("Session started successfully");

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
  }, [connectionState, conversation, scribe, toast]);

  const endCall = useCallback(async () => {
    try {
      await Promise.all([
        conversation.endSession(),
        scribe.disconnect(),
      ]);
    } catch (error) {
      console.error("Error ending call:", error);
    }
    
    setConnectionState("disconnected");
    setInputVolume(0);
    setOutputVolume(0);
    setPartialTranscript("");
    lastCommittedRef.current = "";
  }, [conversation, scribe]);

  return {
    connectionState,
    isSpeaking: conversation.isSpeaking,
    inputVolume,
    outputVolume,
    partialTranscript,
    startCall,
    endCall,
  };
};
