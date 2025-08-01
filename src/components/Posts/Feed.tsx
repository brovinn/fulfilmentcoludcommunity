import { useState } from "react";
import { Button } from "@/components/ui/button";
import InstagramPreview from "./InstagramPreview";
import PostCard from "./PostCard";
import { Grid, List } from "lucide-react";

const Feed = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sample posts data
  const posts = [
    {
      id: "1",
      author: {
        avatar: "/placeholder.svg",
        name: "John Doe",
        username: "johndoe",
        verified: false
      },
      content: "Just had an amazing sunset walk on the beach! 🌅",
      media: {
        type: "image" as const,
        url: "/placeholder.svg"
      },
      timestamp: "2 hours ago",
      likes: 127,
      comments: 23,
      shares: 8,
      isLiked: false
    },
    {
      id: "2",
      author: {
        avatar: "/placeholder.svg",
        name: "Jane Smith",
        username: "janesmith",
        verified: true
      },
      content: "Working on some exciting new projects today! Can't wait to share them with you all. 💻✨",
      timestamp: "4 hours ago",
      likes: 89,
      comments: 15,
      shares: 3,
      isLiked: true
    },
    {
      id: "3",
      author: {
        avatar: "/placeholder.svg",
        name: "Mike Johnson",
        username: "mikej",
        verified: false
      },
      content: "Coffee and code - the perfect combination ☕",
      media: {
        type: "image" as const,
        url: "/placeholder.svg"
      },
      timestamp: "6 hours ago",
      likes: 256,
      comments: 42,
      shares: 12,
      isLiked: false
    },
    {
      id: "4",
      author: {
        avatar: "/placeholder.svg",
        name: "Sarah Wilson",
        username: "sarahw",
        verified: true
      },
      content: "Beautiful morning run in the park! 🏃‍♀️🌳",
      media: {
        type: "image" as const,
        url: "/placeholder.svg"
      },
      timestamp: "8 hours ago",
      likes: 183,
      comments: 31,
      shares: 7,
      isLiked: true
    }
  ];

  const handlePostClick = (postId: string) => {
    console.log("Post clicked:", postId);
    // Handle post detail view or navigation
  };

  const handleLike = (postId: string) => {
    console.log("Liked post:", postId);
    // Handle like functionality
  };

  const handleComment = (postId: string, comment: string) => {
    console.log("Comment on post:", postId, comment);
    // Handle comment functionality
  };

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex justify-end gap-2">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('grid')}
        >
          <Grid className="w-4 h-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          <List className="w-4 h-4" />
        </Button>
      </div>

      {/* Posts Display */}
      {viewMode === 'grid' ? (
        <InstagramPreview posts={posts} onPostClick={handlePostClick} />
      ) : (
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
      )}
    </div>
  );
};

export default Feed;