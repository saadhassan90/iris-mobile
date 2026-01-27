import { useState, ReactNode } from "react";
import Header from "./Header";
import MobileNav from "./MobileNav";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

const AppLayout = ({ children, title }: AppLayoutProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onMenuClick={() => setMenuOpen(true)} title={title} />
      <MobileNav open={menuOpen} onOpenChange={setMenuOpen} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
};

export default AppLayout;
