import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations from database on mount
  useEffect(() => {
    const loadConversations = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to load conversations:', error);
        return;
      }

      const parsed: Conversation[] = data.map((conv) => ({
        id: conv.id,
        title: conv.title,
        lastMessage: conv.last_message || undefined,
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
      }));

      setConversations(parsed);
      if (parsed.length > 0 && !activeConversationId) {
        setActiveConversationId(parsed[0].id);
      }
    };

    loadConversations();
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to load messages:', error);
        setMessages([]);
        return;
      }

      const parsed: Message[] = data.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: new Date(msg.created_at),
        status: msg.status as MessageStatus,
      }));

      setMessages(parsed);
    };

    loadMessages();
  }, [activeConversationId]);

  // Create a new conversation
  const createConversation = useCallback(async () => {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ title: 'New Conversation' })
      .select()
      .single();

    if (error) {
      console.error('Failed to create conversation:', error);
      return null;
    }

    const newConv: Conversation = {
      id: data.id,
      title: data.title,
      lastMessage: data.last_message || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setMessages([]);
    return newConv;
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete conversation:', error);
      return;
    }

    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (activeConversationId === id) {
        setActiveConversationId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  }, [activeConversationId]);

  // Add a message to the active conversation
  const addMessage = useCallback(async (content: string, role: 'user' | 'assistant' = 'user'): Promise<Message> => {
    let conversationId = activeConversationId;

    // Create new conversation if none active
    if (!conversationId) {
      const newConv = await createConversation();
      if (!newConv) {
        throw new Error('Failed to create conversation');
      }
      conversationId = newConv.id;
    }

    const status: MessageStatus = role === 'user' ? 'sending' : 'transferred';

    // Insert message into database
    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        status,
      })
      .select()
      .single();

    if (msgError) {
      console.error('Failed to add message:', msgError);
      throw msgError;
    }

    const message: Message = {
      id: msgData.id,
      conversationId: msgData.conversation_id,
      role: msgData.role as 'user' | 'assistant',
      content: msgData.content,
      createdAt: new Date(msgData.created_at),
      status: msgData.status as MessageStatus,
    };

    // Update local messages state
    setMessages((prev) => [...prev, message]);

    // Update conversation title (first user message) and lastMessage
    const isFirstMessage = messages.length === 0 && role === 'user';
    const updates: { last_message: string; title?: string } = {
      last_message: content.slice(0, 50),
    };
    if (isFirstMessage) {
      updates.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
    }

    const { error: convError } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId);

    if (convError) {
      console.error('Failed to update conversation:', convError);
    }

    // Update local conversations state
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          title: isFirstMessage ? updates.title! : c.title,
          lastMessage: updates.last_message,
          updatedAt: new Date(),
        };
      })
    );

    return message;
  }, [activeConversationId, messages.length, createConversation]);

  // Update message status
  const updateMessageStatus = useCallback(async (messageId: string, status: MessageStatus) => {
    const { error } = await supabase
      .from('messages')
      .update({ status })
      .eq('id', messageId);

    if (error) {
      console.error('Failed to update message status:', error);
      return;
    }

    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, status } : msg))
    );
  }, []);

  // Get active conversation
  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

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
