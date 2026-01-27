import { useState } from "react";
import { Mic, MicOff, Send, MessageSquare } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import VoiceOrb, { VoiceState } from "@/components/voice/VoiceOrb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const VoiceChat = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [isTextMode, setIsTextMode] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isListening, setIsListening] = useState(false);

  const getStatusText = () => {
    switch (voiceState) {
      case "listening":
        return "Listening...";
      case "processing":
        return "Processing...";
      case "speaking":
        return "Speaking...";
      default:
        return "Tap to speak";
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      setIsListening(false);
      setVoiceState("idle");
    } else {
      setIsListening(true);
      setVoiceState("listening");
      // Simulate processing after 3 seconds
      setTimeout(() => {
        setVoiceState("processing");
        setTimeout(() => {
          setVoiceState("speaking");
          setTimeout(() => {
            setVoiceState("idle");
            setIsListening(false);
          }, 2000);
        }, 1500);
      }, 3000);
    }
  };

  const handleSendText = () => {
    if (!textInput.trim()) return;
    setVoiceState("processing");
    setTextInput("");
    setTimeout(() => {
      setVoiceState("speaking");
      setTimeout(() => {
        setVoiceState("idle");
      }, 2000);
    }, 1500);
  };

  return (
    <AppLayout title="Voice Chat">
      <div className="flex flex-1 flex-col items-center justify-between px-4 pb-8 pt-4">
        {/* Voice mode toggle */}
        <div className="flex w-full items-center justify-end gap-2">
          <Label htmlFor="text-mode" className="text-sm text-muted-foreground">
            <Mic className="h-4 w-4" />
          </Label>
          <Switch
            id="text-mode"
            checked={isTextMode}
            onCheckedChange={setIsTextMode}
          />
          <Label htmlFor="text-mode" className="text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
          </Label>
        </div>

        {/* Voice orb area */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <VoiceOrb state={voiceState} />
          <p className="mt-8 text-lg font-medium text-muted-foreground">
            {getStatusText()}
          </p>
        </div>

        {/* Controls */}
        <div className="w-full max-w-sm space-y-4">
          {isTextMode ? (
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                className="rounded-full"
              />
              <Button
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full"
                onClick={handleSendText}
                disabled={!textInput.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              className={cn(
                "h-16 w-full rounded-full text-lg font-medium transition-all",
                isListening && "bg-destructive hover:bg-destructive/90"
              )}
              onClick={handleMicClick}
            >
              {isListening ? (
                <>
                  <MicOff className="mr-2 h-6 w-6" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-6 w-6" />
                  Start Listening
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default VoiceChat;
