import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  messageCount: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useChatStorage(user: User | null) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  // Load user's chats from database
  const loadChats = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setCurrentSessionId(null);
      setMessages([]);
      return;
    }

    setIsLoadingChats(true);
    try {
      const { data: chats, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedSessions: ChatSession[] = (chats || []).map(chat => ({
        id: chat.id,
        title: chat.title,
        createdAt: new Date(chat.created_at),
        messageCount: 0,
      }));

      setSessions(formattedSessions);
      
      // If there are existing chats, load the most recent one
      if (formattedSessions.length > 0) {
        setCurrentSessionId(formattedSessions[0].id);
        await loadMessages(formattedSessions[0].id);
      } else {
        // Start with empty state - new chat will be created on first message
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error loading chats:', err);
    } finally {
      setIsLoadingChats(false);
    }
  }, [user]);

  // Load messages for a specific chat
  const loadMessages = useCallback(async (chatId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = (data || []).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }, [user]);

  // Create a new chat
  const createChat = useCallback(async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Generate title from first message (first 30 chars)
      const title = firstMessage.length > 30 
        ? firstMessage.substring(0, 30) + '...' 
        : firstMessage;

      const { data, error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title,
        })
        .select()
        .single();

      if (error) throw error;

      const newSession: ChatSession = {
        id: data.id,
        title: data.title,
        createdAt: new Date(data.created_at),
        messageCount: 0,
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(data.id);
      
      return data.id;
    } catch (err) {
      console.error('Error creating chat:', err);
      return null;
    }
  }, [user]);

  // Save a message to the database
  const saveMessage = useCallback(async (chatId: string, message: Message) => {
    if (!user) return;

    try {
      await supabase.from('messages').insert({
        chat_id: chatId,
        role: message.role,
        content: message.content,
      });

      // Update chat's updated_at
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  }, [user]);

  // Delete a chat
  const deleteChat = useCallback(async (chatId: string) => {
    if (!user) return;

    try {
      await supabase.from('chats').delete().eq('id', chatId);
      setSessions(prev => prev.filter(s => s.id !== chatId));
      
      if (currentSessionId === chatId) {
        const remaining = sessions.filter(s => s.id !== chatId);
        if (remaining.length > 0) {
          setCurrentSessionId(remaining[0].id);
          await loadMessages(remaining[0].id);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  }, [user, currentSessionId, sessions, loadMessages]);

  // Rename a chat
  const renameChat = useCallback(async (chatId: string, newTitle: string) => {
    if (!user) return;

    try {
      await supabase
        .from('chats')
        .update({ title: newTitle })
        .eq('id', chatId);

      setSessions(prev => prev.map(s => 
        s.id === chatId ? { ...s, title: newTitle } : s
      ));
    } catch (err) {
      console.error('Error renaming chat:', err);
    }
  }, [user]);

  // Select a chat
  const selectChat = useCallback(async (chatId: string) => {
    setCurrentSessionId(chatId);
    await loadMessages(chatId);
  }, [loadMessages]);

  // Start a new chat (just clears current, actual chat created on first message)
  const startNewChat = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
  }, []);

  // Load chats when user changes
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  return {
    sessions,
    currentSessionId,
    messages,
    setMessages,
    isLoadingChats,
    createChat,
    saveMessage,
    deleteChat,
    renameChat,
    selectChat,
    startNewChat,
    loadMessages,
  };
}