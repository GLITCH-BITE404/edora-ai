import { HomeworkChat } from '@/components/HomeworkChat';
import { LanguageSelector } from '@/components/LanguageSelector';
import { UserMenu } from '@/components/UserMenu';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles } from 'lucide-react';

const Index = () => {
  const { t } = useLanguage();

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Language selector overlay */}
      <LanguageSelector centered />

      {/* Header - minimal */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
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
      <main className="flex-1 min-h-0 w-full max-w-4xl mx-auto">
        <HomeworkChat />
      </main>
    </div>
  );
};

export default Index;