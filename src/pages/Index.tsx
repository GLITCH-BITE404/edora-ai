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
import { Sparkles, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

const MEMORY_STORAGE_KEY = 'edora-memory-enabled';
const MEMORY_POPUP_SHOWN_KEY = 'edora-memory-popup-shown';

type LearningPanel = 'dashboard' | 'focus' | 'flashcards' | 'teaching' | 'rooms' | null;

const Index = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showMemoryPopup, setShowMemoryPopup] = useState(false);
  const [learningPanel, setLearningPanel] = useState<LearningPanel>(null);
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

  const handleSelectChat = useCallback(async (chatId: string) => { activeChatIdRef.current = chatId; await selectChat(chatId); }, [selectChat]);
  const handleClearChat = useCallback(() => { if (isGuest) setGuestMessages([]); }, [isGuest]);
  const handleNewChat = useCallback(() => { activeChatIdRef.current = null; startNewChat(); }, [startNewChat]);

  return (
    <div className="h-[100dvh] bg-background flex overflow-hidden">
      {!isGuest && memoryEnabled && (
        <ChatSidebar sessions={sessions} currentSessionId={currentSessionId} onNewChat={handleNewChat} onSelectChat={handleSelectChat} onDeleteChat={deleteChat} onRenameChat={renameChat} isGuest={isGuest} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <LanguageSelector centered />
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
          <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 ml-10 md:ml-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow-primary">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
              </div>
              <span className="text-base sm:text-lg font-semibold text-foreground">{t('title')}</span>
            </div>
            <div className="flex items-center gap-1">
              {!isGuest && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLearningPanel(learningPanel ? null : 'dashboard')} title="Learning Dashboard">
                  <BarChart3 className="w-4 h-4" />
                </Button>
              )}
              {!isGuest && <MemoryToggle enabled={memoryEnabled} onToggle={handleMemoryToggle} showInitialPopup={showMemoryPopup} onDismissPopup={handleDismissMemoryPopup} />}
              <LanguageSelector />
              <UserMenu />
            </div>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          <main className="flex-1 min-h-0">
            <HomeworkChat isGuest={isGuest} imageLimit={imageLimit} messages={messages} setMessages={setMessages} memoryMessages={!isGuest && memoryEnabled ? accountMemoryMessages : undefined} onMessageSent={handleMessageSent} onAssistantResponse={handleAssistantResponse} onClearChat={handleClearChat} />
          </main>

          {learningPanel && !isGuest && (
            <aside className="w-80 border-l border-border bg-background shrink-0 overflow-hidden">
              {learningPanel === 'dashboard' && (
                <LearningDashboard stats={stats} achievements={achievements} onOpenFlashcards={() => setLearningPanel('flashcards')} onOpenTeachingMode={() => setLearningPanel('teaching')} onOpenFocusTimer={() => setLearningPanel('focus')} onOpenStudyRooms={() => setLearningPanel('rooms')} />
              )}
              {learningPanel === 'focus' && (
                <FocusTimerPanel {...focusTimer} onStart={focusTimer.startTimer} onPause={focusTimer.pauseTimer} onResume={focusTimer.resumeTimer} onStop={focusTimer.stopTimer} onClose={() => setLearningPanel('dashboard')} />
              )}
              {learningPanel === 'flashcards' && (
                <FlashcardsPanel flashcards={flashcards} dueFlashcards={getDueFlashcards()} onCreateFlashcard={createFlashcard} onReviewFlashcard={reviewFlashcard} onDeleteFlashcard={deleteFlashcard} onMastered={incrementFlashcardsMastered} onClose={() => setLearningPanel('dashboard')} />
              )}
              {learningPanel === 'teaching' && (
                <TeachingModePanel onComplete={() => { incrementTeachingSessions(); addXP(25); }} onClose={() => setLearningPanel('dashboard')} />
              )}
              {learningPanel === 'rooms' && (
                <StudyRoomsPanel rooms={studyRooms.rooms} currentRoom={studyRooms.currentRoom} roomMessages={studyRooms.roomMessages} roomMembers={studyRooms.roomMembers} userId={user?.id || ''} onCreateRoom={studyRooms.createRoom} onJoinRoom={studyRooms.joinRoom} onLeaveRoom={studyRooms.leaveRoom} onSelectRoom={studyRooms.selectRoom} onSendMessage={studyRooms.sendRoomMessage} onClose={() => setLearningPanel('dashboard')} />
              )}
            </aside>
          )}
        </div>
      </div>

      <GuestUpgradePopup show={showGuestPopup} onClose={() => setShowGuestPopup(false)} />
      <LoginSuccessPopup show={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
    </div>
  );
};

export default Index;
