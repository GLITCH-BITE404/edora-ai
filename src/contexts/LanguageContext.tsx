import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'he' | 'ru' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  hasSelectedLanguage: boolean;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    title: 'Homework Helper',
    subtitle: 'Quick answers, no fluff',
    placeholder: 'Type your homework question...',
    contextPlaceholder: 'Optional: paste additional context...',
    send: 'Send',
    uploadFile: 'Upload .txt or .md file',
    thinking: 'Thinking...',
    selectLanguage: 'Select your language',
  },
  he: {
    title: 'עוזר שיעורי בית',
    subtitle: 'תשובות מהירות, בלי סיבוכים',
    placeholder: 'הקלד את שאלת שיעורי הבית שלך...',
    contextPlaceholder: 'אופציונלי: הדבק הקשר נוסף...',
    send: 'שלח',
    uploadFile: 'העלה קובץ .txt או .md',
    thinking: 'חושב...',
    selectLanguage: 'בחר את השפה שלך',
  },
  ru: {
    title: 'Помощник с домашкой',
    subtitle: 'Быстрые ответы, без лишнего',
    placeholder: 'Введите ваш вопрос...',
    contextPlaceholder: 'Опционально: вставьте дополнительный контекст...',
    send: 'Отправить',
    uploadFile: 'Загрузить .txt или .md файл',
    thinking: 'Думаю...',
    selectLanguage: 'Выберите язык',
  },
  ar: {
    title: 'مساعد الواجبات',
    subtitle: 'إجابات سريعة، بدون تعقيد',
    placeholder: 'اكتب سؤال واجبك...',
    contextPlaceholder: 'اختياري: الصق سياق إضافي...',
    send: 'إرسال',
    uploadFile: 'تحميل ملف .txt أو .md',
    thinking: 'جاري التفكير...',
    selectLanguage: 'اختر لغتك',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('homework-helper-language');
    if (saved && ['en', 'he', 'ru', 'ar'].includes(saved)) {
      setLanguageState(saved as Language);
      setHasSelectedLanguage(true);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setHasSelectedLanguage(true);
    localStorage.setItem('homework-helper-language', lang);
  };

  const t = (key: string) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, hasSelectedLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
