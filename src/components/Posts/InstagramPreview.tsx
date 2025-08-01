import { Heart, MessageCircle, Share } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

interface InstagramPreviewProps {
  posts: Post[];
  onPostClick: (postId: string) => void;
}

const InstagramPreview = ({ posts, onPostClick }: InstagramPreviewProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {posts.map((post) => (
        <div 
          key={post.id} 
          className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-card border hover:shadow-lg transition-all duration-300"
          onClick={() => onPostClick(post.id)}
        >
          {/* Image or Content Preview */}
          {post.image ? (
            <img 
              src={post.image} 
              alt={`Post by ${post.author.username}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-4">
              <p className="text-center text-foreground font-medium line-clamp-6 text-sm">
                {post.content}
              </p>
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="flex items-center space-x-6 text-white">
              <div className="flex items-center space-x-1">
                <Heart className="h-5 w-5 fill-white" />
                <span className="font-semibold">{post.likes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-5 w-5 fill-white" />
                <span className="font-semibold">{post.comments}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Share className="h-5 w-5 fill-white" />
                <span className="font-semibold">{post.shares}</span>
              </div>
            </div>
          </div>
          
          {/* Author info */}
          <div className="absolute top-3 left-3 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Avatar className="h-8 w-8 border-2 border-white">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback className="text-xs bg-white text-foreground">
                {post.author.name[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-white font-medium text-sm drop-shadow-lg">
              @{post.author.username}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InstagramPreview;