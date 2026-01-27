import { useLocation, useNavigate } from "react-router-dom";
import { Mic, LayoutDashboard, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  { label: "Voice Chat", icon: Mic, path: "/" },
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

const MobileNav = ({ open, onOpenChange }: MobileNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="flex flex-row items-center justify-between border-b p-4">
          <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </SheetHeader>
        
        <nav className="flex flex-col gap-2 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "flex items-center gap-3 rounded-full px-4 py-3 text-left transition-colors",
                  "hover:bg-accent",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
