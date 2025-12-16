import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Upload, X, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHomeworkHelper } from '@/hooks/useHomeworkHelper';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export function HomeworkChat() {
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [showContext, setShowContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, isLoading, error, sendQuestion, clearMessages } = useHomeworkHelper();
  const { toast } = useToast();
  const { t, language, languageName } = useLanguage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendQuestion(input.trim(), context.trim() || undefined, languageName);
    setInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContext(text);
        setShowContext(true);
        toast({ description: `📄 ${file.name}` });
      };
      reader.readAsText(file);
    } else {
      toast({
        description: 'Only .txt or .md files',
        variant: 'destructive',
      });
    }
  };

  const isRTL = language === 'he' || language === 'ar';

  return (
    <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-1">{t('welcome')}</h2>
            <p className="text-sm text-muted-foreground">{t('welcomeSub')}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/80'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {msg.content}
              </pre>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-muted/80 rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">{t('thinking')}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Context panel */}
      {showContext && (
        <div className="border-t border-border px-4 py-3 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Context</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => { setContext(''); setShowContext(false); }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={t('contextPlaceholder')}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {/* Input area - clean and simple */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".txt,.md"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('placeholder')}
              className="w-full bg-muted/50 border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => document.getElementById('file-upload')?.click()}
              title={t('uploadFile')}
            >
              <Upload className="w-4 h-4" />
            </Button>
            
            {messages.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                onClick={clearMessages}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-9 w-9 rounded-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}