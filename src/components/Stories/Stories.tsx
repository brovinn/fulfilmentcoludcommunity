import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const Stories = () => {
  const stories = [
    { id: 1, name: "Sarah", avatar: "/placeholder.svg", hasStory: true },
    { id: 2, name: "Mike", avatar: "/placeholder.svg", hasStory: true },
    { id: 3, name: "Emma", avatar: "/placeholder.svg", hasStory: true },
    { id: 4, name: "Tom", avatar: "/placeholder.svg", hasStory: true },
    { id: 5, name: "Lisa", avatar: "/placeholder.svg", hasStory: true },
  ];

  return (
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex space-x-4 overflow-x-auto">
          {/* Create Story */}
          <div className="flex-shrink-0 text-center">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-gray-200">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary hover:bg-primary-hover"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">Create Story</p>
          </div>

          {/* Stories */}
          {stories.map((story) => (
            <div key={story.id} className="flex-shrink-0 text-center cursor-pointer">
              <div className="relative">
                <Avatar className="h-16 w-16 border-4 border-gradient-to-r from-purple-500 to-pink-500 p-0.5">
                  <AvatarImage src={story.avatar} />
                  <AvatarFallback>{story.name[0]}</AvatarFallback>
                </Avatar>
                {story.hasStory && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse opacity-20"></div>
                )}
              </div>
              <p className="text-xs mt-2 text-muted-foreground truncate w-16">{story.name}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Stories;