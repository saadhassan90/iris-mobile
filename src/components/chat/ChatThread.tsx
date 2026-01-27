import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import MessageBubble from "./MessageBubble";
import SuggestionPills from "./SuggestionPills";
import type { Message } from "@/hooks/useConversations";
import { cn } from "@/lib/utils";

interface ChatThreadProps {
  messages: Message[];
  isLoading?: boolean;
  onRetry?: (messageId: string) => void;
  onSuggestionClick?: (suggestion: string) => void;
}

const ChatThread = ({ messages, isLoading, onRetry, onSuggestionClick }: ChatThreadProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Auto-scroll to bottom when new messages arrive (if already near bottom)
  useEffect(() => {
    if (isNearBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isNearBottom]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    const nearBottom = distanceFromBottom < 100;
    setIsNearBottom(nearBottom);
    setShowScrollButton(!nearBottom && messages.length > 0);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-semibold text-foreground mb-8">
          What can I help with?
        </h1>
        <SuggestionPills onSuggestionClick={onSuggestionClick} />
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden">
      <ScrollArea 
        className="h-full"
        ref={scrollRef}
        onScrollCapture={handleScroll}
      >
        <div className="flex flex-col gap-3 p-4 pb-2">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onRetry={onRetry}
            />
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Scroll to bottom button */}
      <Button
        variant="secondary"
        size="icon"
        className={cn(
          "absolute bottom-4 right-4 h-8 w-8 rounded-full shadow-md transition-all",
          showScrollButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
        onClick={scrollToBottom}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ChatThread;
