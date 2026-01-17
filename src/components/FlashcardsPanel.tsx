import { useState } from 'react';
import { BookOpen, Plus, Check, X, RotateCcw, Trash2, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Flashcard } from '@/hooks/useFlashcards';
import { useToast } from '@/hooks/use-toast';

interface FlashcardsPanelProps {
  flashcards: Flashcard[];
  dueFlashcards: Flashcard[];
  onCreateFlashcard: (question: string, answer: string, topic?: string) => Promise<string | null>;
  onReviewFlashcard: (id: string, correct: boolean) => Promise<{ mastered?: boolean } | undefined>;
  onDeleteFlashcard: (id: string) => void;
  onMastered: () => void;
  onClose: () => void;
}

type View = 'list' | 'study' | 'create';

export function FlashcardsPanel({
  flashcards,
  dueFlashcards,
  onCreateFlashcard,
  onReviewFlashcard,
  onDeleteFlashcard,
  onMastered,
  onClose,
}: FlashcardsPanelProps) {
  const [view, setView] = useState<View>('list');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newTopic, setNewTopic] = useState('');
  
  const { toast } = useToast();

  const currentCard = dueFlashcards[currentIndex];

  const handleCreate = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast({ description: 'Please fill in question and answer', variant: 'destructive' });
      return;
    }

    const id = await onCreateFlashcard(newQuestion, newAnswer, newTopic || undefined);
    if (id) {
      toast({ description: '✅ Flashcard created!' });
      setNewQuestion('');
      setNewAnswer('');
      setNewTopic('');
      setView('list');
    }
  };

  const handleReview = async (correct: boolean) => {
    if (!currentCard) return;

    const result = await onReviewFlashcard(currentCard.id, correct);
    
    if (result?.mastered) {
      onMastered();
      toast({ description: '🎉 Flashcard mastered!' });
    }

    setShowAnswer(false);
    
    if (currentIndex < dueFlashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      toast({ description: '✨ All cards reviewed!' });
      setView('list');
      setCurrentIndex(0);
    }
  };

  const goBack = () => {
    if (view === 'list') {
      onClose();
    } else {
      setView('list');
      setShowAnswer(false);
    }
  };

  return (
    <div className="p-4 space-y-4 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <button 
          onClick={goBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors tap-highlight"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-green-500" />
          </div>
          <span className="font-semibold">Flashcards</span>
        </div>
      </div>

      {view === 'list' && (
        <div className="flex-1 space-y-4 overflow-y-auto scrollbar-thin">
          {/* Action Buttons */}
          <div className="space-y-2">
            {dueFlashcards.length > 0 && (
              <Button 
                onClick={() => { setView('study'); setCurrentIndex(0); }}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/20 btn-glow"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Review {dueFlashcards.length} Due Cards
              </Button>
            )}

            <Button 
              variant="outline" 
              className="w-full h-11 rounded-xl"
              onClick={() => setView('create')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Flashcard
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between bg-muted/30 rounded-xl p-3">
            <span className="text-sm text-muted-foreground">Total cards</span>
            <span className="font-semibold">{flashcards.length}</span>
          </div>

          {/* Cards List */}
          {flashcards.length > 0 ? (
            <div className="space-y-2">
              {flashcards.slice(0, 10).map((card) => (
                <div
                  key={card.id}
                  className="p-3 bg-card rounded-xl border border-border card-hover tap-highlight"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2">{card.question}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {card.topic && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {card.topic}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {Math.round((card.timesCorrect / Math.max(card.timesReviewed, 1)) * 100)}% correct
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onDeleteFlashcard(card.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {flashcards.length > 10 && (
                <p className="text-xs text-center text-muted-foreground py-2">
                  +{flashcards.length - 10} more cards
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-medium">No flashcards yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first one to start learning!</p>
            </div>
          )}
        </div>
      )}

      {view === 'study' && currentCard && (
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
          <div className="w-full max-w-sm">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-muted-foreground">
                Card <span className="font-semibold text-foreground">{currentIndex + 1}</span> of {dueFlashcards.length}
              </span>
              {currentCard.topic && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {currentCard.topic}
                </span>
              )}
            </div>

            {/* Card */}
            <div
              onClick={() => setShowAnswer(!showAnswer)}
              className="relative h-56 sm:h-64 cursor-pointer"
            >
              <div 
                className={`absolute inset-0 bg-card rounded-2xl border-2 border-border p-6 flex items-center justify-center shadow-lg transition-all duration-300 ${
                  showAnswer ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
              >
                <p className="text-center text-lg font-medium leading-relaxed">{currentCard.question}</p>
              </div>
              <div 
                className={`absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border-2 border-green-500/30 p-6 flex items-center justify-center shadow-lg transition-all duration-300 ${
                  showAnswer ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                <p className="text-center leading-relaxed">{currentCard.answer}</p>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground my-4">
              {showAnswer ? 'How well did you know this?' : '👆 Tap to reveal answer'}
            </p>

            {/* Review Buttons */}
            {showAnswer && (
              <div className="flex gap-3 fade-in">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-red-500/50 text-red-500 hover:bg-red-500/10"
                  onClick={() => handleReview(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Didn't know
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl bg-green-500 hover:bg-green-600"
                  onClick={() => handleReview(true)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Got it!
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'create' && (
        <div className="flex-1 space-y-4 overflow-y-auto scrollbar-thin">
          <div className="space-y-2">
            <label className="text-sm font-medium">Question</label>
            <Textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="What do you want to remember?"
              className="min-h-[100px] rounded-xl resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Answer</label>
            <Textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="The answer to remember"
              className="min-h-[100px] rounded-xl resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Topic <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="e.g., Math, History, Biology..."
              className="h-11 rounded-xl"
            />
          </div>

          <Button onClick={handleCreate} className="w-full h-12 rounded-xl btn-glow" size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Create Flashcard
          </Button>
        </div>
      )}
    </div>
  );
}
