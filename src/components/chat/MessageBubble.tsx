import { format } from "date-fns";
import { cn } from "@/lib/utils";
import ReadReceipt from "./ReadReceipt";
import type { Message } from "@/hooks/useConversations";

interface MessageBubbleProps {
  message: Message;
  onRetry?: (messageId: string) => void;
}

const MessageBubble = ({ message, onRetry }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  const handleClick = () => {
    if (message.status === 'failed' && onRetry) {
      onRetry(message.id);
    }
  };

  return (
    <div
      className={cn(
        "flex w-full animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("max-w-[80%] space-y-1", isUser && "items-end")}>
        <div
          onClick={handleClick}
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md",
            message.status === 'failed' && "cursor-pointer opacity-70"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        
        <div className={cn(
          "flex items-center gap-1.5 px-1",
          isUser ? "justify-end" : "justify-start"
        )}>
          <span className="text-[10px] text-muted-foreground">
            {format(message.createdAt, 'HH:mm')}
          </span>
          {isUser && <ReadReceipt status={message.status} />}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
