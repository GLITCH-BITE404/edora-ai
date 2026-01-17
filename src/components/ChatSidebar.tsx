import { useState } from 'react';
import { Plus, MessageSquare, Trash2, Pencil, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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
  onRenameChat: (id: string, newTitle: string) => void;
  isGuest: boolean;
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
}: ChatSidebarProps) {
  const { t, language } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const isRTL = language === 'he' || language === 'ar';

  const startEditing = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveEdit = (id: string) => {
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <aside
      className={cn(
        "h-full w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col",
        isRTL && "border-r-0 border-l"
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-sm">Chat History</h2>
        </div>
        <Button
          className="w-full justify-center gap-2 btn-glow btn-ripple"
          onClick={onNewChat}
        >
          <Plus className="w-4 h-4" />
          {t('newChat')}
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t('noChats')}</p>
            <p className="text-xs text-muted-foreground mt-1">Start a conversation to see it here</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group sidebar-item flex flex-col gap-1 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 tap-highlight",
                currentSessionId === session.id
                  ? "bg-primary/10 border border-primary/20 shadow-sm"
                  : "hover:bg-sidebar-accent/50 border border-transparent"
              )}
              onClick={() => {
                if (editingId !== session.id) {
                  onSelectChat(session.id);
                }
              }}
            >
              {editingId === session.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(session.id);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      saveEdit(session.id);
                    }}
                  >
                    <Check className="w-4 h-4 text-primary" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex-1 truncate text-sm font-medium leading-tight">
                      {session.title}
                    </span>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => startEditing(session, e)}
                      >
                        <Pencil className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(session.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(session.createdAt, { addSuffix: true })}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>{session.messageCount} messages</span>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
