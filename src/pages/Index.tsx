import { useState, useEffect } from 'react';
import { HomeworkChat } from '@/components/HomeworkChat';
import { ChatSidebar, ChatSession } from '@/components/ChatSidebar';
import { LanguageSelector } from '@/components/LanguageSelector';
import { UserMenu } from '@/components/UserMenu';
import { GuestUpgradePopup } from '@/components/GuestUpgradePopup';
import { LoginSuccessPopup } from '@/components/LoginSuccessPopup';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

const Index = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const isGuest = !user;
  const imageLimit = isGuest ? 7 : 20;

  useEffect(() => {
    // Check auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      
      // Show login success popup when user logs in
      if (event === 'SIGNED_IN' && newUser && !user) {
        setShowLoginPopup(true);
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

  // Initialize with a default session
  useEffect(() => {
    if (sessions.length === 0) {
      const newSession: ChatSession = {
        id: crypto.randomUUID(),
        title: 'New Chat',
        createdAt: new Date(),
        messageCount: 0,
      };
      setSessions([newSession]);
      setCurrentSessionId(newSession.id);
    }
  }, [sessions.length]);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      createdAt: new Date(),
      messageCount: 0,
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const handleSelectChat = (id: string) => {
    setCurrentSessionId(id);
  };

  const handleDeleteChat = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      const remaining = sessions.filter(s => s.id !== id);
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  return (
    <div className="h-[100dvh] bg-background flex overflow-hidden">
      {/* Chat Sidebar */}
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isGuest={isGuest}
      />

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
              <LanguageSelector />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main chat area */}
        <main className="flex-1 min-h-0">
          <HomeworkChat isGuest={isGuest} imageLimit={imageLimit} />
        </main>
      </div>

      {/* Popups */}
      <GuestUpgradePopup show={showGuestPopup} onClose={() => setShowGuestPopup(false)} />
      <LoginSuccessPopup show={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
    </div>
  );
};

export default Index;
