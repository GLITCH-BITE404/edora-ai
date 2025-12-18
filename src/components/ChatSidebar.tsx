import { useState } from 'react';
import { Plus, MessageSquare, Trash2, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  messageCount: number;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  isGuest: boolean;
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isGuest,
}: ChatSidebarProps) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const isRTL = language === 'he' || language === 'ar';

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-2 left-2 z-50 md:hidden h-9 w-9"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative z-40 h-full w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isRTL && "border-r-0 border-l md:right-0 md:left-auto"
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* New Chat Button */}
        <div className="p-3 border-b border-sidebar-border">
          <Button
            variant="glow"
            className="w-full justify-start gap-2"
            onClick={() => {
              onNewChat();
              setIsOpen(false);
            }}
          >
            <Plus className="w-4 h-4" />
            {t('newChat')}
          </Button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {t('noChats')}
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group sidebar-item flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer",
                  currentSessionId === session.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                )}
                onClick={() => {
                  onSelectChat(session.id);
                  setIsOpen(false);
                }}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate text-sm">{session.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(session.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Guest indicator */}
        {isGuest && (
          <div className="p-3 border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground text-center">
              {t('guestMode')}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
