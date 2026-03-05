-- Prevent recursive RLS evaluation by using a SECURITY DEFINER helper
CREATE OR REPLACE FUNCTION public.is_room_member(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members rm
    WHERE rm.room_id = _room_id
      AND rm.user_id = _user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_room_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_room_member(uuid, uuid) TO authenticated;

-- room_members: remove recursive self-reference policy
DROP POLICY IF EXISTS "Members can view room members" ON public.room_members;
CREATE POLICY "Members can view room members"
ON public.room_members
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.study_rooms sr
    WHERE sr.id = room_members.room_id
      AND sr.is_public = true
  )
  OR EXISTS (
    SELECT 1
    FROM public.study_rooms sr
    WHERE sr.id = room_members.room_id
      AND sr.owner_id = auth.uid()
  )
);

-- study_rooms: use helper instead of direct room_members subquery
DROP POLICY IF EXISTS "Users can view public rooms or rooms they're members of" ON public.study_rooms;
CREATE POLICY "Users can view public rooms or rooms they're members of"
ON public.study_rooms
FOR SELECT
TO authenticated
USING (
  is_public = true
  OR owner_id = auth.uid()
  OR public.is_room_member(study_rooms.id, auth.uid())
);

-- room_messages: use helper to avoid nested policy recursion paths
DROP POLICY IF EXISTS "Room members can view messages" ON public.room_messages;
CREATE POLICY "Room members can view messages"
ON public.room_messages
FOR SELECT
TO authenticated
USING (public.is_room_member(room_messages.room_id, auth.uid()));

DROP POLICY IF EXISTS "Room members can send messages" ON public.room_messages;
CREATE POLICY "Room members can send messages"
ON public.room_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_room_member(room_messages.room_id, auth.uid())
);