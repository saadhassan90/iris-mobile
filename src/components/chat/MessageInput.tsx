import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  isVoiceMode: boolean;
  onVoiceModeChange: (isVoice: boolean) => void;
  isListening?: boolean;
  disabled?: boolean;
}

const MessageInput = ({
  onSendMessage,
  onVoiceStart,
  onVoiceStop,
  isVoiceMode,
  onVoiceModeChange,
  isListening = false,
  disabled = false,
}: MessageInputProps) => {
  const [textInput, setTextInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [textInput]);

  const handleSend = () => {
    if (!textInput.trim() || disabled) return;
    onSendMessage(textInput.trim());
    setTextInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      onVoiceStop?.();
    } else {
      onVoiceStart?.();
    }
  };

  return (
    <div className="border-t bg-background p-4 space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center justify-center gap-2">
        <Label htmlFor="voice-mode" className="text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
        </Label>
        <Switch
          id="voice-mode"
          checked={isVoiceMode}
          onCheckedChange={onVoiceModeChange}
          disabled={disabled}
        />
        <Label htmlFor="voice-mode" className="text-muted-foreground">
          <Mic className="h-4 w-4" />
        </Label>
      </div>

      {/* Input area */}
      {isVoiceMode ? (
        <Button
          size="lg"
          className={cn(
            "h-14 w-full rounded-full text-base font-medium transition-all",
            isListening && "bg-destructive hover:bg-destructive/90"
          )}
          onClick={handleMicClick}
          disabled={disabled}
        >
          {isListening ? (
            <>
              <MicOff className="mr-2 h-5 w-5" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="mr-2 h-5 w-5" />
              Tap to Speak
            </>
          )}
        </Button>
      ) : (
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="min-h-[44px] max-h-[120px] resize-none rounded-2xl py-3"
            rows={1}
          />
          <Button
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full"
            onClick={handleSend}
            disabled={!textInput.trim() || disabled}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
