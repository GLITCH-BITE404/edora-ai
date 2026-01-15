import { useState } from 'react';
import { Users, Plus, Copy, LogOut, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StudyRoom, RoomMessage, RoomMember } from '@/hooks/useStudyRooms';
import { useToast } from '@/hooks/use-toast';
import { MarkdownRenderer } from './MarkdownRenderer';

interface StudyRoomsPanelProps {
  rooms: StudyRoom[];
  currentRoom: StudyRoom | null;
  roomMessages: RoomMessage[];
  roomMembers: RoomMember[];
  userId: string;
  onCreateRoom: (name: string, description?: string) => Promise<string | null>;
  onJoinRoom: (inviteCode: string) => Promise<{ success: boolean; error?: string }>;
  onLeaveRoom: (roomId: string) => void;
  onSelectRoom: (roomId: string) => void;
  onSendMessage: (content: string) => Promise<any>;
  onClose: () => void;
}

type View = 'list' | 'room' | 'create' | 'join';

export function StudyRoomsPanel({
  rooms,
  currentRoom,
  roomMessages,
  roomMembers,
  userId,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onSelectRoom,
  onSendMessage,
  onClose,
}: StudyRoomsPanelProps) {
  const [view, setView] = useState<View>(currentRoom ? 'room' : 'list');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast({ description: 'Please enter a room name', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const roomId = await onCreateRoom(newRoomName, newRoomDescription || undefined);
    setIsLoading(false);

    if (roomId) {
      toast({ description: '✅ Room created!' });
      setNewRoomName('');
      setNewRoomDescription('');
      setView('list');
    } else {
      toast({ description: 'Failed to create room', variant: 'destructive' });
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      toast({ description: 'Please enter an invite code', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const result = await onJoinRoom(joinCode);
    setIsLoading(false);

    if (result.success) {
      toast({ description: '✅ Joined room!' });
      setJoinCode('');
      setView('list');
    } else {
      toast({ description: result.error || 'Failed to join room', variant: 'destructive' });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const msgContent = message;
    setMessage('');
    await onSendMessage(msgContent);
  };

  const copyInviteCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.inviteCode);
      toast({ description: '📋 Invite code copied!' });
    }
  };

  const handleSelectRoom = (roomId: string) => {
    onSelectRoom(roomId);
    setView('room');
  };

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {view === 'room' && currentRoom ? (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('list')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              {currentRoom.name}
            </>
          ) : (
            <>
              <Users className="w-5 h-5 text-orange-500" />
              Study Rooms
            </>
          )}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>

      {view === 'list' && (
        <div className="flex-1 space-y-3 overflow-y-auto">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setView('create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setView('join')}>
              Join Room
            </Button>
          </div>

          {rooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No study rooms yet</p>
              <p className="text-sm">Create or join one to study together!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleSelectRoom(room.id)}
                  className="w-full text-left p-3 bg-card hover:bg-muted/50 rounded-xl border border-border transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{room.name}</p>
                      {room.description && (
                        <p className="text-xs text-muted-foreground truncate">{room.description}</p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {room.ownerId === userId ? '👑' : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'create' && (
        <div className="flex-1 space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setView('list')}>
            ← Back
          </Button>

          <div className="space-y-2">
            <label className="text-sm font-medium">Room Name</label>
            <Input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="e.g., Math Study Group"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              value={newRoomDescription}
              onChange={(e) => setNewRoomDescription(e.target.value)}
              placeholder="What will you study together?"
              className="min-h-[80px]"
            />
          </div>

          <Button onClick={handleCreateRoom} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Room
          </Button>
        </div>
      )}

      {view === 'join' && (
        <div className="flex-1 space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setView('list')}>
            ← Back
          </Button>

          <div className="space-y-2">
            <label className="text-sm font-medium">Invite Code</label>
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter the 8-character code"
              maxLength={8}
            />
          </div>

          <Button onClick={handleJoinRoom} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Join Room
          </Button>
        </div>
      )}

      {view === 'room' && currentRoom && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Room Info */}
          <div className="bg-muted/50 rounded-lg p-3 mb-3 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{roomMembers.length} members</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyInviteCode}>
                  <Copy className="w-3 h-3 mr-1" />
                  {currentRoom.inviteCode}
                </Button>
                {currentRoom.ownerId !== userId && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive"
                    onClick={() => {
                      onLeaveRoom(currentRoom.id);
                      setView('list');
                    }}
                  >
                    <LogOut className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-3">
            {roomMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              roomMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.userId === userId
                      ? 'bg-primary text-primary-foreground ml-8'
                      : msg.role === 'assistant'
                        ? 'bg-muted/80 mr-8'
                        : 'bg-card border border-border mr-8'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <MarkdownRenderer content={msg.content} />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2 shrink-0">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button onClick={handleSendMessage} disabled={!message.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
