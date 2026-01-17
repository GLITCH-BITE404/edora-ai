import { useState } from 'react';
import { Timer, Play, Pause, Square, ArrowLeft, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FocusTimerPanelProps {
  isActive: boolean;
  isPaused: boolean;
  formattedTime: string;
  progress: number;
  topic: string;
  onStart: (duration: number, topic?: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onClose: () => void;
}

const DURATIONS = [
  { label: '15m', value: 15, description: 'Quick focus' },
  { label: '25m', value: 25, description: 'Pomodoro' },
  { label: '45m', value: 45, description: 'Deep work' },
  { label: '60m', value: 60, description: 'Marathon' },
];

export function FocusTimerPanel({
  isActive,
  isPaused,
  formattedTime,
  progress,
  topic,
  onStart,
  onPause,
  onResume,
  onStop,
  onClose,
}: FocusTimerPanelProps) {
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [sessionTopic, setSessionTopic] = useState('');

  const handleStart = () => {
    onStart(selectedDuration, sessionTopic || undefined);
  };

  return (
    <div className="p-4 space-y-5 h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors tap-highlight"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Timer className="w-4 h-4 text-blue-500" />
          </div>
          <span className="font-semibold">Focus Timer</span>
        </div>
      </div>

      {!isActive ? (
        <>
          {/* Duration Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              Select Duration
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DURATIONS.map(({ label, value, description }) => (
                <button
                  key={value}
                  onClick={() => setSelectedDuration(value)}
                  className={`p-3 rounded-xl text-left transition-all duration-200 tap-highlight ${
                    selectedDuration === value
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'bg-card border border-border hover:border-primary/30 hover:bg-muted/50'
                  }`}
                >
                  <span className="text-lg font-bold block">{label}</span>
                  <span className={`text-xs ${selectedDuration === value ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">What are you studying?</label>
            <Input
              value={sessionTopic}
              onChange={(e) => setSessionTopic(e.target.value)}
              placeholder="e.g., Math homework, History chapter..."
              className="bg-muted/50 h-11 rounded-xl"
            />
          </div>

          {/* Start Button */}
          <Button onClick={handleStart} className="w-full h-12 rounded-xl text-base btn-glow btn-ripple" size="lg">
            <Play className="w-5 h-5 mr-2" />
            Start Focus Session
          </Button>

          {/* Tips */}
          <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl p-4 border border-blue-500/10">
            <p className="text-sm font-medium mb-2">💡 Tips for focus</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Put your phone on silent mode</li>
              <li>• Close unnecessary tabs</li>
              <li>• Take a 5-min break after each session</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 py-4">
          {/* Timer Display */}
          <div className="relative w-52 h-52 sm:w-56 sm:h-56 mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-muted/30 stroke-current"
                strokeWidth="3"
                fill="transparent"
                r="45"
                cx="50"
                cy="50"
              />
              <circle
                className="text-primary stroke-current transition-all duration-1000 ease-linear"
                strokeWidth="4"
                strokeLinecap="round"
                fill="transparent"
                r="45"
                cx="50"
                cy="50"
                strokeDasharray={`${progress * 2.827} 282.7`}
                style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.4))' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold tracking-tight">{formattedTime}</span>
              {topic && (
                <span className="text-sm text-muted-foreground mt-2 max-w-[140px] truncate text-center px-2">
                  {topic}
                </span>
              )}
            </div>
          </div>

          {/* Status */}
          <div className={`px-4 py-2 rounded-full mb-6 ${isPaused ? 'bg-yellow-500/10 text-yellow-600' : 'bg-green-500/10 text-green-600'}`}>
            <p className="text-sm font-medium">
              {isPaused ? '⏸️ Paused' : '🎯 Stay focused!'}
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3 w-full max-w-xs">
            {isPaused ? (
              <Button onClick={onResume} className="flex-1 h-12 rounded-xl btn-glow" size="lg">
                <Play className="w-5 h-5 mr-2" />
                Resume
              </Button>
            ) : (
              <Button onClick={onPause} variant="outline" className="flex-1 h-12 rounded-xl" size="lg">
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            )}
            <Button onClick={onStop} variant="destructive" className="h-12 px-6 rounded-xl" size="lg">
              <Square className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
