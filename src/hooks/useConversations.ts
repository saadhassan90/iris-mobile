import { useState, useEffect, useCallback } from 'react';

export type MessageStatus = 'sending' | 'delivered' | 'transferred' | 'failed';

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  status: MessageStatus;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: Date;
  createdAt: Date;
}

const CONVERSATIONS_KEY = 'clawdbot-conversations';
const MESSAGES_KEY_PREFIX = 'clawdbot-messages-';

const generateId = () => crypto.randomUUID();

const parseDate = (dateStr: string | Date): Date => {
  return typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
};

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CONVERSATIONS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((conv: Conversation) => ({
          ...conv,
          createdAt: parseDate(conv.createdAt),
          updatedAt: parseDate(conv.updatedAt),
        }));
        setConversations(parsed);
        // Set first conversation as active if exists
        if (parsed.length > 0 && !activeConversationId) {
          setActiveConversationId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse conversations:', e);
      }
    }
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      const stored = localStorage.getItem(`${MESSAGES_KEY_PREFIX}${activeConversationId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored).map((msg: Message) => ({
            ...msg,
            createdAt: parseDate(msg.createdAt),
          }));
          setMessages(parsed);
        } catch (e) {
          console.error('Failed to parse messages:', e);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  // Save conversations to localStorage
  const saveConversations = useCallback((convs: Conversation[]) => {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
    setConversations(convs);
  }, []);

  // Save messages to localStorage
  const saveMessages = useCallback((conversationId: string, msgs: Message[]) => {
    localStorage.setItem(`${MESSAGES_KEY_PREFIX}${conversationId}`, JSON.stringify(msgs));
    if (conversationId === activeConversationId) {
      setMessages(msgs);
    }
  }, [activeConversationId]);

  // Create a new conversation
  const createConversation = useCallback(() => {
    const newConv: Conversation = {
      id: generateId(),
      title: 'New Conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updated = [newConv, ...conversations];
    saveConversations(updated);
    setActiveConversationId(newConv.id);
    setMessages([]);
    return newConv;
  }, [conversations, saveConversations]);

  // Delete a conversation
  const deleteConversation = useCallback((id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    saveConversations(updated);
    localStorage.removeItem(`${MESSAGES_KEY_PREFIX}${id}`);
    
    if (activeConversationId === id) {
      setActiveConversationId(updated.length > 0 ? updated[0].id : null);
    }
  }, [conversations, activeConversationId, saveConversations]);

  // Add a message to the active conversation
  const addMessage = useCallback((content: string, role: 'user' | 'assistant' = 'user'): Message => {
    if (!activeConversationId) {
      // Create new conversation if none active
      const newConv = createConversation();
      const message: Message = {
        id: generateId(),
        conversationId: newConv.id,
        role,
        content,
        createdAt: new Date(),
        status: role === 'user' ? 'sending' : 'transferred',
      };
      saveMessages(newConv.id, [message]);
      
      // Update conversation title and lastMessage
      const updatedConvs = conversations.map(c => 
        c.id === newConv.id 
          ? { 
              ...c, 
              title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
              lastMessage: content.slice(0, 50),
              updatedAt: new Date() 
            }
          : c
      );
      // Since we just created the conversation, add the update
      const finalConvs = [{ 
        ...newConv, 
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        lastMessage: content.slice(0, 50),
        updatedAt: new Date() 
      }, ...conversations];
      saveConversations(finalConvs);
      
      return message;
    }

    const message: Message = {
      id: generateId(),
      conversationId: activeConversationId,
      role,
      content,
      createdAt: new Date(),
      status: role === 'user' ? 'sending' : 'transferred',
    };

    const updatedMessages = [...messages, message];
    saveMessages(activeConversationId, updatedMessages);

    // Update conversation title (first user message) and lastMessage
    const updatedConvs = conversations.map(c => {
      if (c.id !== activeConversationId) return c;
      
      const isFirstMessage = messages.length === 0 && role === 'user';
      return {
        ...c,
        title: isFirstMessage ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : c.title,
        lastMessage: content.slice(0, 50),
        updatedAt: new Date(),
      };
    });
    saveConversations(updatedConvs);

    return message;
  }, [activeConversationId, messages, conversations, createConversation, saveMessages, saveConversations]);

  // Update message status
  const updateMessageStatus = useCallback((messageId: string, status: MessageStatus) => {
    if (!activeConversationId) return;

    const updatedMessages = messages.map(msg =>
      msg.id === messageId ? { ...msg, status } : msg
    );
    saveMessages(activeConversationId, updatedMessages);
  }, [activeConversationId, messages, saveMessages]);

  // Get active conversation
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  return {
    conversations,
    activeConversation,
    activeConversationId,
    messages,
    isLoading,
    setIsLoading,
    setActiveConversationId,
    createConversation,
    deleteConversation,
    addMessage,
    updateMessageStatus,
  };
};
