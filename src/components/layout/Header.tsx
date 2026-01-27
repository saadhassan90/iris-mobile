import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

const Header = ({ onMenuClick, title = "Voice Agent" }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 safe-area-inset-top">
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
};

export default Header;
