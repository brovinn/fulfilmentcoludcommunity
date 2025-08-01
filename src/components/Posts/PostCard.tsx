import { useState } from "react";
import { Heart, MessageCircle, Share, MoreHorizontal, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    username: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  image?: string;
  isLiked?: boolean;
}

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: string) => void;
}

const PostCard = ({ post, onLike, onComment }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const handleLike = () => {
    onLike(post.id);
  };

  const handleComment = () => {
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText("");
    }
  };

  return (
    <Card className="mb-6 shadow-sm border border-border animate-fade-in hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback>{post.author.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{post.author.name}</p>
              <p className="text-sm text-muted-foreground">@{post.author.username} • {post.timestamp}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Save post</DropdownMenuItem>
              <DropdownMenuItem>Hide post</DropdownMenuItem>
              <DropdownMenuItem>Report post</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>
        
        {post.image && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img 
              src={post.image} 
              alt="Post content" 
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Reaction counts */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <ThumbsUp className="h-4 w-4 mr-1 text-like-color" />
              {post.likes}
            </span>
            <span>{post.comments} comments</span>
          </div>
          <span>{post.shares} shares</span>
        </div>

        <Separator className="mb-3" />

        {/* Action buttons */}
        <div className="flex items-center justify-around mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`flex-1 hover:bg-like-color/10 ${
              post.isLiked ? "text-like-color" : "text-muted-foreground"
            }`}
          >
            <Heart className={`mr-2 h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
            Like
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex-1 text-muted-foreground hover:bg-comment-color/10"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Comment
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-muted-foreground hover:bg-share-color/10"
          >
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="space-y-3 animate-slide-up">
            <Separator />
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[60px] bg-secondary border-none resize-none"
                />
                <div className="flex justify-end mt-2">
                  <Button size="sm" onClick={handleComment} disabled={!commentText.trim()}>
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;