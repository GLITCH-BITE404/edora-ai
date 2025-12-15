import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'he', name: 'עברית', flag: '🇮🇱' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
] as const;

export type LanguageCode = typeof languages[number]['code'];

interface LanguageSelectorProps {
  value: LanguageCode;
  onChange: (value: LanguageCode) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const selectedLang = languages.find(l => l.code === value);

  return (
    <Select value={value} onValueChange={(v) => onChange(v as LanguageCode)}>
      <SelectTrigger className="w-[140px] glass">
        <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
        <SelectValue>
          {selectedLang && (
            <span className="flex items-center gap-2">
              <span>{selectedLang.flag}</span>
              <span className="hidden sm:inline">{selectedLang.name}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}