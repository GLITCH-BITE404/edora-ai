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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-card border border-border shadow-2xl">
          <h2 className="text-xl font-semibold text-foreground">{t('selectLanguage')}</h2>
          <div className="flex gap-4">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                  'hover:border-primary hover:bg-primary/10',
                  language === lang.code
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card'
                )}
              >
                <span className="text-4xl">{lang.flag}</span>
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
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary transition-colors">
        <span className="text-xl">{languages.find((l) => l.code === language)?.flag}</span>
        <span className="text-sm text-muted-foreground">
          {languages.find((l) => l.code === language)?.name}
        </span>
      </button>
      <div className="absolute top-full left-0 mt-2 hidden group-hover:flex flex-col bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors',
              language === lang.code && 'bg-primary/10'
            )}
          >
            <span className="text-xl">{lang.flag}</span>
            <span className="text-sm text-foreground">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
