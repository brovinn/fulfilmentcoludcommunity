import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Heart, Send, Clock, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface StoryPost {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  profiles?: {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export const StoryFeed = () => {
  const [stories, setStories] = useState<StoryPost[]>([]);
  const [selectedStory, setSelectedStory] = useState<StoryPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadStories();
    
    // Set up realtime subscription for new stories
    const channel = supabase
      .channel('story-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'content'
        },
        () => {
          loadStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedStory) {
      loadComments(selectedStory.id);
      
      // Set up realtime subscription for new comments
      const channel = supabase
        .channel(`comments-${selectedStory.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'comments',
            filter: `content_id=eq.${selectedStory.id}`
          },
          () => {
            loadComments(selectedStory.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedStory]);

  const loadStories = async () => {
    try {
      // Get posts from last 24 hours
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .select('*')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (contentError) throw contentError;

      // Fetch profiles separately
      const userIds = [...new Set(contentData?.map(c => c.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const storiesWithProfiles = contentData?.map(content => ({
        ...content,
        profiles: profilesData?.find(p => p.user_id === content.user_id)
      })) || [];

      setStories(storiesWithProfiles);
    } catch (error) {
      console.error('Error loading stories:', error);
      toast.error('Failed to load stories');
    }
  };

  const loadComments = async (contentId: string) => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('content_id', contentId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Fetch profiles separately
      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const commentsWithProfiles = commentsData?.map(comment => ({
        ...comment,
        profiles: profilesData?.find(p => p.user_id === comment.user_id)
      })) || [];

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!user || !selectedStory || !newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content_id: selectedStory.id,
          user_id: user.id,
          comment_text: newComment.trim()
        });

      if (error) throw error;

      toast.success('Comment added!');
      setNewComment("");
      loadComments(selectedStory.id);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    }
    return `${diffInHours}h ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Stories (Last 24 Hours)</h3>
        <Badge variant="secondary">{stories.length}</Badge>
      </div>

      {/* Horizontal Story Scroll */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {stories.length === 0 ? (
            <Card className="p-8 w-full">
              <p className="text-center text-muted-foreground">No stories in the last 24 hours</p>
            </Card>
          ) : (
            stories.map((story) => (
              <button
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className="flex flex-col items-center gap-2 min-w-[100px] group cursor-pointer"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary via-accent to-primary p-[3px] group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-background p-[2px]">
                      {story.profiles?.avatar_url ? (
                        <Avatar className="w-full h-full">
                          <AvatarImage src={story.profiles.avatar_url} alt={story.profiles.display_name} />
                          <AvatarFallback>
                            <User className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-8 w-8 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 bg-background rounded-full p-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
                <div className="text-center max-w-[100px]">
                  <p className="text-xs font-medium truncate">
                    {story.profiles?.display_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getTimeAgo(story.created_at)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Story Viewer Dialog */}
      <Dialog open={!!selectedStory} onOpenChange={(open) => !open && setSelectedStory(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {selectedStory && (
            <div className="grid md:grid-cols-2 h-full">
              {/* Story Content */}
              <div className="relative bg-muted p-4 flex flex-col justify-center items-center">
                <DialogHeader className="absolute top-4 left-4 right-4 z-10">
                  <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-lg p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedStory.profiles?.avatar_url || ''} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <DialogTitle className="text-sm">
                        {selectedStory.profiles?.display_name || 'User'}
                      </DialogTitle>
                      <p className="text-xs text-muted-foreground">
                        {getTimeAgo(selectedStory.created_at)}
                      </p>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="w-full h-full flex flex-col justify-center items-center space-y-4 mt-20">
                  {selectedStory.image_url && (
                    <img
                      src={selectedStory.image_url}
                      alt={selectedStory.title}
                      className="max-w-full max-h-[60vh] object-contain rounded-lg"
                    />
                  )}
                  <div className="text-center px-4">
                    <h3 className="font-semibold text-lg mb-2">{selectedStory.title}</h3>
                    {selectedStory.description && (
                      <p className="text-sm text-muted-foreground">{selectedStory.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="flex flex-col h-[600px]">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    <h3 className="font-semibold">Comments</h3>
                    <Badge variant="secondary">{comments.length}</Badge>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {comments.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-8">
                        No comments yet. Be the first to comment!
                      </p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={comment.profiles?.avatar_url || ''} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="bg-muted rounded-lg p-3">
                              <p className="font-semibold text-sm mb-1">
                                {comment.profiles?.display_name || 'User'}
                              </p>
                              <p className="text-sm">{comment.comment_text}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-2">
                              {getTimeAgo(comment.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Comment Input */}
                {user ? (
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="min-h-[60px]"
                        disabled={loading}
                      />
                      <Button
                        onClick={handleAddComment}
                        disabled={loading || !newComment.trim()}
                        size="icon"
                        className="self-end"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-t">
                    <p className="text-center text-sm text-muted-foreground">
                      Sign in to comment
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
