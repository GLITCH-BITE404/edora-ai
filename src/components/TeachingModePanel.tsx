import { useState, useCallback } from 'react';
import { Brain, Send, Loader2, Sparkles, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface TeachingModePanelProps {
  onComplete: () => void;
  onClose: () => void;
}

interface Question {
  question: string;
  expectedTopics: string[];
}

const SAMPLE_TOPICS = [
  'Photosynthesis',
  'The French Revolution',
  'Quadratic equations',
  'Shakespeare\'s Hamlet',
  'The water cycle',
  'Newton\'s laws of motion',
];

export function TeachingModePanel({ onComplete, onClose }: TeachingModePanelProps) {
  const [stage, setStage] = useState<'topic' | 'question' | 'answer' | 'feedback'>('topic');
  const [topic, setTopic] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState<'correct' | 'partial' | 'incorrect' | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  
  const { toast } = useToast();

  const generateQuestion = useCallback(async (selectedTopic: string) => {
    setIsLoading(true);
    setStage('question');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/homework-helper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `You are in Teaching Mode. Generate ONE simple quiz question about "${selectedTopic}" to test the student's understanding. The question should be open-ended (not multiple choice). Format your response as:
QUESTION: [your question here]
EXPECTED_TOPICS: [comma-separated list of key concepts they should mention]

Only output the question and expected topics, nothing else.`,
            },
          ],
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      let fullText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) fullText += content;
            } catch {}
          }
        }
      }

      // Parse the response
      const questionMatch = fullText.match(/QUESTION:\s*(.+?)(?=EXPECTED_TOPICS:|$)/s);
      const topicsMatch = fullText.match(/EXPECTED_TOPICS:\s*(.+)/s);

      if (questionMatch) {
        setCurrentQuestion({
          question: questionMatch[1].trim(),
          expectedTopics: topicsMatch 
            ? topicsMatch[1].split(',').map(t => t.trim().toLowerCase())
            : [],
        });
        setStage('answer');
      } else {
        throw new Error('Failed to parse question');
      }
    } catch (err) {
      console.error('Error generating question:', err);
      toast({ description: 'Failed to generate question', variant: 'destructive' });
      setStage('topic');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const evaluateAnswer = useCallback(async () => {
    if (!currentQuestion || !userAnswer.trim()) return;
    
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/homework-helper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Evaluate this student's answer to a quiz question.

QUESTION: ${currentQuestion.question}
STUDENT'S ANSWER: ${userAnswer}
EXPECTED TOPICS TO COVER: ${currentQuestion.expectedTopics.join(', ')}

Rate the answer as:
- CORRECT: if they demonstrated good understanding
- PARTIAL: if they got some things right but missed key points
- INCORRECT: if they got it wrong

Format your response as:
SCORE: [CORRECT/PARTIAL/INCORRECT]
FEEDBACK: [Encouraging feedback explaining what they got right and what they could improve]

Be encouraging and educational!`,
            },
          ],
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      let fullText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) fullText += content;
            } catch {}
          }
        }
      }

      // Parse the response
      const scoreMatch = fullText.match(/SCORE:\s*(CORRECT|PARTIAL|INCORRECT)/i);
      const feedbackMatch = fullText.match(/FEEDBACK:\s*(.+)/s);

      if (scoreMatch) {
        const scoreValue = scoreMatch[1].toLowerCase() as 'correct' | 'partial' | 'incorrect';
        setScore(scoreValue);
        setFeedback(feedbackMatch?.[1]?.trim() || 'Good effort!');
        setStage('feedback');
        setQuestionsAnswered(prev => prev + 1);

        if (scoreValue === 'correct') {
          onComplete();
        }
      }
    } catch (err) {
      console.error('Error evaluating answer:', err);
      toast({ description: 'Failed to evaluate answer', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentQuestion, userAnswer, toast, onComplete]);

  const handleNextQuestion = () => {
    setUserAnswer('');
    setFeedback('');
    setScore(null);
    setCurrentQuestion(null);
    generateQuestion(topic);
  };

  const handleNewTopic = () => {
    setTopic('');
    setUserAnswer('');
    setFeedback('');
    setScore(null);
    setCurrentQuestion(null);
    setStage('topic');
  };

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          Teaching Mode
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        The AI will quiz you to test your understanding. Teaching what you've learned is the best way to remember it!
      </p>

      {questionsAnswered > 0 && (
        <div className="bg-muted/50 rounded-lg p-2 text-center text-sm">
          Questions answered: <span className="font-bold">{questionsAnswered}</span>
        </div>
      )}

      {stage === 'topic' && (
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">What topic do you want to be quizzed on?</label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., The French Revolution, Quadratic equations..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && topic.trim()) {
                  generateQuestion(topic);
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Or try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTopic(t);
                    generateQuestion(t);
                  }}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-xs transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Button 
            onClick={() => generateQuestion(topic)} 
            disabled={!topic.trim()}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Question
          </Button>
        </div>
      )}

      {stage === 'question' && isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Generating question...</p>
          </div>
        </div>
      )}

      {stage === 'answer' && currentQuestion && (
        <div className="flex-1 space-y-4">
          <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Question:</p>
            <p className="font-medium">{currentQuestion.question}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Your Answer:</label>
            <Textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Explain what you know..."
              className="min-h-[120px]"
            />
          </div>

          <Button 
            onClick={evaluateAnswer} 
            disabled={!userAnswer.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit Answer
          </Button>
        </div>
      )}

      {stage === 'feedback' && (
        <div className="flex-1 space-y-4">
          {/* Score Badge */}
          <div className={`text-center py-4 rounded-xl ${
            score === 'correct' 
              ? 'bg-green-500/10 border border-green-500/20' 
              : score === 'partial'
                ? 'bg-yellow-500/10 border border-yellow-500/20'
                : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center ${
              score === 'correct' 
                ? 'bg-green-500/20' 
                : score === 'partial'
                  ? 'bg-yellow-500/20'
                  : 'bg-red-500/20'
            }`}>
              {score === 'correct' ? (
                <Check className="w-8 h-8 text-green-500" />
              ) : score === 'partial' ? (
                <Sparkles className="w-8 h-8 text-yellow-500" />
              ) : (
                <X className="w-8 h-8 text-red-500" />
              )}
            </div>
            <p className="font-semibold capitalize">{score}</p>
          </div>

          {/* Feedback */}
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-sm">{feedback}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleNewTopic} className="flex-1">
              New Topic
            </Button>
            <Button onClick={handleNextQuestion} className="flex-1">
              Next Question
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
