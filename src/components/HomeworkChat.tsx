import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Upload, X, Loader2, Sparkles, Copy, Check, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHomeworkHelper } from '@/hooks/useHomeworkHelper';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Message } from '@/hooks/useChatStorage';

// Define pdfjsLib type
interface PdfJsLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (params: { data: ArrayBuffer }) => { promise: Promise<PdfDocument> };
}

interface PdfDocument {
  numPages: number;
  getPage: (pageNum: number) => Promise<PdfPage>;
}

interface PdfPage {
  getTextContent: () => Promise<{ items: Array<{ str: string }> }>;
}

// Dynamically load PDF.js from CDN
const loadPdfJs = async (): Promise<PdfJsLib> => {
  const win = window as unknown as { pdfjsLib?: PdfJsLib };
  if (win.pdfjsLib) {
    return win.pdfjsLib;
  }
  
  return new Promise<PdfJsLib>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as unknown as { pdfjsLib: PdfJsLib }).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

interface HomeworkChatProps {
  isGuest: boolean;
  imageLimit: number;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  memoryMessages?: Message[];
  onMessageSent?: (message: Message) => void;
  onAssistantResponse?: (message: Message) => void;
  onClearChat?: () => void;
}

export function HomeworkChat({ 
  isGuest, 
  imageLimit, 
  messages, 
  setMessages,
  memoryMessages,
  onMessageSent,
  onAssistantResponse,
  onClearChat
}: HomeworkChatProps) {
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageCount, setImageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { isLoading, error, sendQuestion, clearMessages } = useHomeworkHelper({
    messages,
    setMessages,
    memoryMessages,
    onMessageSent,
    onAssistantResponse,
  });
  
  const { toast } = useToast();
  const { t, language, languageName } = useLanguage();

  const remainingImages = imageLimit - imageCount;

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
    
    let fullContext = context.trim();
    if (uploadedImages.length > 0) {
      fullContext += `\n\n[User uploaded ${uploadedImages.length} image(s)]`;
    }
    
    // Pass images to be stored with the message
    sendQuestion(input.trim(), fullContext || undefined, languageName, uploadedImages.length > 0 ? [...uploadedImages] : undefined);
    setInput('');
    setUploadedImages([]);
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
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isText = file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/');
    const isDoc = file.name.endsWith('.doc') || file.name.endsWith('.docx');
    const isPpt = file.name.endsWith('.ppt') || file.name.endsWith('.pptx');
    const isExcel = file.name.endsWith('.xls') || file.name.endsWith('.xlsx');

    if (isImage) {
      if (imageCount >= imageLimit) {
        toast({ 
          description: t('imageLimit'), 
          variant: 'destructive' 
        });
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setUploadedImages(prev => [...prev, imageUrl]);
        setImageCount(prev => prev + 1);
        toast({ description: `🖼️ ${file.name}` });
      };
      reader.readAsDataURL(file);
    } else if (isText) {
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
    } else if (isDoc || isPpt || isExcel) {
      toast({ description: `📎 ${file.name} attached` });
      setContext(`[Attached file: ${file.name}]`);
      setShowContext(true);
    } else {
      toast({
        description: 'Supported: images, .txt, .md, .pdf, .doc, .ppt, .xls',
        variant: 'destructive',
      });
    }
    
    e.target.value = '';
  };

  const handleClearMessages = () => {
    clearMessages();
    setImageCount(0);
    setUploadedImages([]);
    setContext('');
    setShowContext(false);
    onClearChat?.();
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const isRTL = language === 'he' || language === 'ar';

  return (
    <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 sm:py-12 px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-3 sm:mb-4 glow-primary">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-1">{t('welcome')}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">{t('welcomeSub')}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`group flex message-appear ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="relative max-w-[90%] sm:max-w-[85%]">
              <div
                className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-muted/80 hover:bg-muted'
                }`}
              >
                {/* Show attached images for user messages */}
                {msg.role === 'user' && msg.images && msg.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.images.map((img, imgIdx) => (
                      <img 
                        key={imgIdx}
                        src={img} 
                        alt={`Attached ${imgIdx + 1}`} 
                        className="w-20 h-20 object-cover rounded-lg border border-primary-foreground/20"
                      />
                    ))}
                  </div>
                )}
                
                {msg.role === 'assistant' ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed break-words">
                    {msg.content}
                  </pre>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={`absolute -bottom-1 ${msg.role === 'user' ? '-left-7 sm:-left-8' : '-right-7 sm:-right-8'} h-5 w-5 sm:h-6 sm:w-6 opacity-0 group-hover:opacity-100 transition-opacity`}
                onClick={() => handleCopy(msg.content, i)}
              >
                {copiedIndex === i ? (
                  <Check className="w-3 h-3 text-accent" />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start message-appear">
            <div className="bg-muted/80 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">{t('thinking')}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Uploaded images preview */}
      {uploadedImages.length > 0 && (
        <div className="border-t border-border px-3 sm:px-4 py-2 bg-muted/30 shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {uploadedImages.map((img, i) => (
              <div key={i} className="relative shrink-0">
                <img 
                  src={img} 
                  alt={`Upload ${i + 1}`} 
                  className="w-16 h-16 object-cover rounded-lg border border-border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full"
                  onClick={() => removeImage(i)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context panel */}
      {showContext && (
        <div className="border-t border-border px-3 sm:px-4 py-2 sm:py-3 bg-muted/30 shrink-0">
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
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none h-16 sm:h-20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t border-border p-3 sm:p-4 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <input
            type="file"
            accept=".txt,.md,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
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
              className="w-full bg-muted/50 border border-border rounded-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Image count indicator */}
            <span className="text-xs text-muted-foreground px-2 hidden sm:block">
              {remainingImages} {t('imagesRemaining')}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all"
              onClick={() => document.getElementById('file-upload')?.click()}
              title={t('uploadFile')}
              disabled={imageCount >= imageLimit}
            >
              <ImageIcon className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all"
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
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                onClick={handleClearMessages}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile image count */}
        <div className="sm:hidden text-center mt-2">
          <span className="text-xs text-muted-foreground">
            {remainingImages} {t('imagesRemaining')}
          </span>
        </div>
      </form>
    </div>
  );
}