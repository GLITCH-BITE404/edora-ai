import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  topic: string | null;
  difficulty: number;
  timesReviewed: number;
  timesCorrect: number;
  nextReviewAt: string;
  createdAt: string;
}

export function useFlashcards(user: User | null) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFlashcards = useCallback(async () => {
    if (!user) {
      setFlashcards([]);
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .order('next_review_at', { ascending: true });

      if (data) {
        setFlashcards(data.map(f => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          topic: f.topic,
          difficulty: f.difficulty ?? 1,
          timesReviewed: f.times_reviewed ?? 0,
          timesCorrect: f.times_correct ?? 0,
          nextReviewAt: f.next_review_at ?? new Date().toISOString(),
          createdAt: f.created_at,
        })));
      }
    } catch (err) {
      console.error('Error loading flashcards:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFlashcards();
  }, [loadFlashcards]);

  const createFlashcard = useCallback(async (question: string, answer: string, topic?: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        user_id: user.id,
        question,
        answer,
        topic,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating flashcard:', error);
      return null;
    }

    loadFlashcards();
    return data.id;
  }, [user, loadFlashcards]);

  const reviewFlashcard = useCallback(async (flashcardId: string, correct: boolean) => {
    const flashcard = flashcards.find(f => f.id === flashcardId);
    if (!flashcard || !user) return;

    const newTimesReviewed = flashcard.timesReviewed + 1;
    const newTimesCorrect = flashcard.timesCorrect + (correct ? 1 : 0);
    
    // Spaced repetition: if correct, increase interval; if wrong, reset
    const accuracy = newTimesCorrect / newTimesReviewed;
    let daysUntilNext = 1;
    
    if (correct) {
      if (accuracy >= 0.9) daysUntilNext = 7;
      else if (accuracy >= 0.7) daysUntilNext = 3;
      else daysUntilNext = 1;
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysUntilNext);

    await supabase
      .from('flashcards')
      .update({
        times_reviewed: newTimesReviewed,
        times_correct: newTimesCorrect,
        next_review_at: nextReview.toISOString(),
      })
      .eq('id', flashcardId);

    loadFlashcards();
    
    return { mastered: accuracy >= 0.8 && newTimesReviewed >= 3 };
  }, [user, flashcards, loadFlashcards]);

  const deleteFlashcard = useCallback(async (flashcardId: string) => {
    if (!user) return;

    await supabase
      .from('flashcards')
      .delete()
      .eq('id', flashcardId);

    loadFlashcards();
  }, [user, loadFlashcards]);

  const getDueFlashcards = useCallback(() => {
    const now = new Date().toISOString();
    return flashcards.filter(f => f.nextReviewAt <= now);
  }, [flashcards]);

  return {
    flashcards,
    loading,
    createFlashcard,
    reviewFlashcard,
    deleteFlashcard,
    getDueFlashcards,
    refresh: loadFlashcards,
  };
}
