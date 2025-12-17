import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Upload, X, Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHomeworkHelper } from '@/hooks/useHomeworkHelper';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

// Dynamically load PDF.js from CDN
const loadPdfJs = async () => {
  if ((window as unknown as { pdfjsLib?: unknown }).pdfjsLib) {
    return (window as unknown as { pdfjsLib: typeof import('pdfjs-dist') }).pdfjsLib;
  }
  
  return new Promise<typeof import('pdfjs-dist')>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as unknown as { pdfjsLib: typeof import('pdfjs-dist') }).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export function HomeworkChat() {
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
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

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast({ description: 'Failed to copy', variant: 'destructive' });
    }
  };

  const extractPdfText = async (file: File): Promise<string> => {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: unknown) => (item as { str: string }).str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isText = file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (isText) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContext(text);
        setShowContext(true);
        toast({ description: `📄 ${file.name}` });
      };
      reader.readAsText(file);
    } else if (isPdf) {
      try {
        toast({ description: `⏳ Processing ${file.name}...` });
        const text = await extractPdfText(file);
        setContext(text);
        setShowContext(true);
        toast({ description: `📄 ${file.name}` });
      } catch {
        toast({ description: 'Failed to read PDF', variant: 'destructive' });
      }
    } else {
      toast({
        description: 'Only .txt, .md, or .pdf files',
        variant: 'destructive',
      });
    }
    
    // Reset input so same file can be selected again
    e.target.value = '';
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
            className={`group flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="relative">
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
              <Button
                variant="ghost"
                size="icon"
                className={`absolute -bottom-1 ${msg.role === 'user' ? '-left-8' : '-right-8'} h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity`}
                onClick={() => handleCopy(msg.content, i)}
              >
                {copiedIndex === i ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground" />
                )}
              </Button>
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
            accept=".txt,.md,.pdf"
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
