import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ReelItem {
  id: string;
  title: string;
  description: string | null;
  content_text: string | null;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface ReelsFeedProps {
  onCommentClick: (reelId: string) => void;
}

const ReelsFeed = ({ onCommentClick }: ReelsFeedProps) => {
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [likes, setLikes] = useState<{ [key: string]: number }>({});
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [playingReel, setPlayingReel] = useState<string | null>(null);
  const [mutedReels, setMutedReels] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadReels();
    if (user) {
      loadLikes();
    }
  }, [user]);

  const loadReels = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('tab_type', 'home')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReels(data || []);
    } catch (error) {
      console.error('Error loading reels:', error);
    }
  };

  const loadLikes = async () => {
    try {
      const { data: userLikesData } = await supabase
        .from('content_likes')
        .select('content_id')
        .eq('user_id', user?.id);

      if (userLikesData) {
        setUserLikes(new Set(userLikesData.map(like => like.content_id)));
      }
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const toggleLike = async (reelId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts",
        variant: "destructive",
      });
      return;
    }

    try {
      const isLiked = userLikes.has(reelId);
      
      if (isLiked) {
        await supabase
          .from('content_likes')
          .delete()
          .eq('content_id', reelId)
          .eq('user_id', user.id);
        
        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(reelId);
          return newSet;
        });
        setLikes(prev => ({ ...prev, [reelId]: (prev[reelId] || 1) - 1 }));
      } else {
        await supabase
          .from('content_likes')
          .insert({ content_id: reelId, user_id: user.id });
        
        setUserLikes(prev => new Set([...prev, reelId]));
        setLikes(prev => ({ ...prev, [reelId]: (prev[reelId] || 0) + 1 }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const togglePlayPause = (reelId: string) => {
    setPlayingReel(prev => prev === reelId ? null : reelId);
  };

  const toggleMute = (reelId: string) => {
    setMutedReels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reelId)) {
        newSet.delete(reelId);
      } else {
        newSet.add(reelId);
      }
      return newSet;
    });
  };

  const isVideoFile = (url: string) => {
    return url?.match(/\.(mp4|webm|ogg|mov)$/i);
  };

  const isImageFile = (url: string) => {
    return url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {reels.map((reel) => (
        <Card key={reel.id} className="relative overflow-hidden bg-card border-0 shadow-lg rounded-3xl">
          <div className="relative aspect-[9/16] bg-gradient-to-br from-primary/20 to-accent/20">
            {/* Media Content */}
            {reel.image_url && isVideoFile(reel.image_url) ? (
              <div className="relative w-full h-full">
                <video
                  className="w-full h-full object-cover"
                  muted={mutedReels.has(reel.id)}
                  autoPlay={playingReel === reel.id}
                  loop
                  poster="/placeholder.svg"
                >
                  <source src={reel.image_url} type="video/mp4" />
                </video>
                
                {/* Video Controls */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-16 h-16 rounded-full bg-black/30 text-white hover:bg-black/50"
                    onClick={() => togglePlayPause(reel.id)}
                  >
                    {playingReel === reel.id ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8 ml-1" />
                    )}
                  </Button>
                </div>

                {/* Mute/Unmute */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 text-white hover:bg-black/50"
                  onClick={() => toggleMute(reel.id)}
                >
                  {mutedReels.has(reel.id) ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
              </div>
            ) : reel.image_url && isImageFile(reel.image_url) ? (
              <img
                src={reel.image_url}
                alt={reel.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent">
                <div className="text-center p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">{reel.title}</h3>
                  {reel.content_text && (
                    <p className="text-white/90 text-lg leading-relaxed">{reel.content_text}</p>
                  )}
                </div>
              </div>
            )}

            {/* User Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <Avatar className="w-10 h-10 border-2 border-white">
                      <AvatarImage src={reel.profiles?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {reel.profiles?.display_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <p className="font-semibold text-white">
                        {reel.profiles?.display_name || 'Anonymous User'}
                      </p>
                      <p className="text-white/70 text-sm">
                        {new Date(reel.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <h3 className="text-white font-bold text-lg mb-1">{reel.title}</h3>
                  {reel.description && (
                    <p className="text-white/90 text-sm line-clamp-2">{reel.description}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col items-center space-y-4 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                    onClick={() => toggleLike(reel.id)}
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        userLikes.has(reel.id) ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                  </Button>
                  <span className="text-white text-sm font-medium">
                    {likes[reel.id] || 0}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                    onClick={() => onCommentClick(reel.id)}
                  >
                    <MessageCircle className="w-6 h-6" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                  >
                    <Share className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {reels.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <Play className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No reels yet</h3>
          <p className="text-muted-foreground">
            Be the first to upload content and start creating!
          </p>
        </div>
      )}
    </div>
  );
};

export default ReelsFeed;