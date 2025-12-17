import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, Mail, Lock, ArrowLeft } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const isRTL = language === 'he' || language === 'ar';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({ description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ description: 'Welcome back!' });
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { emailRedirectTo: `${window.location.origin}/` }
        });
        if (error) throw error;
        toast({ description: 'Account created! You can now use Edora AI.' });
        navigate('/');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      toast({ description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToChat') || 'Back to chat'}
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {isLogin ? (t('login') || 'Login') : (t('signup') || 'Sign Up')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLogin 
                ? (t('loginDesc') || 'Welcome back to Edora AI')
                : (t('signupDesc') || 'Create an account to save your chats')
              }
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder={t('email') || 'Email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder={t('password') || 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '...' : (isLogin ? (t('login') || 'Login') : (t('signup') || 'Sign Up'))}
            </Button>
          </form>

          <div className="text-center space-y-3">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin 
                ? (t('noAccount') || "Don't have an account? Sign up")
                : (t('hasAccount') || 'Already have an account? Login')
              }
            </button>
            
            <div className="text-xs text-muted-foreground">
              {t('guestNote') || 'You can also use Edora AI as a guest without an account'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
