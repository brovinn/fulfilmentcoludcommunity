import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, Play, Pause, Volume2, VolumeX, Trash2, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
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

      if (data) {
        const userIds = [...new Set(data.map(item => item.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        const reelsWithProfiles = data.map(item => ({
          ...item,
          profiles: profiles?.find(p => p.user_id === item.user_id) || {
            display_name: 'Unknown User',
            avatar_url: null
          }
        }));
        setReels(reelsWithProfiles);
      }

    } catch (error) {
      console.error('Error loading reels:', error);
      toast({
        title: "Error",
        description: "Failed to load reels",
        variant: "destructive",
      });
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

      // Load like counts for each reel
      const { data: likeCounts } = await supabase
        .from('content_likes')
        .select('content_id')
        .in('content_id', reels.map(reel => reel.id));

      if (likeCounts) {
        const counts: { [key: string]: number } = {};
        likeCounts.forEach(like => {
          counts[like.content_id] = (counts[like.content_id] || 0) + 1;
        });
        setLikes(counts);
      }
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const handleLike = async (reelId: string) => {
    if (!user) return;

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
      console.error('Error handling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (reelId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', reelId)
        .eq('user_id', user.id); // Only allow users to delete their own content

      if (error) throw error;

      setReels(prev => prev.filter(reel => reel.id !== reelId));
      toast({
        title: "Success",
        description: "Reel deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting reel:', error);
      toast({
        title: "Error",
        description: "Failed to delete reel",
        variant: "destructive",
      });
    }
  };

  const handleVideoToggle = (reelId: string) => {
    const video = videoRefs.current[reelId];
    if (!video) return;

    if (playingReel === reelId) {
      video.pause();
      setPlayingReel(null);
    } else {
      // Pause other videos
      Object.values(videoRefs.current).forEach(v => v.pause());
      video.play();
      setPlayingReel(reelId);
    }
  };

  const handleMuteToggle = (reelId: string) => {
    const video = videoRefs.current[reelId];
    if (!video) return;

    if (mutedReels.has(reelId)) {
      video.muted = false;
      setMutedReels(prev => {
        const newSet = new Set(prev);
        newSet.delete(reelId);
        return newSet;
      });
    } else {
      video.muted = true;
      setMutedReels(prev => new Set([...prev, reelId]));
    }
  };

  const isVideoFile = (url: string | null) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|mov)$/i.test(url);
  };

  return (
    <div className="space-y-6">
      {reels.map((reel) => (
        <Card key={reel.id} className="overflow-hidden">
          <CardContent className="p-0">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={reel.profiles?.avatar_url || ""} />
                  <AvatarFallback>
                    {reel.profiles?.display_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{reel.profiles?.display_name || "Unknown User"}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(reel.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {user?.id === reel.user_id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(reel.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Content */}
            <div className="px-4 pb-2">
              <h3 className="font-semibold mb-1">{reel.title}</h3>
              {reel.description && (
                <p className="text-muted-foreground text-sm mb-2">{reel.description}</p>
              )}
              {reel.content_text && (
                <p className="text-sm mb-3">{reel.content_text}</p>
              )}
            </div>

            {/* Media */}
            {reel.image_url && (
              <div className="relative">
                {isVideoFile(reel.image_url) ? (
                  <div className="relative">
                     <video
                      ref={(el) => {
                        if (el) {
                          videoRefs.current[reel.id] = el;
                          el.muted = mutedReels.has(reel.id);
                        }
                      }}
                      src={reel.image_url}
                      className="w-full max-h-96 object-cover"
                      loop
                      playsInline
                      onLoadedData={() => {
                        const video = videoRefs.current[reel.id];
                        if (video) {
                          video.muted = mutedReels.has(reel.id);
                        }
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        variant="secondary"
                        size="lg"
                        className="bg-black/50 hover:bg-black/70"
                        onClick={() => handleVideoToggle(reel.id)}
                      >
                        {playingReel === reel.id ? (
                          <Pause className="h-6 w-6" />
                        ) : (
                          <Play className="h-6 w-6" />
                        )}
                      </Button>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-black/50 hover:bg-black/70"
                        onClick={() => handleMuteToggle(reel.id)}
                      >
                        {mutedReels.has(reel.id) ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={reel.image_url} 
                    alt={reel.title}
                    className="w-full max-h-96 object-cover"
                  />
                )}
              </div>
            )}

            {/* Actions */}
            <div className="p-4 flex items-center justify-between border-t">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(reel.id)}
                  className={userLikes.has(reel.id) ? "text-red-500" : ""}
                >
                  <Heart className={`h-5 w-5 mr-1 ${userLikes.has(reel.id) ? "fill-current" : ""}`} />
                  {likes[reel.id] || 0}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCommentClick(reel.id)}
                >
                  <MessageCircle className="h-5 w-5 mr-1" />
                  Comment
                </Button>
                <Button variant="ghost" size="sm">
                  <Share className="h-5 w-5 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReelsFeed;