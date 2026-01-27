import { useState, ReactNode, createContext, useContext } from "react";
import Header from "./Header";
import MobileNav from "./MobileNav";
import { useConversations } from "@/hooks/useConversations";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

// Create context for conversation management - use the hook's return type directly
type ConversationContextType = ReturnType<typeof useConversations>;

const ConversationContext = createContext<ConversationContextType | null>(null);

export const useConversationContext = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversationContext must be used within AppLayout');
  }
  return context;
};

const AppLayout = ({ children, title }: AppLayoutProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const conversationState = useConversations();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    deleteConversation,
  } = conversationState;

  return (
    <ConversationContext.Provider value={conversationState}>
      <div className="flex min-h-screen flex-col bg-background">
        <Header onMenuClick={() => setMenuOpen(true)} title={title} />
        <MobileNav 
          open={menuOpen} 
          onOpenChange={setMenuOpen}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onNewConversation={createConversation}
          onDeleteConversation={deleteConversation}
        />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </ConversationContext.Provider>
  );
};

export default AppLayout;
