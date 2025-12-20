import { useState, useEffect } from 'react';
import { Brain, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';

interface MemoryToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  showInitialPopup?: boolean;
  onDismissPopup?: () => void;
}

export function MemoryToggle({ 
  enabled, 
  onToggle, 
  showInitialPopup = false,
  onDismissPopup 
}: MemoryToggleProps) {
  const [showPopup, setShowPopup] = useState(showInitialPopup);
  const [showTooltip, setShowTooltip] = useState(false);
  const { language } = useLanguage();
  const isRTL = language === 'he' || language === 'ar';

  useEffect(() => {
    setShowPopup(showInitialPopup);
  }, [showInitialPopup]);

  const handleDismiss = () => {
    setShowPopup(false);
    onDismissPopup?.();
  };

  const handleToggle = (value: boolean) => {
    onToggle(value);
    setShowPopup(false);
    onDismissPopup?.();
  };

  return (
    <>
      {/* Memory Toggle Button in Header */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-1.5 h-8 px-2 sm:px-3 ${enabled ? 'text-primary' : 'text-muted-foreground'}`}
          onClick={() => setShowTooltip(!showTooltip)}
        >
          <Brain className={`w-4 h-4 ${enabled ? 'text-primary' : ''}`} />
          <span className="hidden sm:inline text-xs font-medium">
            {enabled ? 'Memory On' : 'Memory Off'}
          </span>
        </Button>

        {/* Tooltip/Dropdown */}
        {showTooltip && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowTooltip(false)} 
            />
            <div 
              className={`absolute top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-4 w-72 ${isRTL ? 'left-0' : 'right-0'}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">Chat Memory</span>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={handleToggle}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {enabled ? (
                  <>
                    <span className="text-primary font-medium">Memory is ON:</span> The AI remembers all your chats and important information across sessions.
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground font-medium">Memory is OFF:</span> The AI only remembers the current conversation. Chats are not saved.
                  </>
                )}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Initial Popup for new logged-in users */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div 
            className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-300"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 rounded-full"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
                <Brain className="w-8 h-8 text-primary-foreground" />
              </div>

              <h2 className="text-xl font-bold text-foreground mb-2">
                Enable Chat Memory?
              </h2>

              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                With memory enabled, the AI will remember all your conversations and important details across sessions. 
                Turn it off if you prefer each chat to be private and temporary.
              </p>

              <div className="w-full space-y-3">
                <div className="flex items-start gap-3 text-left bg-muted/50 rounded-lg p-3">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">When Memory is ON:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>All chats are saved to your account</li>
                      <li>AI remembers previous conversations</li>
                      <li>You can access chat history anytime</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleToggle(false)}
                  >
                    Keep Off
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleToggle(true)}
                  >
                    Enable Memory
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
