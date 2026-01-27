import { Menu, UserPlus, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

const ChatHeader = ({ onMenuClick, title = "ChatGPT" }: ChatHeaderProps) => {
  return (
    <header className="flex h-14 items-center justify-between px-4 bg-background">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full border-border"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          className="h-10 rounded-full px-4 border-border font-medium"
        >
          {title}
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-border"
        >
          <UserPlus className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-border"
        >
          <ScanLine className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default ChatHeader;
