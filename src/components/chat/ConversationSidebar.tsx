import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Plus, Trash2, MessageSquare, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex flex-col">
      <Separator className="mb-2" />

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Section Header with New Chat Button */}
        <div className="flex items-center justify-between px-2 py-1">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className={cn("h-3 w-3 transition-transform", !isOpen && "-rotate-90")} />
              History
            </button>
          </CollapsibleTrigger>
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
        <CollapsibleContent>
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ConversationSidebar;
