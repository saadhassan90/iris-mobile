import { Menu, UserPlus, ScanLine, AudioLines } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";

interface ChatHeaderProps {
  onMenuClick: () => void;
  onVoiceClick?: () => void;
  isVoiceActive?: boolean;
  title?: string;
}

const ChatHeader = ({ onMenuClick, onVoiceClick, isVoiceActive = false, title = "ChatGPT" }: ChatHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between px-3 sm:px-4 bg-background border-b border-border w-full max-w-full overflow-hidden">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full border-border"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <img src={logo} alt="Iris logo" className="h-7 w-auto" />
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
        <Button
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={onVoiceClick}
          aria-label="Voice chat"
        >
          <AudioLines className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default ChatHeader;
