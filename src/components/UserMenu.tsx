import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, UserCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function UserMenu() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ description: 'Logged out' });
  };

  if (!user) {
    return (
      <Link to="/auth">
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2 sm:px-3">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">{t('login')}</span>
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2 sm:px-3">
          <UserCircle className="w-4 h-4" />
          <span className="hidden sm:inline text-sm truncate max-w-[100px]">
            {user.email?.split('@')[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem className="text-xs text-muted-foreground">
          {user.email}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
