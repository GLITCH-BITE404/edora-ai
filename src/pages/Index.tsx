import { useState, useEffect, useCallback } from 'react';
import { HomeworkChat } from '@/components/HomeworkChat';
import { ChatSidebar } from '@/components/ChatSidebar';
import { LanguageSelector } from '@/components/LanguageSelector';
import { UserMenu } from '@/components/UserMenu';
import { GuestUpgradePopup } from '@/components/GuestUpgradePopup';
import { LoginSuccessPopup } from '@/components/LoginSuccessPopup';
import { MemoryToggle } from '@/components/MemoryToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChatStorage, Message } from '@/hooks/useChatStorage';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

const MEMORY_STORAGE_KEY = 'edora-memory-enabled';
const MEMORY_POPUP_SHOWN_KEY = 'edora-memory-popup-shown';

const Index = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showMemoryPopup, setShowMemoryPopup] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(() => {
    const saved = localStorage.getItem(MEMORY_STORAGE_KEY);
    return saved === 'true';
  });
  
  // Guest state for local messages
  const [guestMessages, setGuestMessages] = useState<Message[]>([]);

  const isGuest = !user;
  const imageLimit = isGuest ? 7 : 20;

  // Use chat storage hook for logged-in users
  const {
    sessions,
    currentSessionId,
    messages: storedMessages,
    setMessages: setStoredMessages,
    createChat,
    saveMessage,
    deleteChat,
    renameChat,
    selectChat,
    startNewChat,
  } = useChatStorage(user);

  // Use appropriate messages based on auth state and memory setting
  // If memory is off, we only show current session messages (no history loading)
  const messages = isGuest ? guestMessages : storedMessages;
  const setMessages = isGuest ? setGuestMessages : setStoredMessages;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      
      if (event === 'SIGNED_IN' && newUser && !user) {
        setShowLoginPopup(true);
        // Check if we should show memory popup
        const popupShown = localStorage.getItem(MEMORY_POPUP_SHOWN_KEY);
        if (!popupShown) {
          setTimeout(() => {
            setShowLoginPopup(false);
            setShowMemoryPopup(true);
          }, 2000);
        }
      }
      
      setUser(newUser);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [user]);

  // Show guest upgrade popup after 10 seconds for guests
  useEffect(() => {
    if (isGuest) {
      const timer = setTimeout(() => {
        setShowGuestPopup(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isGuest]);

  // Save memory preference
  const handleMemoryToggle = (enabled: boolean) => {
    setMemoryEnabled(enabled);
    localStorage.setItem(MEMORY_STORAGE_KEY, String(enabled));
  };

  const handleDismissMemoryPopup = () => {
    localStorage.setItem(MEMORY_POPUP_SHOWN_KEY, 'true');
    setShowMemoryPopup(false);
  };

  // Handle message sent - create chat if needed for logged-in users with memory enabled
  const handleMessageSent = useCallback(async (message: Message) => {
    if (isGuest || !memoryEnabled) return;
    
    let chatId = currentSessionId;
    
    // Create new chat if no current session
    if (!chatId) {
      chatId = await createChat(message.content);
    }
    
    if (chatId) {
      await saveMessage(chatId, message);
    }
  }, [isGuest, memoryEnabled, currentSessionId, createChat, saveMessage]);

  // Handle assistant response
  const handleAssistantResponse = useCallback(async (message: Message) => {
    if (isGuest || !currentSessionId || !memoryEnabled) return;
    await saveMessage(currentSessionId, message);
  }, [isGuest, currentSessionId, saveMessage, memoryEnabled]);

  // Handle clear chat for guests
  const handleClearChat = useCallback(() => {
    if (isGuest) {
      setGuestMessages([]);
    }
  }, [isGuest]);

  // Handle new chat - ChatGPT style (just start fresh, create on first message)
  const handleNewChat = useCallback(() => {
    startNewChat();
  }, [startNewChat]);

  return (
    <div className="h-[100dvh] bg-background flex overflow-hidden">
      {/* Chat Sidebar - Only for logged in users with memory enabled */}
      {!isGuest && memoryEnabled && (
        <ChatSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={handleNewChat}
          onSelectChat={selectChat}
          onDeleteChat={deleteChat}
          onRenameChat={renameChat}
          isGuest={isGuest}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Language selector overlay */}
        <LanguageSelector centered />

        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
          <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 ml-10 md:ml-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow-primary">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
              </div>
              <span className="text-base sm:text-lg font-semibold text-foreground">{t('title')}</span>
            </div>
            <div className="flex items-center gap-1">
              {/* Memory Toggle - Only for logged in users */}
              {!isGuest && (
                <MemoryToggle
                  enabled={memoryEnabled}
                  onToggle={handleMemoryToggle}
                  showInitialPopup={showMemoryPopup}
                  onDismissPopup={handleDismissMemoryPopup}
                />
              )}
              <LanguageSelector />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main chat area */}
        <main className="flex-1 min-h-0">
          <HomeworkChat 
            isGuest={isGuest} 
            imageLimit={imageLimit}
            messages={messages}
            setMessages={setMessages}
            onMessageSent={handleMessageSent}
            onAssistantResponse={handleAssistantResponse}
            onClearChat={handleClearChat}
          />
        </main>
      </div>

      {/* Popups */}
      <GuestUpgradePopup show={showGuestPopup} onClose={() => setShowGuestPopup(false)} />
      <LoginSuccessPopup show={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
    </div>
  );
};

export default Index;