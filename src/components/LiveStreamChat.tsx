import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Users, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name: string;
  avatar_url: string | null;
  is_admin: boolean;
}

interface LiveStreamChatProps {
  sessionId: string;
  isHost?: boolean;
}

const LiveStreamChat = ({ sessionId, isHost = false }: LiveStreamChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [viewers, setViewers] = useState<Map<string, { display_name: string; is_admin: boolean }>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Set up realtime presence and messaging
  useEffect(() => {
    if (!sessionId || !user) return;

    const channel = supabase.channel(`stream_${sessionId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Handle presence sync
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const newViewers = new Map<string, { display_name: string; is_admin: boolean }>();
      
      Object.entries(state).forEach(([key, presences]) => {
        const presence = presences[0] as any;
        if (presence) {
          newViewers.set(key, {
            display_name: presence.display_name || 'Anonymous',
            is_admin: presence.is_admin || false,
          });
        }
      });
      
      setViewers(newViewers);
    });

    // Handle broadcast messages
    channel.on('broadcast', { event: 'chat_message' }, ({ payload }) => {
      const message = payload as ChatMessage;
      setMessages(prev => [...prev, message]);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Get user profile for presence
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .single();

        // Check if user is admin
        const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });

        await channel.track({
          user_id: user.id,
          display_name: profile?.display_name || user.email?.split('@')[0] || 'Anonymous',
          is_admin: isAdmin || false,
          online_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !channelRef.current) return;

    setSending(true);
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      // Check if admin
      const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: user.id,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        display_name: profile?.display_name || user.email?.split('@')[0] || 'Anonymous',
        avatar_url: profile?.avatar_url || null,
        is_admin: isAdmin || false,
      };

      // Broadcast to all viewers
      await channelRef.current.send({
        type: 'broadcast',
        event: 'chat_message',
        payload: message,
      });

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const viewerCount = viewers.size;
  const adminCount = Array.from(viewers.values()).filter(v => v.is_admin).length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5" />
            Live Chat
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {viewerCount}
            </Badge>
            {adminCount > 0 && (
              <Badge variant="default" className="flex items-center gap-1">
                <Crown className="h-3 w-3" />
                {adminCount}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Messages area */}
        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Be the first to say something!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex gap-2 animate-in fade-in slide-in-from-bottom-2">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {message.display_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">
                        {message.display_name}
                      </span>
                      {message.is_admin && (
                        <Badge variant="default" className="h-4 text-[10px] px-1">
                          <Crown className="h-2.5 w-2.5 mr-0.5" />
                          Admin
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Message input */}
        <div className="flex gap-2 pt-2 border-t">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            disabled={!user || sending}
            className="flex-1"
            maxLength={500}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!newMessage.trim() || !user || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveStreamChat;
