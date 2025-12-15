import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useHomeworkHelper } from '@/hooks/useHomeworkHelper';
import { useToast } from '@/hooks/use-toast';
import { LanguageSelector, LanguageCode } from './LanguageSelector';

interface HomeworkChatProps {
  language: LanguageCode;
}

export function HomeworkChat({ language }: HomeworkChatProps) {
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [showContext, setShowContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, error, sendQuestion, clearMessages } = useHomeworkHelper();
  const { toast } = useToast();

  const isRTL = language === 'he' || language === 'ar';

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
    sendQuestion(input.trim(), context.trim() || undefined, language);
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
        toast({
          title: 'File loaded',
          description: `Loaded ${file.name}`,
        });
      };
      reader.readAsText(file);
    } else {
      toast({
        title: 'Unsupported file',
        description: 'Please upload a .txt or .md file',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <FileText className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold gradient-text">Ask anything</h2>
              <p className="text-muted-foreground max-w-md">
                Paste your homework question or upload a text file. I'll give you direct answers.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            dir={isRTL && msg.role === 'assistant' ? 'rtl' : 'ltr'}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'glass'
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
            <div className="glass rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Context panel */}
      {showContext && (
        <div className="border-t border-border p-3 bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Homework context</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setContext('');
                setShowContext(false);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Paste homework content here..."
            className="min-h-[80px] text-sm resize-none"
          />
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4 bg-card/50">
        <div className="flex gap-2">
          <div className="flex gap-1">
            <input
              type="file"
              accept=".txt,.md"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => document.getElementById('file-upload')?.click()}
              title="Upload text file"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowContext(!showContext)}
              title="Add context"
              className={showContext ? 'bg-primary/10' : ''}
            >
              <FileText className="w-4 h-4" />
            </Button>
            {messages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={clearMessages}
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your homework question..."
            className="min-h-[44px] max-h-[120px] resize-none flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="glow-primary"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}