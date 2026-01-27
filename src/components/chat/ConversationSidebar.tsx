import { formatDistanceToNow } from "date-fns";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/hooks/useConversations";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

const ConversationSidebar = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ConversationSidebarProps) => {
  return (
    <div className="flex flex-col">
      {/* New Chat Button */}
      <Button
        onClick={onNewConversation}
        className="mx-4 mb-4 rounded-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        New Chat
      </Button>

      <Separator className="mb-2" />

      {/* Section Header */}
      <div className="px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Conversations
        </h3>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 max-h-[200px]">
        <div className="space-y-1 px-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "group flex items-start gap-2 rounded-lg p-2 transition-colors cursor-pointer",
                    isActive ? "bg-accent" : "hover:bg-accent/50"
                  )}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isActive ? "text-accent-foreground" : "text-foreground"
                    )}>
                      {conversation.title}
                    </p>
                    {conversation.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conversation.lastMessage}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conversation.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <Separator className="my-2" />
    </div>
  );
};

export default ConversationSidebar;
