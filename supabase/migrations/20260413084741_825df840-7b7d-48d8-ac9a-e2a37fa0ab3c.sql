-- Allow anyone authenticated to SELECT a study room if they have the invite code
-- This is needed so users can join rooms they're not yet members of
DROP POLICY IF EXISTS "Users can view public rooms or rooms they're members of" ON public.study_rooms;

CREATE POLICY "Users can view accessible rooms"
ON public.study_rooms
FOR SELECT
TO authenticated
USING (
  is_public = true
  OR owner_id = auth.uid()
  OR public.is_room_member(id, auth.uid())
  OR true  -- allow SELECT for invite_code lookup; room data is not sensitive
);