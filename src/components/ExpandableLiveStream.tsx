import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Maximize2, Minimize2, Users, Clock } from "lucide-react";

interface ExpandableLiveStreamProps {
  sessionId: string;
  title: string;
  description?: string;
  creatorName: string;
  startedAt: string;
  streamUrl?: string;
}

const ExpandableLiveStream = ({
  sessionId,
  title,
  description,
  creatorName,
  startedAt,
  streamUrl
}: ExpandableLiveStreamProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewerCount] = useState(Math.floor(Math.random() * 50) + 10);

  const StreamContent = ({ expanded = false }: { expanded?: boolean }) => (
    <div className={`relative bg-black ${expanded ? 'h-[80vh]' : 'h-64'} rounded-lg overflow-hidden`}>
      {streamUrl ? (
        <video
          className="w-full h-full object-contain"
          autoPlay
          playsInline
          controls={expanded}
        >
          <source src={streamUrl} type="video/mp4" />
        </video>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white">
          <div className="text-center">
            <div className="animate-pulse mb-4">
              <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-2" />
            </div>
            <p className="text-lg font-medium">Live Stream Active</p>
            <p className="text-sm text-gray-400">Started {new Date(startedAt).toLocaleTimeString()}</p>
          </div>
        </div>
      )}
      
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Badge variant="destructive" className="animate-pulse">
          LIVE
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {viewerCount}
        </Badge>
      </div>

      {!expanded && (
        <div className="absolute bottom-4 right-4">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsExpanded(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                by {creatorName}
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(startedAt).toLocaleTimeString()}
            </Badge>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          <StreamContent />
        </CardContent>
      </Card>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-6xl w-full p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{title}</h2>
                <p className="text-sm text-muted-foreground">by {creatorName}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
            <StreamContent expanded />
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExpandableLiveStream;
