import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, Heart, MessageCircle, Users, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  channel: string;
  reply_to: string | null;
}

export const CommunityChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likes, setLikes] = useState<{ [key: string]: number }>({});
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    if (user) {
      loadLikes();
    }
  }, [user]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel', 'general')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadLikes = async () => {
    try {
      // Get all message likes count
      const { data: likesData } = await supabase
        .from('messages')
        .select('id, message_likes:message_likes(count)')
        .not('message_likes', 'is', null);

      // Get user's likes
      const { data: userLikesData } = await supabase
        .from('message_likes')
        .select('message_id')
        .eq('user_id', user?.id);

      if (likesData) {
        const likesCount = likesData.reduce((acc, item) => {
          acc[item.id] = item.message_likes?.[0]?.count || 0;
          return acc;
        }, {} as { [key: string]: number });
        setLikes(likesCount);
      }

      if (userLikesData) {
        setUserLikes(new Set(userLikesData.map(like => like.message_id)));
      }
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage.trim(),
          user_id: user.id,
          channel: 'general'
        });

      if (error) throw error;

      setNewMessage("");
      loadMessages();
      
      // Scroll to bottom
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);
    } catch (err: any) {
      toast({
        title: "Failed to send message",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (messageId: string) => {
    if (!user) return;

    try {
      const isLiked = userLikes.has(messageId);
      
      if (isLiked) {
        await supabase
          .from('message_likes')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id);
        
        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
        setLikes(prev => ({ ...prev, [messageId]: (prev[messageId] || 1) - 1 }));
      } else {
        await supabase
          .from('message_likes')
          .insert({ message_id: messageId, user_id: user.id });
        
        setUserLikes(prev => new Set([...prev, messageId]));
        setLikes(prev => ({ ...prev, [messageId]: (prev[messageId] || 0) + 1 }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Message deleted",
        description: "Your message has been removed",
      });

      loadMessages();
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load chat: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Community Chat
          <Badge variant="secondary" className="ml-auto">
            <Users className="h-3 w-3 mr-1" />
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {message.user_id === user?.id ? (user?.email?.split('@')[0] || "You") : "User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.created_at)}
                    </span>
                    {message.user_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMessage(message.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(message.id)}
                      className={`h-6 px-2 text-xs ${
                        userLikes.has(message.id) 
                          ? "text-red-500 hover:text-red-600" 
                          : "text-muted-foreground hover:text-red-500"
                      }`}
                    >
                      <Heart className={`h-3 w-3 mr-1 ${userLikes.has(message.id) ? "fill-current" : ""}`} />
                      {likes[message.id] || 0}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <Separator />
        
        <form onSubmit={sendMessage} className="p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};