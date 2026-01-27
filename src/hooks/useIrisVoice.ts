import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type VoiceConnectionState = "disconnected" | "connecting" | "connected";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UseIrisVoiceOptions {
  onUserTranscript?: (transcript: string) => void;
  onAgentResponse?: (response: string) => void;
}

// Check for browser speech recognition support
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useIrisVoice = (options: UseIrisVoiceOptions = {}) => {
  const { toast } = useToast();
  const [connectionState, setConnectionState] = useState<VoiceConnectionState>("disconnected");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  
  const optionsRef = useRef(options);
  const connectionStateRef = useRef<VoiceConnectionState>("disconnected");
  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const conversationHistoryRef = useRef<Message[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isProcessingRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  // Monitor microphone volume
  const startVolumeMonitoring = useCallback((stream: MediaStream) => {
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);
    analyserRef.current.fftSize = 256;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateVolume = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setInputVolume(average / 255);
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateVolume);
  }, []);

  // Send message to clawdbot and get response
  const sendToClawdbot = useCallback(async (message: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("clawdbot-chat", {
      body: {
        message,
        conversationHistory: conversationHistoryRef.current,
      },
    });

    if (error) {
      throw new Error(error.message || "Failed to get response from clawdbot");
    }

    return data?.response || "I'm sorry, I couldn't process that.";
  }, []);

  // Play TTS audio
  const speakResponse = useCallback(async (text: string) => {
    setIsSpeaking(true);
    setOutputVolume(0.5);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        throw new Error("TTS request failed");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      currentAudioRef.current = new Audio(audioUrl);
      
      currentAudioRef.current.onended = () => {
        setIsSpeaking(false);
        setOutputVolume(0);
        URL.revokeObjectURL(audioUrl);
        
        // Resume listening after speaking
        if (connectionStateRef.current === "connected" && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {}
        }
      };

      currentAudioRef.current.onerror = () => {
        setIsSpeaking(false);
        setOutputVolume(0);
        
        // Resume listening even if TTS fails
        if (connectionStateRef.current === "connected" && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {}
        }
      };

      await currentAudioRef.current.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
      setOutputVolume(0);
      
      // Resume listening even if TTS fails
      if (connectionStateRef.current === "connected" && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    }
  }, []);

  // Process user speech
  const processUserSpeech = useCallback(async (transcript: string) => {
    if (isProcessingRef.current || !transcript.trim()) return;
    
    isProcessingRef.current = true;
    
    try {
      // Stop listening while processing
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }

      // Notify about user transcript
      optionsRef.current.onUserTranscript?.(transcript);
      
      // Add to history
      conversationHistoryRef.current.push({ role: "user", content: transcript });

      // Get response from clawdbot
      const response = await sendToClawdbot(transcript);
      
      // Add response to history
      conversationHistoryRef.current.push({ role: "assistant", content: response });
      
      // Notify about agent response
      optionsRef.current.onAgentResponse?.(response);
      
      // Speak the response
      await speakResponse(response);
    } catch (error) {
      console.error("Error processing speech:", error);
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: "Failed to get a response. Please try again.",
      });
      
      // Resume listening on error
      if (connectionStateRef.current === "connected" && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [sendToClawdbot, speakResponse, toast]);

  const startCall = useCallback(async () => {
    if (connectionState !== "disconnected") return;

    if (!SpeechRecognition) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser. Please use Chrome or Edge.",
      });
      return;
    }

    setConnectionState("connecting");
    conversationHistoryRef.current = [];

    try {
      // Request microphone permission
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Start volume monitoring
      startVolumeMonitoring(micStreamRef.current);

      // Set up speech recognition
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        
        if (event.results[last].isFinal && transcript.trim()) {
          processUserSpeech(transcript.trim());
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        
        if (event.error === "not-allowed") {
          toast({
            variant: "destructive",
            title: "Microphone Access Required",
            description: "Please allow microphone access to talk to Iris.",
          });
          setConnectionState("disconnected");
        } else if (event.error !== "aborted" && event.error !== "no-speech") {
          // Restart recognition on other errors
          if (connectionStateRef.current === "connected" && !isSpeakingRef.current) {
            try {
              recognitionRef.current?.start();
            } catch {}
          }
        }
      };

      recognitionRef.current.onend = () => {
        // Auto-restart if still connected and not speaking
        if (connectionStateRef.current === "connected" && !isSpeakingRef.current && !isProcessingRef.current) {
          try {
            recognitionRef.current?.start();
          } catch {}
        }
      };

      // Start listening
      recognitionRef.current.start();
      setConnectionState("connected");

      // Send initial greeting
      setTimeout(async () => {
        const greeting = "Hello! I'm Iris, your AI assistant. How can I help you today?";
        conversationHistoryRef.current.push({ role: "assistant", content: greeting });
        optionsRef.current.onAgentResponse?.(greeting);
        await speakResponse(greeting);
      }, 500);

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
  }, [connectionState, toast, startVolumeMonitoring, processUserSpeech, speakResponse]);

  const endCall = useCallback(async () => {
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    // Stop audio playback
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    // Stop microphone
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }

    // Stop volume monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    setInputVolume(0);
    setOutputVolume(0);
    setIsSpeaking(false);
    setConnectionState("disconnected");
  }, []);

  return {
    connectionState,
    isSpeaking,
    inputVolume,
    outputVolume,
    startCall,
    endCall,
  };
};
