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
      <Separator className="mb-2" />

      {/* Section Header with New Chat Button */}
      <div className="flex items-center justify-between px-2 py-1">
        <h3 className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          History
        </h3>
        <Button
          onClick={onNewConversation}
          variant="secondary"
          size="sm"
          className="h-6 rounded-full px-2.5 text-[10px]"
        >
          <Plus className="mr-1 h-2.5 w-2.5" />
          New
        </Button>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 max-h-[280px]">
        <div className="space-y-0.5 px-1.5">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <MessageSquare className="h-5 w-5 text-muted-foreground/50 mb-1" />
              <p className="text-[10px] text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "group flex items-center gap-1.5 rounded-lg min-h-[44px] px-2 transition-colors cursor-pointer",
                    isActive ? "bg-accent" : "hover:bg-accent/50"
                  )}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[11px] font-medium truncate",
                      isActive ? "text-accent-foreground" : "text-foreground"
                    )}>
                      {conversation.title}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
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
                    <Trash2 className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationSidebar;
