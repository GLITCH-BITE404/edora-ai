import { useLanguage, Language } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'he', name: 'עברית', flag: '🇮🇱' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

interface LanguageSelectorProps {
  centered?: boolean;
}

export const LanguageSelector = ({ centered = false }: LanguageSelectorProps) => {
  const { language, setLanguage, hasSelectedLanguage, t } = useLanguage();

  if (centered && hasSelectedLanguage) return null;

  if (centered) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-8 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Edora AI</h1>
            <p className="text-muted-foreground">{t('selectLanguage')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:flex sm:gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  'flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200 min-w-[120px]',
                  'hover:border-primary hover:scale-105',
                  language === lang.code
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                )}
              >
                <span className="text-5xl">{lang.flag}</span>
                <span className="text-sm font-medium text-foreground">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Compact version for corner
  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors">
        <span className="text-lg">{languages.find((l) => l.code === language)?.flag}</span>
      </button>
      <div className="absolute top-full right-0 mt-1 hidden group-hover:flex flex-col bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 min-w-[140px]">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted transition-colors text-left',
              language === lang.code && 'bg-muted'
            )}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="text-sm text-foreground">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
