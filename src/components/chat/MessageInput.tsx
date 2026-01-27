import { useState, useRef, useEffect } from "react";
import { Plus, Mic, AudioLines } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  isListening?: boolean;
  isConnecting?: boolean;
  disabled?: boolean;
  hideVoiceButton?: boolean;
  placeholder?: string;
}

const MessageInput = ({
  onSendMessage,
  onVoiceStart,
  onVoiceStop,
  isListening = false,
  isConnecting = false,
  disabled = false,
  hideVoiceButton = false,
  placeholder = "Ask ChatGPT",
}: MessageInputProps) => {
  const [textInput, setTextInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!textInput.trim() || disabled) return;
    onSendMessage(textInput.trim());
    setTextInput("");
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
    <div className="bg-background px-4 pb-6 pt-2">
      <div className="flex items-center gap-3">
        {/* Plus/Attach button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
          disabled={disabled}
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Input field */}
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isListening || isConnecting}
            className="h-12 rounded-full border-border bg-muted/50 pl-4 pr-20 text-base placeholder:text-muted-foreground"
          />
          
          {/* Icons inside input */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Microphone button */}
            {!hideVoiceButton && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                onClick={handleMicClick}
                disabled={disabled || isConnecting}
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
            
            {/* Audio/Voice button */}
            <Button
              size="icon"
              className="h-8 w-8 rounded-full bg-foreground text-background hover:bg-foreground/90"
              onClick={textInput.trim() ? handleSend : handleMicClick}
              disabled={disabled || isConnecting}
            >
              <AudioLines className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
