import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  MonitorUp, 
  MonitorOff,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LiveStreamWithControlsProps {
  sessionId?: string;
  isHost?: boolean;
  title?: string;
}

const LiveStreamWithControls = ({ sessionId, isHost = false, title = "Live Stream" }: LiveStreamWithControlsProps) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([100]);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (isHost) {
      startCamera();
    }
    
    // Simulate viewer count (in production, use real-time subscriptions)
    const interval = setInterval(() => {
      setViewerCount(Math.floor(Math.random() * 50) + 10);
    }, 5000);

    return () => {
      clearInterval(interval);
      stopAllTracks();
    };
  }, [isHost]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      toast({
        title: "Camera started",
        description: "Your camera is now active",
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopAllTracks = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopAllTracks();
      await startCamera();
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        stopAllTracks();
        setStream(screenStream);
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        
        // Handle when user stops sharing via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          startCamera();
        };
        
        toast({
          title: "Screen sharing started",
          description: "Your screen is now being shared",
        });
      } catch (error) {
        console.error('Error sharing screen:', error);
        toast({
          title: "Screen Share Error",
          description: "Could not share screen. Please check permissions.",
          variant: "destructive"
        });
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value[0] / 100;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {title}
            <Badge variant="destructive" className="ml-2">LIVE</Badge>
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{viewerCount} viewers</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Display */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isHost} // Host always muted to prevent feedback
            className="w-full h-full object-contain"
          />
          
          {/* Overlay controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              {/* Left controls */}
              <div className="flex items-center gap-2">
                {isHost && (
                  <>
                    <Button
                      size="sm"
                      variant={isVideoOn ? "secondary" : "destructive"}
                      onClick={toggleVideo}
                    >
                      {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={isAudioOn ? "secondary" : "destructive"}
                      onClick={toggleAudio}
                    >
                      {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={isScreenSharing ? "default" : "secondary"}
                      onClick={toggleScreenShare}
                    >
                      {isScreenSharing ? <MonitorOff className="h-4 w-4" /> : <MonitorUp className="h-4 w-4" />}
                    </Button>
                  </>
                )}
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-2">
                {!isHost && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    
                    <div className="w-24">
                      <Slider
                        value={volume}
                        onValueChange={handleVolumeChange}
                        max={100}
                        step={1}
                        className="cursor-pointer"
                      />
                    </div>
                  </>
                )}
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stream Status */}
        {isHost && (
          <div className="flex items-center gap-4 text-sm">
            <Badge variant={isVideoOn ? "default" : "destructive"}>
              Video: {isVideoOn ? "ON" : "OFF"}
            </Badge>
            <Badge variant={isAudioOn ? "default" : "destructive"}>
              Audio: {isAudioOn ? "ON" : "OFF"}
            </Badge>
            {isScreenSharing && (
              <Badge variant="default">Screen Sharing</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveStreamWithControls;
