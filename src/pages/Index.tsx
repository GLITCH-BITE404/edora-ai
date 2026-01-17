import { useState, useEffect, useCallback, useRef } from 'react';
import { HomeworkChat } from '@/components/HomeworkChat';
import { ChatSidebar } from '@/components/ChatSidebar';
import { LanguageSelector } from '@/components/LanguageSelector';
import { UserMenu } from '@/components/UserMenu';
import { GuestUpgradePopup } from '@/components/GuestUpgradePopup';
import { LoginSuccessPopup } from '@/components/LoginSuccessPopup';
import { MemoryToggle } from '@/components/MemoryToggle';
import { LearningDashboard } from '@/components/LearningDashboard';
import { FocusTimerPanel } from '@/components/FocusTimerPanel';
import { FlashcardsPanel } from '@/components/FlashcardsPanel';
import { TeachingModePanel } from '@/components/TeachingModePanel';
import { StudyRoomsPanel } from '@/components/StudyRoomsPanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChatStorage, Message } from '@/hooks/useChatStorage';
import { useLearningStats } from '@/hooks/useLearningStats';
import { useFlashcards } from '@/hooks/useFlashcards';
import { useFocusTimer } from '@/hooks/useFocusTimer';
import { useStudyRooms } from '@/hooks/useStudyRooms';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, BarChart3, X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import type { User } from '@supabase/supabase-js';

const MEMORY_STORAGE_KEY = 'edora-memory-enabled';
const MEMORY_POPUP_SHOWN_KEY = 'edora-memory-popup-shown';

type LearningPanel = 'dashboard' | 'focus' | 'flashcards' | 'teaching' | 'rooms' | null;

const Index = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<User | null>(null);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showMemoryPopup, setShowMemoryPopup] = useState(false);
  const [learningPanel, setLearningPanel] = useState<LearningPanel>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(() => {
    const saved = localStorage.getItem(MEMORY_STORAGE_KEY);
    return saved === 'true';
  });

  const [guestMessages, setGuestMessages] = useState<Message[]>([]);
  const [accountMemoryMessages, setAccountMemoryMessages] = useState<Message[]>([]);
  const activeChatIdRef = useRef<string | null>(null);

  const isGuest = !user;
  const imageLimit = isGuest ? 7 : 20;

  // Hooks for learning features
  const { stats, achievements, addXP, incrementTeachingSessions, incrementFlashcardsMastered, addStudyMinutes } = useLearningStats(user);
  const { flashcards, createFlashcard, reviewFlashcard, deleteFlashcard, getDueFlashcards } = useFlashcards(user);
  const focusTimer = useFocusTimer(user, (minutes) => {
    addStudyMinutes(minutes);
    addXP(minutes * 2);
    toast({ description: `🎉 Focus session complete! +${minutes * 2} XP` });
  });
  const studyRooms = useStudyRooms(user);

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

  useEffect(() => {
    activeChatIdRef.current = currentSessionId;
  }, [currentSessionId]);

  useEffect(() => {
    const loadAccountMemory = async () => {
      if (!user || !memoryEnabled) {
        setAccountMemoryMessages([]);
        return;
      }
      try {
        const { data: chats } = await supabase.from('chats').select('id').eq('user_id', user.id);
        const chatIds = (chats || []).map((c) => c.id);
        if (chatIds.length === 0) { setAccountMemoryMessages([]); return; }
        const { data: msgs } = await supabase.from('messages').select('role, content, created_at, chat_id').in('chat_id', chatIds).order('created_at', { ascending: true }).limit(200);
        const formatted: Message[] = (msgs || []).map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
        setAccountMemoryMessages(formatted.slice(-60));
      } catch (err) { console.error('Error loading account memory:', err); }
    };
    loadAccountMemory();
  }, [user?.id, memoryEnabled]);

  const messages = isGuest ? guestMessages : storedMessages;
  const setMessages = isGuest ? setGuestMessages : setStoredMessages;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      if (event === 'SIGNED_IN' && newUser && !user) {
        setShowLoginPopup(true);
        const popupShown = localStorage.getItem(MEMORY_POPUP_SHOWN_KEY);
        if (!popupShown) { setTimeout(() => { setShowLoginPopup(false); setShowMemoryPopup(true); }, 2000); }
      }
      setUser(newUser);
    });
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null); });
    return () => subscription.unsubscribe();
  }, [user]);

  useEffect(() => {
    if (isGuest) {
      const timer = setTimeout(() => setShowGuestPopup(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [isGuest]);

  const handleMemoryToggle = (enabled: boolean) => { setMemoryEnabled(enabled); localStorage.setItem(MEMORY_STORAGE_KEY, String(enabled)); };
  const handleDismissMemoryPopup = () => { localStorage.setItem(MEMORY_POPUP_SHOWN_KEY, 'true'); setShowMemoryPopup(false); };

  const handleMessageSent = useCallback(async (message: Message) => {
    if (isGuest || !memoryEnabled) return;
    let chatId = activeChatIdRef.current;
    if (!chatId) chatId = await createChat(message.content);
    if (chatId) { activeChatIdRef.current = chatId; await saveMessage(chatId, message); setAccountMemoryMessages((prev) => [...prev, message].slice(-60)); }
  }, [isGuest, memoryEnabled, createChat, saveMessage]);

  const handleAssistantResponse = useCallback(async (message: Message) => {
    if (isGuest || !memoryEnabled) return;
    const chatId = activeChatIdRef.current;
    if (!chatId) return;
    await saveMessage(chatId, message);
    setAccountMemoryMessages((prev) => [...prev, message].slice(-60));
  }, [isGuest, memoryEnabled, saveMessage]);

  const handleSelectChat = useCallback(async (chatId: string) => { 
    activeChatIdRef.current = chatId; 
    await selectChat(chatId); 
    setSidebarOpen(false);
  }, [selectChat]);

  const handleClearChat = useCallback(() => { if (isGuest) setGuestMessages([]); }, [isGuest]);
  const handleNewChat = useCallback(() => { 
    activeChatIdRef.current = null; 
    startNewChat(); 
    setSidebarOpen(false);
  }, [startNewChat]);

  // Render learning panel content
  const renderLearningPanel = () => {
    if (!learningPanel || isGuest) return null;

    const panelContent = (
      <div className="h-full flex flex-col bg-background">
        {learningPanel === 'dashboard' && (
          <LearningDashboard 
            stats={stats} 
            achievements={achievements} 
            onOpenFlashcards={() => setLearningPanel('flashcards')} 
            onOpenTeachingMode={() => setLearningPanel('teaching')} 
            onOpenFocusTimer={() => setLearningPanel('focus')} 
            onOpenStudyRooms={() => setLearningPanel('rooms')} 
          />
        )}
        {learningPanel === 'focus' && (
          <FocusTimerPanel 
            {...focusTimer} 
            onStart={focusTimer.startTimer} 
            onPause={focusTimer.pauseTimer} 
            onResume={focusTimer.resumeTimer} 
            onStop={focusTimer.stopTimer} 
            onClose={() => setLearningPanel('dashboard')} 
          />
        )}
        {learningPanel === 'flashcards' && (
          <FlashcardsPanel 
            flashcards={flashcards} 
            dueFlashcards={getDueFlashcards()} 
            onCreateFlashcard={createFlashcard} 
            onReviewFlashcard={reviewFlashcard} 
            onDeleteFlashcard={deleteFlashcard} 
            onMastered={incrementFlashcardsMastered} 
            onClose={() => setLearningPanel('dashboard')} 
          />
        )}
        {learningPanel === 'teaching' && (
          <TeachingModePanel 
            onComplete={() => { incrementTeachingSessions(); addXP(25); }} 
            onClose={() => setLearningPanel('dashboard')} 
          />
        )}
        {learningPanel === 'rooms' && (
          <StudyRoomsPanel 
            rooms={studyRooms.rooms} 
            currentRoom={studyRooms.currentRoom} 
            roomMessages={studyRooms.roomMessages} 
            roomMembers={studyRooms.roomMembers} 
            userId={user?.id || ''} 
            onCreateRoom={studyRooms.createRoom} 
            onJoinRoom={studyRooms.joinRoom} 
            onLeaveRoom={studyRooms.leaveRoom} 
            onSelectRoom={studyRooms.selectRoom} 
            onSendMessage={studyRooms.sendRoomMessage} 
            onClose={() => setLearningPanel('dashboard')} 
          />
        )}
      </div>
    );

    // On mobile, use a sheet/modal
    if (isMobile) {
      return (
        <Sheet open={!!learningPanel} onOpenChange={(open) => !open && setLearningPanel(null)}>
          <SheetContent side="right" className="w-full sm:w-[400px] p-0">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold">Learning Tools</h2>
              <Button variant="ghost" size="icon" onClick={() => setLearningPanel(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            {panelContent}
          </SheetContent>
        </Sheet>
      );
    }

    // On desktop, show as sidebar panel
    return (
      <aside className="w-80 lg:w-96 border-l border-border bg-background shrink-0 overflow-hidden panel-slide-in">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h2 className="font-semibold text-sm">Learning Tools</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLearningPanel(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        {panelContent}
      </aside>
    );
  };

  // Sidebar content
  const sidebarContent = (
    <ChatSidebar 
      sessions={sessions} 
      currentSessionId={currentSessionId} 
      onNewChat={handleNewChat} 
      onSelectChat={handleSelectChat} 
      onDeleteChat={deleteChat} 
      onRenameChat={renameChat} 
      isGuest={isGuest} 
    />
  );

  return (
    <div className="h-[100dvh] bg-background flex overflow-hidden">
      {/* Desktop Sidebar */}
      {!isGuest && memoryEnabled && !isMobile && (
        <div className="hidden md:block">
          {sidebarContent}
        </div>
      )}

      {/* Mobile Sidebar Sheet */}
      {!isGuest && memoryEnabled && isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Centered Language Selector - Desktop only */}
        <div className="hidden md:block">
          <LanguageSelector centered />
        </div>

        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10 shrink-0 safe-top">
          <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Mobile menu button */}
              {!isGuest && memoryEnabled && isMobile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 md:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-4 h-4" />
                </Button>
              )}
              
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow-primary shadow-lg">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold text-foreground leading-tight">{t('title')}</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Your AI learning companion</span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5">
              {!isGuest && (
                <Button 
                  variant={learningPanel ? "secondary" : "ghost"} 
                  size="icon" 
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-all" 
                  onClick={() => setLearningPanel(learningPanel ? null : 'dashboard')} 
                  title="Learning Dashboard"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              )}
              {!isGuest && <MemoryToggle enabled={memoryEnabled} onToggle={handleMemoryToggle} showInitialPopup={showMemoryPopup} onDismissPopup={handleDismissMemoryPopup} />}
              <LanguageSelector />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          <main className="flex-1 min-h-0">
            <HomeworkChat 
              isGuest={isGuest} 
              imageLimit={imageLimit} 
              messages={messages} 
              setMessages={setMessages} 
              memoryMessages={!isGuest && memoryEnabled ? accountMemoryMessages : undefined} 
              onMessageSent={handleMessageSent} 
              onAssistantResponse={handleAssistantResponse} 
              onClearChat={handleClearChat} 
            />
          </main>

          {/* Desktop Learning Panel */}
          {!isMobile && renderLearningPanel()}
        </div>
      </div>

      {/* Mobile Learning Panel (Sheet) */}
      {isMobile && renderLearningPanel()}

      <GuestUpgradePopup show={showGuestPopup} onClose={() => setShowGuestPopup(false)} />
      <LoginSuccessPopup show={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
    </div>
  );
};

export default Index;
