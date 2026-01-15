import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface FocusSession {
  id: string;
  durationMinutes: number;
  topic: string | null;
  completed: boolean;
  startedAt: string;
  endedAt: string | null;
}

export function useFocusTimer(user: User | null, onComplete?: (minutes: number) => void) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 minutes default
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [topic, setTopic] = useState<string>('');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTimer = useCallback(async (durationMinutes: number = 25, sessionTopic?: string) => {
    if (isActive) return;

    const duration = durationMinutes * 60;
    setTotalDuration(duration);
    setTimeRemaining(duration);
    setTopic(sessionTopic || '');
    setIsActive(true);
    setIsPaused(false);

    // Create session in database if logged in
    if (user) {
      const { data } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          duration_minutes: durationMinutes,
          topic: sessionTopic || null,
        })
        .select()
        .single();

      if (data) {
        setCurrentSessionId(data.id);
      }
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Timer complete
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setIsActive(false);
          onComplete?.(durationMinutes);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isActive, user, onComplete]);

  const pauseTimer = useCallback(() => {
    if (!isActive || isPaused) return;
    
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isActive, isPaused]);

  const resumeTimer = useCallback(() => {
    if (!isActive || !isPaused) return;

    setIsPaused(false);
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setIsActive(false);
          const minutes = Math.floor(totalDuration / 60);
          onComplete?.(minutes);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isActive, isPaused, totalDuration, onComplete]);

  const stopTimer = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const elapsedSeconds = totalDuration - timeRemaining;
    const completed = elapsedSeconds >= totalDuration * 0.8; // 80% completion counts

    // Update session in database
    if (user && currentSessionId) {
      await supabase
        .from('study_sessions')
        .update({
          completed,
          ended_at: new Date().toISOString(),
        })
        .eq('id', currentSessionId);
    }

    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(totalDuration);
    setCurrentSessionId(null);

    if (completed) {
      const minutes = Math.floor(totalDuration / 60);
      onComplete?.(minutes);
    }
  }, [user, currentSessionId, totalDuration, timeRemaining, onComplete]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const progress = ((totalDuration - timeRemaining) / totalDuration) * 100;

  return {
    isActive,
    isPaused,
    timeRemaining,
    totalDuration,
    topic,
    progress,
    formattedTime: formatTime(timeRemaining),
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    setTopic,
  };
}
