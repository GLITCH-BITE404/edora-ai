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
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    loginDesc: 'Welcome back to Edora AI',
    signupDesc: 'Create an account to save your chats',
    noAccount: "Don't have an account? Sign up",
    hasAccount: 'Already have an account? Login',
    guestNote: 'You can also use Edora AI as a guest',
    backToChat: 'Back to chat',
    guest: 'Guest',
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
    login: 'התחברות',
    signup: 'הרשמה',
    logout: 'התנתק',
    email: 'אימייל',
    password: 'סיסמה',
    loginDesc: 'ברוך הבא חזרה',
    signupDesc: 'צור חשבון כדי לשמור את השיחות',
    noAccount: 'אין לך חשבון? הירשם',
    hasAccount: 'יש לך חשבון? התחבר',
    guestNote: 'אפשר גם להשתמש כאורח',
    backToChat: 'חזרה לצאט',
    guest: 'אורח',
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
    login: 'Войти',
    signup: 'Регистрация',
    logout: 'Выйти',
    email: 'Почта',
    password: 'Пароль',
    loginDesc: 'С возвращением',
    signupDesc: 'Создай аккаунт для сохранения чатов',
    noAccount: 'Нет аккаунта? Зарегистрируйся',
    hasAccount: 'Уже есть аккаунт? Войди',
    guestNote: 'Можно использовать как гость',
    backToChat: 'Назад к чату',
    guest: 'Гость',
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
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    loginDesc: 'مرحبا بعودتك',
    signupDesc: 'أنشئ حسابا لحفظ محادثاتك',
    noAccount: 'ليس لديك حساب؟ سجل',
    hasAccount: 'لديك حساب؟ سجل دخول',
    guestNote: 'يمكنك استخدام التطبيق كضيف',
    backToChat: 'العودة للمحادثة',
    guest: 'ضيف',
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
