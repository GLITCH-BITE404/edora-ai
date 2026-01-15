import { useState } from 'react';
import { BookOpen, Plus, ChevronLeft, ChevronRight, Check, X, RotateCcw, Trash2 } from 'lucide-react';
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

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-green-500" />
          Flashcards
        </h2>
        <div className="flex gap-2">
          {view !== 'list' && (
            <Button variant="ghost" size="sm" onClick={() => { setView('list'); setShowAnswer(false); }}>
              Back
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>

      {view === 'list' && (
        <div className="flex-1 space-y-3 overflow-y-auto">
          {/* Study Due Cards */}
          {dueFlashcards.length > 0 && (
            <Button 
              onClick={() => { setView('study'); setCurrentIndex(0); }}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Review {dueFlashcards.length} Due Cards
            </Button>
          )}

          {/* Create New */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setView('create')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Flashcard
          </Button>

          {/* Cards List */}
          <div className="space-y-2 mt-4">
            <p className="text-sm text-muted-foreground">
              {flashcards.length} total cards
            </p>
            {flashcards.slice(0, 10).map((card) => (
              <div
                key={card.id}
                className="p-3 bg-card rounded-lg border border-border"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{card.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.topic || 'General'} • {Math.round((card.timesCorrect / Math.max(card.timesReviewed, 1)) * 100)}% correct
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteFlashcard(card.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {flashcards.length > 10 && (
              <p className="text-xs text-center text-muted-foreground">
                +{flashcards.length - 10} more cards
              </p>
            )}
          </div>

          {flashcards.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No flashcards yet</p>
              <p className="text-sm">Create your first one!</p>
            </div>
          )}
        </div>
      )}

      {view === 'study' && currentCard && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <span>Card {currentIndex + 1} of {dueFlashcards.length}</span>
              <span>{currentCard.topic || 'General'}</span>
            </div>

            {/* Card */}
            <div
              onClick={() => setShowAnswer(!showAnswer)}
              className="relative h-64 cursor-pointer perspective-1000"
            >
              <div className={`absolute inset-0 bg-card rounded-2xl border-2 border-border p-6 flex items-center justify-center transition-transform duration-500 backface-hidden ${
                showAnswer ? 'rotate-y-180 opacity-0' : ''
              }`}>
                <p className="text-center text-lg font-medium">{currentCard.question}</p>
              </div>
              <div className={`absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border-2 border-primary/30 p-6 flex items-center justify-center transition-transform duration-500 backface-hidden ${
                showAnswer ? '' : 'rotate-y-180 opacity-0'
              }`}>
                <p className="text-center">{currentCard.answer}</p>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground my-4">
              {showAnswer ? 'How well did you know this?' : 'Tap to reveal answer'}
            </p>

            {/* Review Buttons */}
            {showAnswer && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
                  onClick={() => handleReview(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Didn't know
                </Button>
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600"
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
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Question</label>
            <Textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="What do you want to remember?"
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Answer</label>
            <Textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="The answer to remember"
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Topic (optional)</label>
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="e.g., Math, History, Biology..."
            />
          </div>

          <Button onClick={handleCreate} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Create Flashcard
          </Button>
        </div>
      )}
    </div>
  );
}
