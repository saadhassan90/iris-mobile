import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  isListening?: boolean;
  disabled?: boolean;
}

const MessageInput = ({
  onSendMessage,
  onVoiceStart,
  onVoiceStop,
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
    <div className="border-t bg-background p-4">
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          placeholder="Type a message..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isListening}
          className="min-h-[44px] max-h-[120px] resize-none rounded-2xl py-3"
          rows={1}
        />
        
        {/* Voice button */}
        <Button
          size="icon"
          variant={isListening ? "destructive" : "secondary"}
          className={cn(
            "h-11 w-11 shrink-0 rounded-full transition-all",
            isListening && "animate-pulse"
          )}
          onClick={handleMicClick}
          disabled={disabled}
        >
          {isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>

        {/* Send button */}
        <Button
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full"
          onClick={handleSend}
          disabled={!textInput.trim() || disabled || isListening}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
