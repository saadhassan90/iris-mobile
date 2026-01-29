import { useState, useCallback, useRef } from "react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseDictationOptions {
  onTranscript?: (transcript: string) => void;
  maxDuration?: number; // in seconds
}

interface UseDictationReturn {
  isRecording: boolean;
  isConnecting: boolean;
  partialTranscript: string;
  committedTranscript: string;
  startRecording: () => Promise<void>;
  stopRecording: () => string;
  cancelRecording: () => void;
}

export function useDictation(options: UseDictationOptions = {}): UseDictationReturn {
  const { onTranscript, maxDuration = 60 } = options;
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [committedTranscript, setCommittedTranscript] = useState("");
  const maxDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef(false);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => {
      setPartialTranscript(data.text);
    },
    onCommittedTranscript: (data) => {
      setCommittedTranscript((prev) => {
        const newTranscript = prev ? `${prev} ${data.text}` : data.text;
        return newTranscript;
      });
      setPartialTranscript("");
    },
  });

  const clearState = useCallback(() => {
    setPartialTranscript("");
    setCommittedTranscript("");
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    isCancelledRef.current = false;
    clearState();
    setIsConnecting(true);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from edge function
      const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");

      if (error || !data?.token) {
        throw new Error(error?.message || "Failed to get transcription token");
      }

      // Connect to Scribe
      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Haptic feedback on start
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      // Set max duration timeout
      maxDurationTimeoutRef.current = setTimeout(() => {
        toast.warning("Maximum recording time reached");
        scribe.disconnect();
      }, maxDuration * 1000);

    } catch (error) {
      console.error("Failed to start recording:", error);
      
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        toast.error("Microphone access required for voice input");
      } else {
        toast.error("Voice unavailable, please type instead");
      }
      
      clearState();
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [scribe, clearState, maxDuration]);

  const stopRecording = useCallback((): string => {
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }

    // Get final transcript before disconnecting
    const finalTranscript = committedTranscript + (partialTranscript ? ` ${partialTranscript}` : "");
    
    scribe.disconnect();

    // Haptic feedback on stop
    if (navigator.vibrate) {
      navigator.vibrate([30, 30, 30]);
    }

    const trimmed = finalTranscript.trim();
    
    if (!trimmed && !isCancelledRef.current) {
      toast.info("No speech detected");
    } else if (trimmed && onTranscript) {
      onTranscript(trimmed);
    }

    clearState();
    return trimmed;
  }, [scribe, committedTranscript, partialTranscript, onTranscript, clearState]);

  const cancelRecording = useCallback(() => {
    isCancelledRef.current = true;
    
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }

    scribe.disconnect();
    clearState();

    // Haptic feedback on cancel
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  }, [scribe, clearState]);

  return {
    isRecording: scribe.isConnected,
    isConnecting,
    partialTranscript,
    committedTranscript,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
