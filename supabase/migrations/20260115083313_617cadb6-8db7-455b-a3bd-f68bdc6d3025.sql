-- Study Rooms (virtual classrooms)
CREATE TABLE public.study_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  invite_code TEXT NOT NULL UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
  is_public BOOLEAN DEFAULT false,
  max_members INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Room Members
CREATE TABLE public.room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Room Messages (shared chat)
CREATE TABLE public.room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Learning Stats
CREATE TABLE public.learning_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  total_study_minutes INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  flashcards_mastered INTEGER DEFAULT 0,
  teaching_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Flashcards (auto-generated from chats)
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id UUID REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  topic TEXT,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  times_reviewed INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  next_review_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Study Sessions (focus timer)
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id UUID REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  topic TEXT,
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Achievements
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Study Rooms Policies
CREATE POLICY "Users can view public rooms or rooms they're members of" ON public.study_rooms
  FOR SELECT USING (is_public = true OR owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.room_members WHERE room_id = study_rooms.id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create rooms" ON public.study_rooms
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their rooms" ON public.study_rooms
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their rooms" ON public.study_rooms
  FOR DELETE USING (auth.uid() = owner_id);

-- Room Members Policies
CREATE POLICY "Members can view room members" ON public.room_members
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.room_members rm WHERE rm.room_id = room_members.room_id AND rm.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.study_rooms sr WHERE sr.id = room_members.room_id AND sr.is_public = true
  ));

CREATE POLICY "Users can join rooms" ON public.room_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" ON public.room_members
  FOR DELETE USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.study_rooms sr WHERE sr.id = room_members.room_id AND sr.owner_id = auth.uid()
  ));

-- Room Messages Policies
CREATE POLICY "Room members can view messages" ON public.room_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.room_members rm WHERE rm.room_id = room_messages.room_id AND rm.user_id = auth.uid()
  ));

CREATE POLICY "Room members can send messages" ON public.room_messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.room_members rm WHERE rm.room_id = room_messages.room_id AND rm.user_id = auth.uid()
  ) AND auth.uid() = user_id);

-- Learning Stats Policies
CREATE POLICY "Users can view their own stats" ON public.learning_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON public.learning_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON public.learning_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Flashcards Policies
CREATE POLICY "Users can view their own flashcards" ON public.flashcards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create flashcards" ON public.flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their flashcards" ON public.flashcards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their flashcards" ON public.flashcards
  FOR DELETE USING (auth.uid() = user_id);

-- Study Sessions Policies
CREATE POLICY "Users can view their own sessions" ON public.study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create sessions" ON public.study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their sessions" ON public.study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Achievements Policies
CREATE POLICY "Users can view their own achievements" ON public.achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can earn achievements" ON public.achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for room messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;

-- Function to update learning stats
CREATE OR REPLACE FUNCTION public.update_learning_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.learning_stats (user_id, questions_asked, last_active_date, xp)
  VALUES (NEW.user_id, 1, CURRENT_DATE, 10)
  ON CONFLICT (user_id) DO UPDATE SET
    questions_asked = learning_stats.questions_asked + 1,
    xp = learning_stats.xp + 10,
    current_streak = CASE 
      WHEN learning_stats.last_active_date = CURRENT_DATE - INTERVAL '1 day' 
      THEN learning_stats.current_streak + 1
      WHEN learning_stats.last_active_date = CURRENT_DATE 
      THEN learning_stats.current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(learning_stats.longest_streak, 
      CASE 
        WHEN learning_stats.last_active_date = CURRENT_DATE - INTERVAL '1 day' 
        THEN learning_stats.current_streak + 1
        WHEN learning_stats.last_active_date = CURRENT_DATE 
        THEN learning_stats.current_streak
        ELSE 1
      END
    ),
    level = FLOOR(SQRT((learning_stats.xp + 10) / 100)) + 1,
    last_active_date = CURRENT_DATE,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update stats when user sends message
CREATE TRIGGER on_message_sent
  AFTER INSERT ON public.messages
  FOR EACH ROW
  WHEN (NEW.role = 'user')
  EXECUTE FUNCTION public.update_learning_stats();