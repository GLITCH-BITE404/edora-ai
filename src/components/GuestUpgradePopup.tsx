import { useEffect, useState } from 'react';
import { X, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface GuestUpgradePopupProps {
  show: boolean;
  onClose: () => void;
}

export function GuestUpgradePopup({ show, onClose }: GuestUpgradePopupProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const isRTL = language === 'he' || language === 'ar';

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-fade-in"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="bg-gradient-to-r from-primary/90 to-accent/90 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-primary-foreground/20">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => {
            setVisible(false);
            onClose();
          }}
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-primary-foreground text-sm mb-1">
              {t('upgradeTitle')}
            </h3>
            <p className="text-xs text-primary-foreground/80 mb-3">
              {t('upgradeDesc')}
            </p>
            <div className="flex items-center gap-2 text-xs text-primary-foreground/90 mb-3">
              <Zap className="w-3 h-3" />
              <span>{t('upgradeFeatures')}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              onClick={() => {
                navigate('/auth');
                setVisible(false);
                onClose();
              }}
            >
              {t('createAccount')}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-primary-foreground/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-foreground/60 rounded-full"
            style={{ animation: 'shrink 5s linear forwards' }}
          />
        </div>
        <style>{`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
    </div>
  );
}
