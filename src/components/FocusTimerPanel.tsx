import { useState } from 'react';
import { Timer, Play, Pause, Square, Check } from 'lucide-react';
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
  { label: '15 min', value: 15 },
  { label: '25 min', value: 25 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" />
          Focus Timer
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>

      {!isActive ? (
        <>
          {/* Duration Selection */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {DURATIONS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setSelectedDuration(value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedDuration === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Input */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">What are you studying?</label>
            <Input
              value={sessionTopic}
              onChange={(e) => setSessionTopic(e.target.value)}
              placeholder="e.g., Math homework, History chapter..."
              className="bg-muted/50"
            />
          </div>

          {/* Start Button */}
          <Button onClick={handleStart} className="w-full" size="lg">
            <Play className="w-5 h-5 mr-2" />
            Start Focus Session
          </Button>
        </>
      ) : (
        <>
          {/* Timer Display */}
          <div className="flex flex-col items-center py-8">
            <div className="relative w-48 h-48 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-muted stroke-current"
                  strokeWidth="4"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="text-primary stroke-current transition-all duration-1000"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                  strokeDasharray={`${progress * 2.827} 282.7`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{formattedTime}</span>
                {topic && (
                  <span className="text-sm text-muted-foreground mt-1 max-w-[120px] truncate">
                    {topic}
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {isPaused ? 'Paused' : 'Stay focused! You got this 💪'}
            </p>

            <div className="flex gap-3">
              {isPaused ? (
                <Button onClick={onResume} size="lg">
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button onClick={onPause} variant="outline" size="lg">
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
              )}
              <Button onClick={onStop} variant="destructive" size="lg">
                <Square className="w-5 h-5 mr-2" />
                End
              </Button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              💡 Tip: Avoid distractions. Put your phone away and focus on one task at a time.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
