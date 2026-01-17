import { useState, useCallback } from 'react';
import { Message } from '@/hooks/useChatStorage';
import { supabase } from '@/integrations/supabase/client';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/homework-helper`;

interface UseHomeworkHelperOptions {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  memoryMessages?: Message[];
  onMessageSent?: (message: Message) => void;
  onAssistantResponse?: (message: Message) => void;
}

export function useHomeworkHelper({ 
  messages, 
  setMessages, 
  memoryMessages,
  onMessageSent,
  onAssistantResponse 
}: UseHomeworkHelperOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuestion = useCallback(async (question: string, context?: string, language?: string, images?: string[]) => {
    if (!question.trim()) return;

    setError(null);
    const userMsg: Message = { role: 'user', content: question, images };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    // Notify parent about the user message
    onMessageSent?.(userMsg);

    let assistantContent = '';

    try {
      // Get the user's session for authenticated requests
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Please log in to use the AI assistant');
      }

      // Combine memory messages (account history) with current chat messages
      // Include images in message objects so the LLM can see them
      const memoryContext = memoryMessages?.map(m => ({ 
        role: m.role, 
        content: m.content,
        images: m.images 
      })) || [];
      const currentMessages = updatedMessages.map(m => ({ 
        role: m.role, 
        content: m.content,
        images: m.images 
      }));
      const apiMessages = [...memoryContext, ...currentMessages];
      
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          messages: apiMessages, 
          context, 
          language,
          images // Also pass top-level images for backwards compatibility
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed with status ${resp.status}`);
      }

      if (!resp.body) {
        throw new Error('No response body');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => 
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Notify parent about the complete assistant response
      if (assistantContent) {
        onAssistantResponse?.({ role: 'assistant', content: assistantContent });
      }
    } catch (err) {
      console.error('Homework helper error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, setMessages, memoryMessages, onMessageSent, onAssistantResponse]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, [setMessages]);

  return { isLoading, error, sendQuestion, clearMessages };
}
