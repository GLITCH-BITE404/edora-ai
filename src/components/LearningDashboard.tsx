import { useState } from 'react';
import { 
  Trophy, Flame, Zap, BookOpen, Brain, Timer, Users, 
  ChevronRight, Star, Sparkles
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

  const learningTools = [
    {
      id: 'focus',
      icon: Timer,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      title: 'Focus Timer',
      description: 'Pomodoro study sessions',
      onClick: onOpenFocusTimer,
    },
    {
      id: 'flashcards',
      icon: BookOpen,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-500/10',
      title: 'Flashcards',
      description: 'Spaced repetition learning',
      onClick: onOpenFlashcards,
    },
    {
      id: 'teaching',
      icon: Brain,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      title: 'Teaching Mode',
      description: 'AI quizzes you',
      onClick: onOpenTeachingMode,
    },
    {
      id: 'rooms',
      icon: Users,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      title: 'Study Rooms',
      description: 'Learn with others',
      onClick: onOpenStudyRooms,
    },
  ];

  return (
    <div className="p-4 space-y-5 h-full overflow-y-auto scrollbar-thin">
      {/* XP & Level Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 rounded-2xl p-4 border border-primary/20 shadow-lg shadow-primary/5">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                <Star className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Level</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{stats?.level || 1}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">XP</span>
              </div>
              <p className="text-2xl font-bold text-primary">{stats?.xp || 0}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Progress value={xpProgress} className="h-2.5 bg-background/50" />
            <p className="text-xs text-muted-foreground text-right">
              {Math.round(xpToNextLevel - (stats?.xp || 0))} XP to level {(stats?.level || 1) + 1}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-3 border border-border card-hover tap-highlight">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">Streak</span>
          </div>
          <p className="text-2xl font-bold">{stats?.currentStreak || 0}<span className="text-sm font-normal text-muted-foreground ml-1">days</span></p>
          <p className="text-xs text-muted-foreground mt-0.5">Best: {stats?.longestStreak || 0} days</p>
        </div>
        
        <div className="bg-card rounded-xl p-3 border border-border card-hover tap-highlight">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">Questions</span>
          </div>
          <p className="text-2xl font-bold">{stats?.questionsAsked || 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Asked today</p>
        </div>

        <div className="bg-card rounded-xl p-3 border border-border card-hover tap-highlight">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Timer className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">Study Time</span>
          </div>
          <p className="text-2xl font-bold">{stats?.totalStudyMinutes || 0}<span className="text-sm font-normal text-muted-foreground ml-1">min</span></p>
          <p className="text-xs text-muted-foreground mt-0.5">Total focus time</p>
        </div>

        <div className="bg-card rounded-xl p-3 border border-border card-hover tap-highlight">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">Mastered</span>
          </div>
          <p className="text-2xl font-bold">{stats?.flashcardsMastered || 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Flashcards</p>
        </div>
      </div>

      {/* Learning Tools */}
      <div className="space-y-2.5">
        <h3 className="text-sm font-semibold text-foreground px-1">Learning Tools</h3>
        
        <div className="space-y-2">
          {learningTools.map((tool) => (
            <button
              key={tool.id}
              onClick={tool.onClick}
              className="w-full flex items-center justify-between p-3 bg-card hover:bg-muted/50 active:scale-[0.98] rounded-xl border border-border transition-all duration-200 tap-highlight card-hover"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${tool.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <tool.icon className={`w-5 h-5 ${tool.iconColor}`} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">{tool.title}</p>
                  <p className="text-xs text-muted-foreground">{tool.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Achievements
              <span className="text-xs text-muted-foreground font-normal">({achievements.length})</span>
            </h3>
            {achievements.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllAchievements(!showAllAchievements)}
                className="text-xs h-7"
              >
                {showAllAchievements ? 'Show less' : `+${achievements.length - 4} more`}
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {displayedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-2 p-2.5 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-xl border border-yellow-500/20 scale-in"
              >
                <span className="text-xl">{achievement.achievementName.split(' ')[0]}</span>
                <span className="text-xs font-medium truncate leading-tight">
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
