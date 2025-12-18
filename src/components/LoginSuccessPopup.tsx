import { useEffect, useState } from 'react';
import { Check, Cloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoginSuccessPopupProps {
  show: boolean;
  onClose: () => void;
}

export function LoginSuccessPopup({ show, onClose }: LoginSuccessPopupProps) {
  const { t, language } = useLanguage();
  const [visible, setVisible] = useState(false);
  const isRTL = language === 'he' || language === 'ar';

  useEffect(() => {
    if (show) {
      setVisible(true);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={() => {
          setVisible(false);
          onClose();
        }}
      />

      {/* Modal */}
      <div
        className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-7 w-7"
          onClick={() => {
            setVisible(false);
            onClose();
          }}
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="text-center">
          {/* Success icon with animation */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center animate-pulse">
            <Check className="w-8 h-8 text-accent-foreground" />
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t('welcomeBack')}
          </h2>

          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
            <Cloud className="w-4 h-4" />
            <p className="text-sm">{t('chatsSaveInfo')}</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-accent shrink-0" />
              <span>{t('featureUnlimitedHistory')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-accent shrink-0" />
              <span>{t('featureMoreImages')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-accent shrink-0" />
              <span>{t('featureSyncDevices')}</span>
            </div>
          </div>

          <Button
            variant="glow"
            className="w-full mt-4"
            onClick={() => {
              setVisible(false);
              onClose();
            }}
          >
            {t('startChatting')}
          </Button>
        </div>
      </div>
    </div>
  );
}
