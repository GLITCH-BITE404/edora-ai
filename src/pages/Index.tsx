import { HomeworkChat } from '@/components/HomeworkChat';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles } from 'lucide-react';

const Index = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Language selector overlay */}
      <LanguageSelector centered />

      {/* Header - minimal */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">{t('title')}</span>
          </div>
          <LanguageSelector />
        </div>
      </header>

      {/* Main chat area */}
      <main className="flex-1 container mx-auto max-w-2xl">
        <HomeworkChat />
      </main>
    </div>
  );
};

export default Index;