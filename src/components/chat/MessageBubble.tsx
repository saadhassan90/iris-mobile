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
        "flex w-full animate-fade-in py-4 overflow-hidden",
        isUser ? "bg-transparent" : "bg-muted/30"
      )}
    >
      <div className={cn(
        "w-full px-3 sm:px-4 max-w-full sm:max-w-3xl",
        isUser ? "ml-auto sm:mr-4" : "mr-auto sm:ml-4"
      )}>
        <div className={cn(
          "flex gap-2 sm:gap-4",
          isUser && "flex-row-reverse"
        )}>
          {/* Avatar */}
          <img 
            src={isUser ? userAvatar : irisAvatar} 
            alt={isUser ? "You" : "Iris"} 
            className="h-6 w-6 sm:h-7 sm:w-7 rounded-full object-cover shrink-0 mt-1"
          />
          
          <div className={cn(
            "flex-1 min-w-0 space-y-2 overflow-hidden",
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
                "text-sm text-foreground overflow-hidden",
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
