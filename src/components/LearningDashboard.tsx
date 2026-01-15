import { useState } from 'react';
import { 
  Trophy, Flame, Zap, BookOpen, Brain, Timer, Users, 
  ChevronRight, Star, Target, Award, TrendingUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LearningStats, Achievement } from '@/hooks/useLearningStats';

interface LearningDashboardProps {
  stats: LearningStats | null;
  achievements: Achievement[];
  onOpenFlashcards: () => void;
  onOpenTeachingMode: () => void;
  onOpenFocusTimer: () => void;
  onOpenStudyRooms: () => void;
}

export function LearningDashboard({
  stats,
  achievements,
  onOpenFlashcards,
  onOpenTeachingMode,
  onOpenFocusTimer,
  onOpenStudyRooms,
}: LearningDashboardProps) {
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  const xpToNextLevel = stats ? ((stats.level) ** 2) * 100 : 100;
  const currentLevelXP = stats ? ((stats.level - 1) ** 2) * 100 : 0;
  const xpProgress = stats ? ((stats.xp - currentLevelXP) / (xpToNextLevel - currentLevelXP)) * 100 : 0;

  const displayedAchievements = showAllAchievements 
    ? achievements 
    : achievements.slice(0, 4);

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* XP & Level Card */}
      <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-4 border border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Level</p>
              <p className="text-2xl font-bold">{stats?.level || 1}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">XP</p>
            <p className="text-lg font-semibold text-primary">{stats?.xp || 0}</p>
          </div>
        </div>
        <Progress value={xpProgress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {Math.round(xpToNextLevel - (stats?.xp || 0))} XP to next level
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-muted-foreground">Streak</span>
          </div>
          <p className="text-xl font-bold">{stats?.currentStreak || 0} days</p>
          <p className="text-xs text-muted-foreground">Best: {stats?.longestStreak || 0}</p>
        </div>
        
        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">Questions</span>
          </div>
          <p className="text-xl font-bold">{stats?.questionsAsked || 0}</p>
        </div>

        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Study Time</span>
          </div>
          <p className="text-xl font-bold">{stats?.totalStudyMinutes || 0}m</p>
        </div>

        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Mastered</span>
          </div>
          <p className="text-xl font-bold">{stats?.flashcardsMastered || 0}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Learning Tools</h3>
        
        <button
          onClick={onOpenFocusTimer}
          className="w-full flex items-center justify-between p-3 bg-card hover:bg-muted/50 rounded-xl border border-border transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Timer className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-left">
              <p className="font-medium">Focus Timer</p>
              <p className="text-xs text-muted-foreground">Pomodoro study sessions</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        <button
          onClick={onOpenFlashcards}
          className="w-full flex items-center justify-between p-3 bg-card hover:bg-muted/50 rounded-xl border border-border transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-left">
              <p className="font-medium">Flashcards</p>
              <p className="text-xs text-muted-foreground">Auto-generated from chats</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        <button
          onClick={onOpenTeachingMode}
          className="w-full flex items-center justify-between p-3 bg-card hover:bg-muted/50 rounded-xl border border-border transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-left">
              <p className="font-medium">Teaching Mode</p>
              <p className="text-xs text-muted-foreground">AI quizzes you to test understanding</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        <button
          onClick={onOpenStudyRooms}
          className="w-full flex items-center justify-between p-3 bg-card hover:bg-muted/50 rounded-xl border border-border transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-left">
              <p className="font-medium">Study Rooms</p>
              <p className="text-xs text-muted-foreground">Learn together with others</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Achievements
            </h3>
            {achievements.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllAchievements(!showAllAchievements)}
                className="text-xs"
              >
                {showAllAchievements ? 'Show less' : `+${achievements.length - 4} more`}
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {displayedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border"
              >
                <span className="text-lg">{achievement.achievementName.split(' ')[0]}</span>
                <span className="text-xs font-medium truncate">
                  {achievement.achievementName.split(' ').slice(1).join(' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
