import { useState } from "react";
import { Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";
import InstagramPreview from "./InstagramPreview";

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

const Feed = () => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      author: {
        name: "Sarah Wilson",
        avatar: "/placeholder.svg",
        username: "sarah_wilson"
      },
      content: "Just finished an amazing React project! The new features in React 18 are game-changing. Concurrent rendering makes everything so smooth. Who else is excited about the future of React development? 🚀",
      timestamp: "2 hours ago",
      likes: 24,
      comments: 8,
      shares: 3,
      image: "/placeholder.svg",
      isLiked: false
    },
    {
      id: "2",
      author: {
        name: "Mike Johnson",
        avatar: "/placeholder.svg",
        username: "mike_codes"
      },
      content: "Beautiful sunset from my office window today! Sometimes we need to step back and appreciate the simple things in life. Hope everyone is having a great day! 🌅",
      timestamp: "4 hours ago",
      likes: 42,
      comments: 12,
      shares: 7,
      isLiked: true
    },
    {
      id: "3",
      author: {
        name: "Emma Davis",
        avatar: "/placeholder.svg",
        username: "emma_designs"
      },
      content: "Sharing my latest UI design for a travel app. Clean, minimal, and user-friendly. What do you think about the color palette? Always open to feedback from the design community! ✨",
      timestamp: "6 hours ago",
      likes: 67,
      comments: 23,
      shares: 15,
      image: "/placeholder.svg",
      isLiked: false
    }
  ]);

  const handlePostCreate = (content: string) => {
    const newPost: Post = {
      id: Date.now().toString(),
      author: {
        name: "John Doe",
        avatar: "/placeholder.svg",
        username: "john_doe"
      },
      content,
      timestamp: "now",
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false
    };
    setPosts([newPost, ...posts]);
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const handleComment = (postId: string, comment: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, comments: post.comments + 1 }
        : post
    ));
  };

  const handlePostClick = (postId: string) => {
    // Switch to list view and scroll to post
    setViewMode('list');
    // In a real app, you might scroll to the specific post or open a modal
  };

  return (
    <div className="space-y-6">
      
      {/* Content based on view mode */}
      {viewMode === 'list' ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
            />
          ))}
        </div>
      ) : (
        <InstagramPreview posts={posts} onPostClick={handlePostClick} />
      )}
    </div>
  );
};

export default Feed;