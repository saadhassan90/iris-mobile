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
        "flex w-full animate-fade-in gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Iris avatar - left side */}
      {!isUser && (
        <img 
          src={irisAvatar} 
          alt="Iris" 
          className="h-8 w-8 rounded-full object-cover shrink-0 mt-0.5"
        />
      )}
      
      <div className={cn("max-w-[75%] space-y-1", isUser && "items-end")}>
        <div
          onClick={handleClick}
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md",
            message.status === 'failed' && "cursor-pointer opacity-70"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
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

      {/* User avatar - right side */}
      {isUser && (
        <img 
          src={userAvatar} 
          alt="You" 
          className="h-8 w-8 rounded-full object-cover shrink-0 mt-0.5"
        />
      )}
    </div>
  );
};

export default MessageBubble;
