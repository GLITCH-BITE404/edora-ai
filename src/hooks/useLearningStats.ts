import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface LearningStats {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalStudyMinutes: number;
  questionsAsked: number;
  flashcardsMastered: number;
  teachingSessions: number;
}

export interface Achievement {
  id: string;
  achievementType: string;
  achievementName: string;
  earnedAt: string;
}

const ACHIEVEMENTS_CONFIG = [
  { type: 'first_question', name: '🎯 First Question', xpRequired: 0, questionsRequired: 1 },
  { type: 'streak_3', name: '🔥 3 Day Streak', streakRequired: 3 },
  { type: 'streak_7', name: '⚡ Week Warrior', streakRequired: 7 },
  { type: 'streak_30', name: '🏆 Monthly Master', streakRequired: 30 },
  { type: 'level_5', name: '⭐ Rising Star', levelRequired: 5 },
  { type: 'level_10', name: '🌟 Knowledge Seeker', levelRequired: 10 },
  { type: 'questions_50', name: '💬 Curious Mind', questionsRequired: 50 },
  { type: 'questions_100', name: '🧠 Deep Thinker', questionsRequired: 100 },
  { type: 'flashcards_10', name: '📚 Flash Master', flashcardsRequired: 10 },
  { type: 'teaching_5', name: '👨‍🏫 Teacher Mode', teachingRequired: 5 },
];

export function useLearningStats(user: User | null) {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!user) {
      setStats(null);
      setAchievements([]);
      setLoading(false);
      return;
    }

    try {
      // Load stats
      const { data: statsData } = await supabase
        .from('learning_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (statsData) {
        setStats({
          xp: statsData.xp ?? 0,
          level: statsData.level ?? 1,
          currentStreak: statsData.current_streak ?? 0,
          longestStreak: statsData.longest_streak ?? 0,
          totalStudyMinutes: statsData.total_study_minutes ?? 0,
          questionsAsked: statsData.questions_asked ?? 0,
          flashcardsMastered: statsData.flashcards_mastered ?? 0,
          teachingSessions: statsData.teaching_sessions ?? 0,
        });
      } else {
        // Create initial stats
        const { data: newStats } = await supabase
          .from('learning_stats')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (newStats) {
          setStats({
            xp: 0,
            level: 1,
            currentStreak: 0,
            longestStreak: 0,
            totalStudyMinutes: 0,
            questionsAsked: 0,
            flashcardsMastered: 0,
            teachingSessions: 0,
          });
        }
      }

      // Load achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id);

      if (achievementsData) {
        setAchievements(achievementsData.map(a => ({
          id: a.id,
          achievementType: a.achievement_type,
          achievementName: a.achievement_name,
          earnedAt: a.earned_at,
        })));
      }
    } catch (err) {
      console.error('Error loading learning stats:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const checkAndAwardAchievements = useCallback(async (currentStats: LearningStats) => {
    if (!user) return;

    const earnedTypes = achievements.map(a => a.achievementType);
    const newAchievements: { type: string; name: string }[] = [];

    for (const config of ACHIEVEMENTS_CONFIG) {
      if (earnedTypes.includes(config.type)) continue;

      let earned = false;
      if (config.questionsRequired && currentStats.questionsAsked >= config.questionsRequired) {
        earned = true;
      }
      if (config.streakRequired && currentStats.currentStreak >= config.streakRequired) {
        earned = true;
      }
      if (config.levelRequired && currentStats.level >= config.levelRequired) {
        earned = true;
      }
      if (config.flashcardsRequired && currentStats.flashcardsMastered >= config.flashcardsRequired) {
        earned = true;
      }
      if (config.teachingRequired && currentStats.teachingSessions >= config.teachingRequired) {
        earned = true;
      }

      if (earned) {
        newAchievements.push({ type: config.type, name: config.name });
      }
    }

    // Award new achievements
    for (const achievement of newAchievements) {
      await supabase.from('achievements').insert({
        user_id: user.id,
        achievement_type: achievement.type,
        achievement_name: achievement.name,
      });
    }

    if (newAchievements.length > 0) {
      loadStats();
    }

    return newAchievements;
  }, [user, achievements, loadStats]);

  const addXP = useCallback(async (amount: number) => {
    if (!user || !stats) return;

    const newXP = stats.xp + amount;
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

    await supabase
      .from('learning_stats')
      .update({ xp: newXP, level: newLevel, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    const newStats = { ...stats, xp: newXP, level: newLevel };
    setStats(newStats);
    await checkAndAwardAchievements(newStats);
  }, [user, stats, checkAndAwardAchievements]);

  const incrementTeachingSessions = useCallback(async () => {
    if (!user || !stats) return;

    const newCount = stats.teachingSessions + 1;
    await supabase
      .from('learning_stats')
      .update({ teaching_sessions: newCount, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    const newStats = { ...stats, teachingSessions: newCount };
    setStats(newStats);
    await checkAndAwardAchievements(newStats);
  }, [user, stats, checkAndAwardAchievements]);

  const incrementFlashcardsMastered = useCallback(async () => {
    if (!user || !stats) return;

    const newCount = stats.flashcardsMastered + 1;
    await supabase
      .from('learning_stats')
      .update({ flashcards_mastered: newCount, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    const newStats = { ...stats, flashcardsMastered: newCount };
    setStats(newStats);
    await checkAndAwardAchievements(newStats);
  }, [user, stats, checkAndAwardAchievements]);

  const addStudyMinutes = useCallback(async (minutes: number) => {
    if (!user || !stats) return;

    const newMinutes = stats.totalStudyMinutes + minutes;
    await supabase
      .from('learning_stats')
      .update({ total_study_minutes: newMinutes, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    setStats({ ...stats, totalStudyMinutes: newMinutes });
  }, [user, stats]);

  return {
    stats,
    achievements,
    loading,
    addXP,
    incrementTeachingSessions,
    incrementFlashcardsMastered,
    addStudyMinutes,
    refresh: loadStats,
  };
}
