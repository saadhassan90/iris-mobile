import { useLocation, useNavigate } from "react-router-dom";
import { Mic, LayoutDashboard, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import ConversationSidebar from "@/components/chat/ConversationSidebar";
import type { Conversation } from "@/hooks/useConversations";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations?: Conversation[];
  activeConversationId?: string | null;
  onSelectConversation?: (id: string) => void;
  onNewConversation?: () => void;
  onDeleteConversation?: (id: string) => void;
}

const navItems = [
  { label: "Talk to Iris", icon: Mic, path: "/" },
  { label: "Agenda", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

const MobileNav = ({ 
  open, 
  onOpenChange,
  conversations = [],
  activeConversationId = null,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: MobileNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleSelectConversation = (id: string) => {
    onSelectConversation?.(id);
    // Navigate to voice chat if not already there
    if (location.pathname !== "/") {
      navigate("/");
    }
    onOpenChange(false);
  };

  const handleNewConversation = () => {
    onNewConversation?.();
    if (location.pathname !== "/") {
      navigate("/");
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0 [&>button]:hidden">
        <SheetHeader className="flex flex-row items-center justify-between border-b px-3 py-2.5">
          <SheetTitle className="text-sm font-medium">Menu</SheetTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </SheetHeader>
        
        <div className="flex flex-col py-1.5">
          {/* Navigation Items - Top Section */}
          <nav className="flex flex-col gap-0.5 px-2 pb-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={cn(
                    "flex items-center gap-2 rounded-full min-h-[44px] px-3 text-left text-xs transition-colors",
                    "hover:bg-accent",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Conversation History Section - Bottom */}
          <ConversationSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={(id) => onDeleteConversation?.(id)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
