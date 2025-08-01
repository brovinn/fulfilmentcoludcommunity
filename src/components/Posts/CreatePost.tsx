import { useState } from "react";
import { Image, Video, Smile, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const CreatePost = ({ onPostCreate }: { onPostCreate: (content: string) => void }) => {
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (content.trim()) {
      onPostCreate(content);
      setContent("");
    }
  };

  return (
    <Card className="mb-6 shadow-sm border border-border animate-fade-in">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="What's on your mind, John?"
              className="min-h-[80px] border-none resize-none text-lg placeholder:text-muted-foreground bg-secondary rounded-full px-6 py-3 focus:ring-2 focus:ring-primary/20"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <Button variant="ghost" size="sm" className="text-success hover:bg-success/10">
              <Video className="mr-2 h-4 w-4" />
              Live Video
            </Button>
            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
              <Image className="mr-2 h-4 w-4" />
              Photo/Video
            </Button>
            <Button variant="ghost" size="sm" className="text-warning hover:bg-warning/10">
              <Smile className="mr-2 h-4 w-4" />
              Feeling/Activity
            </Button>
          </div>
          
          <Button 
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="bg-primary hover:bg-primary-hover text-primary-foreground px-8"
          >
            Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatePost;