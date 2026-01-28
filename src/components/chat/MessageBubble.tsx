import { format } from "date-fns";
import { cn } from "@/lib/utils";
import ReadReceipt from "./ReadReceipt";
import MarkdownRenderer from "./MarkdownRenderer";
import type { Message } from "@/hooks/useConversations";
import irisAvatar from "@/assets/iris-avatar.png";
import userAvatar from "@/assets/user-avatar.png";

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
        "flex w-full animate-fade-in gap-4 py-4",
        isUser ? "bg-transparent" : "bg-muted/30"
      )}
    >
      <div className={cn(
        "w-full max-w-3xl px-4",
        isUser ? "ml-auto mr-4" : "mr-auto ml-4"
      )}>
        <div className={cn(
          "flex gap-4",
          isUser && "flex-row-reverse"
        )}>
          {/* Avatar */}
          <img 
            src={isUser ? userAvatar : irisAvatar} 
            alt={isUser ? "You" : "Iris"} 
            className="h-7 w-7 rounded-full object-cover shrink-0 mt-1"
          />
          
          <div className={cn(
            "flex-1 min-w-0 space-y-2",
            isUser && "text-right"
          )}>
            {/* Name and timestamp */}
            <div className={cn(
              "flex items-center gap-2",
              isUser && "justify-end"
            )}>
              <span className="text-sm font-medium text-foreground">
                {isUser ? "You" : "Iris"}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(message.createdAt, 'HH:mm')}
              </span>
              {isUser && <ReadReceipt status={message.status} />}
            </div>
            
            {/* Message content */}
            <div
              onClick={handleClick}
              className={cn(
                "text-sm text-foreground",
                message.status === 'failed' && "cursor-pointer opacity-70"
              )}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
              ) : (
                <MarkdownRenderer content={message.content} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
