import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'he' | 'ru' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  hasSelectedLanguage: boolean;
  t: (key: string) => string;
  languageName: string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    title: 'Edora AI',
    subtitle: 'Your smart study companion',
    placeholder: 'Ask me anything...',
    contextPlaceholder: 'Paste homework text here...',
    send: 'Send',
    uploadFile: 'Upload file',
    thinking: 'Thinking...',
    selectLanguage: 'Choose your language',
    welcome: 'Hi! How can I help?',
    welcomeSub: 'Ask a question or paste your homework',
  },
  he: {
    title: 'Edora AI',
    subtitle: 'העוזר החכם שלך',
    placeholder: 'שאל אותי הכל...',
    contextPlaceholder: 'הדבק כאן טקסט משיעורי בית...',
    send: 'שלח',
    uploadFile: 'העלה קובץ',
    thinking: 'חושב...',
    selectLanguage: 'בחר שפה',
    welcome: 'היי! איך אני יכול לעזור?',
    welcomeSub: 'שאל שאלה או הדבק שיעורי בית',
  },
  ru: {
    title: 'Edora AI',
    subtitle: 'Твой умный помощник',
    placeholder: 'Спроси что угодно...',
    contextPlaceholder: 'Вставьте текст домашки...',
    send: 'Отправить',
    uploadFile: 'Загрузить файл',
    thinking: 'Думаю...',
    selectLanguage: 'Выберите язык',
    welcome: 'Привет! Чем помочь?',
    welcomeSub: 'Задай вопрос или вставь домашку',
  },
  ar: {
    title: 'Edora AI',
    subtitle: 'مساعدك الذكي',
    placeholder: 'اسألني أي شيء...',
    contextPlaceholder: 'الصق نص الواجب هنا...',
    send: 'إرسال',
    uploadFile: 'تحميل ملف',
    thinking: 'أفكر...',
    selectLanguage: 'اختر لغتك',
    welcome: 'مرحبا! كيف أساعدك؟',
    welcomeSub: 'اطرح سؤالاً أو الصق واجبك',
  },
};

const languageNames: Record<Language, string> = {
  en: 'English',
  he: 'Hebrew',
  ru: 'Russian',
  ar: 'Arabic',
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('edora-language');
    if (saved && ['en', 'he', 'ru', 'ar'].includes(saved)) {
      setLanguageState(saved as Language);
      setHasSelectedLanguage(true);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setHasSelectedLanguage(true);
    localStorage.setItem('edora-language', lang);
  };

  const t = (key: string) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, hasSelectedLanguage, t, languageName: languageNames[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
