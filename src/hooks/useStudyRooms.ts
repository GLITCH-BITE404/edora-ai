import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface StudyRoom {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  inviteCode: string;
  isPublic: boolean;
  maxMembers: number;
  memberCount?: number;
  createdAt: string;
}

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

export function useStudyRooms(user: User | null) {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<StudyRoom | null>(null);
  const [roomMessages, setRoomMessages] = useState<RoomMessage[]>([]);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user's rooms
  const loadRooms = useCallback(async () => {
    if (!user) {
      setRooms([]);
      setLoading(false);
      return;
    }

    try {
      // Get rooms where user is a member
      const { data: memberData } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', user.id);

      const roomIds = memberData?.map(m => m.room_id) || [];

      if (roomIds.length === 0) {
        setRooms([]);
        setLoading(false);
        return;
      }

      const { data: roomsData } = await supabase
        .from('study_rooms')
        .select('*')
        .in('id', roomIds);

      if (roomsData) {
        setRooms(roomsData.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          ownerId: r.owner_id,
          inviteCode: r.invite_code,
          isPublic: r.is_public ?? false,
          maxMembers: r.max_members ?? 10,
          createdAt: r.created_at,
        })));
      }
    } catch (err) {
      console.error('Error loading rooms:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Create a new room
  const createRoom = useCallback(async (name: string, description?: string, isPublic = false) => {
    if (!user) return null;

    try {
      const { data: room, error } = await supabase
        .from('study_rooms')
        .insert({
          name,
          description,
          owner_id: user.id,
          is_public: isPublic,
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner as member
      await supabase.from('room_members').insert({
        room_id: room.id,
        user_id: user.id,
        role: 'owner',
      });

      loadRooms();
      return room.id;
    } catch (err) {
      console.error('Error creating room:', err);
      return null;
    }
  }, [user, loadRooms]);

  // Join a room by invite code
  const joinRoom = useCallback(async (inviteCode: string) => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      const { data: room, error: roomError } = await supabase
        .from('study_rooms')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      if (roomError || !room) {
        return { success: false, error: 'Room not found' };
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', room.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Already a member' };
      }

      // Join the room
      const { error: joinError } = await supabase.from('room_members').insert({
        room_id: room.id,
        user_id: user.id,
        role: 'member',
      });

      if (joinError) throw joinError;

      loadRooms();
      return { success: true, roomId: room.id };
    } catch (err) {
      console.error('Error joining room:', err);
      return { success: false, error: 'Failed to join room' };
    }
  }, [user, loadRooms]);

  // Leave a room
  const leaveRoom = useCallback(async (roomId: string) => {
    if (!user) return;

    await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', user.id);

    if (currentRoom?.id === roomId) {
      setCurrentRoom(null);
      setRoomMessages([]);
      setRoomMembers([]);
    }

    loadRooms();
  }, [user, currentRoom, loadRooms]);

  // Select a room and load its messages
  const selectRoom = useCallback(async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    setCurrentRoom(room);

    // Load messages
    const { data: messages } = await supabase
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (messages) {
      setRoomMessages(messages.map(m => ({
        id: m.id,
        roomId: m.room_id,
        userId: m.user_id,
        content: m.content,
        role: m.role as 'user' | 'assistant',
        createdAt: m.created_at,
      })));
    }

    // Load members
    const { data: members } = await supabase
      .from('room_members')
      .select('*')
      .eq('room_id', roomId);

    if (members) {
      setRoomMembers(members.map(m => ({
        id: m.id,
        roomId: m.room_id,
        userId: m.user_id,
        role: m.role as 'owner' | 'admin' | 'member',
        joinedAt: m.joined_at,
      })));
    }
  }, [rooms]);

  // Send message to room
  const sendRoomMessage = useCallback(async (content: string, role: 'user' | 'assistant' = 'user') => {
    if (!user || !currentRoom) return null;

    const { data, error } = await supabase
      .from('room_messages')
      .insert({
        room_id: currentRoom.id,
        user_id: user.id,
        content,
        role,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return data;
  }, [user, currentRoom]);

  // Subscribe to realtime room messages
  useEffect(() => {
    if (!currentRoom) return;

    const channel = supabase
      .channel(`room-${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${currentRoom.id}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          setRoomMessages(prev => [...prev, {
            id: newMsg.id,
            roomId: newMsg.room_id,
            userId: newMsg.user_id,
            content: newMsg.content,
            role: newMsg.role,
            createdAt: newMsg.created_at,
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRoom?.id]);

  return {
    rooms,
    currentRoom,
    roomMessages,
    roomMembers,
    loading,
    createRoom,
    joinRoom,
    leaveRoom,
    selectRoom,
    sendRoomMessage,
    refresh: loadRooms,
  };
}
