import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send } from "lucide-react";

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string | null;
}

const CommentModal = ({ isOpen, onClose, contentId }: CommentModalProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && contentId) {
      loadComments();
    }
  }, [isOpen, contentId]);

  const loadComments = async () => {
    if (!contentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('content_id', contentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !contentId || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content_id: contentId,
          comment_text: newComment.trim(),
          user_id: user.id,
        })
        .select('*')
        .single();

      if (error) throw error;

      setComments(prev => [...prev, data]);
      setNewComment("");
      
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully",
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getDisplayName = (comment: Comment) => {
    return comment.profiles?.display_name || 'Anonymous User';
  };

  const getAvatarFallback = (comment: Comment) => {
    const displayName = getDisplayName(comment);
    return displayName[0]?.toUpperCase() || 'A';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.profiles?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getAvatarFallback(comment)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="font-semibold text-sm">{getDisplayName(comment)}</p>
                    <p className="text-sm mt-1">{comment.comment_text}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(comment.created_at)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>

        {/* Comment Input */}
        {user ? (
          <div className="border-t pt-4">
            <div className="flex space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user.user_metadata?.display_name?.[0] || user.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submitting}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-1" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-t pt-4 text-center">
            <p className="text-muted-foreground">Sign in to post a comment</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;