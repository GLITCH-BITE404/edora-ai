-- Use PL/pgSQL SECURITY DEFINER helpers to avoid SQL-function inlining in RLS
CREATE OR REPLACE FUNCTION public.is_room_member(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.room_members rm
    WHERE rm.room_id = _room_id
      AND rm.user_id = _user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_room_public_or_owner(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.study_rooms sr
    WHERE sr.id = _room_id
      AND (sr.is_public = true OR sr.owner_id = _user_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_room_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_room_member(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.is_room_public_or_owner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_room_public_or_owner(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Members can view room members" ON public.room_members;
CREATE POLICY "Members can view room members"
ON public.room_members
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_room_public_or_owner(room_members.room_id, auth.uid())
);

DROP POLICY IF EXISTS "Users can leave rooms" ON public.room_members;
CREATE POLICY "Users can leave rooms"
ON public.room_members
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_room_public_or_owner(room_members.room_id, auth.uid())
);

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