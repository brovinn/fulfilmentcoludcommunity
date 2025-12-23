import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
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
  Users,
  Play,
  Square,
  Pause,
  Circle,
  PictureInPicture,
  Settings,
  PhoneOff,
  RefreshCw,
  Camera,
  SwitchCamera
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LiveStreamWithControlsProps {
  sessionId?: string;
  isHost?: boolean;
  title?: string;
}

type StreamStatus = 'idle' | 'starting' | 'live' | 'paused' | 'ended';

const LiveStreamWithControls = ({ sessionId, isHost = false, title = "Live Stream" }: LiveStreamWithControlsProps) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('idle');
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([100]);
  const [viewerCount, setViewerCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [streamDuration, setStreamDuration] = useState(0);

  // Get available media devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAvailableDevices(devices);
        
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        const audioDevices = devices.filter(d => d.kind === 'audioinput');
        
        if (videoDevices.length > 0) setSelectedVideoDevice(videoDevices[0].deviceId);
        if (audioDevices.length > 0) setSelectedAudioDevice(audioDevices[0].deviceId);
      } catch (error) {
        console.error('Error getting devices:', error);
      }
    };
    
    getDevices();
  }, []);

  // Simulate viewer count
  useEffect(() => {
    if (streamStatus === 'live') {
      const interval = setInterval(() => {
        setViewerCount(prev => Math.max(0, prev + Math.floor(Math.random() * 10) - 3));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [streamStatus]);

  // Stream duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (streamStatus === 'live') {
      interval = setInterval(() => {
        setStreamDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [streamStatus]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startCamera = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedVideoDevice 
          ? { deviceId: { exact: selectedVideoDevice }, width: 1280, height: 720 }
          : { width: 1280, height: 720 },
        audio: selectedAudioDevice 
          ? { deviceId: { exact: selectedAudioDevice } }
          : true
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      return mediaStream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive"
      });
      return null;
    }
  }, [selectedVideoDevice, selectedAudioDevice, toast]);

  const stopAllTracks = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start broadcasting
  const startStream = async () => {
    setStreamStatus('starting');
    const mediaStream = await startCamera();
    
    if (mediaStream) {
      setStreamStatus('live');
      setViewerCount(Math.floor(Math.random() * 20) + 5);
      setStreamDuration(0);
      
      toast({
        title: "🔴 You're Live!",
        description: "Broadcasting has started successfully",
      });
    } else {
      setStreamStatus('idle');
    }
  };

  // Stop broadcasting
  const stopStream = () => {
    if (isRecording) {
      stopRecording();
    }
    stopAllTracks();
    setStreamStatus('ended');
    setViewerCount(0);
    
    toast({
      title: "Stream Ended",
      description: `Total duration: ${formatTime(streamDuration)}`,
    });
  };

  // Pause stream (mute audio and video but keep connection)
  const pauseStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.enabled = false;
      });
      setStreamStatus('paused');
      setIsVideoOn(false);
      setIsAudioOn(false);
      
      toast({
        title: "Stream Paused",
        description: "Your broadcast is paused. Viewers see a pause screen.",
      });
    }
  };

  // Resume stream
  const resumeStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.enabled = true;
      });
      setStreamStatus('live');
      setIsVideoOn(true);
      setIsAudioOn(true);
      
      toast({
        title: "Stream Resumed",
        description: "You're live again!",
      });
    }
  };

  // End call and reset
  const endCall = () => {
    stopStream();
    setStreamStatus('idle');
    setStreamDuration(0);
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
        
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          startCamera();
        };
        
        toast({
          title: "Screen Sharing",
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

  // Recording functions
  const startRecording = () => {
    if (!stream) return;

    try {
      recordedChunksRef.current = [];
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        const fallbackOptions = { mimeType: 'video/webm' };
        mediaRecorderRef.current = new MediaRecorder(stream, fallbackOptions);
      } else {
        mediaRecorderRef.current = new MediaRecorder(stream, options);
      }

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stream-recording-${new Date().toISOString()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      toast({
        title: "Recording Started",
        description: "Your stream is now being recorded locally",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not start recording",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      toast({
        title: "Recording Saved",
        description: `Recording saved (${formatTime(recordingTime)})`,
      });
    }
  };

  // Picture-in-Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (error) {
      console.error('PiP error:', error);
      toast({
        title: "Picture-in-Picture Error",
        description: "Could not enable picture-in-picture mode",
        variant: "destructive"
      });
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

  // Switch camera
  const switchCamera = async (deviceId: string) => {
    setSelectedVideoDevice(deviceId);
    if (streamStatus === 'live') {
      stopAllTracks();
      await startCamera();
    }
  };

  const getStatusColor = () => {
    switch (streamStatus) {
      case 'live': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      case 'ended': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (streamStatus) {
      case 'starting': return 'Starting...';
      case 'live': return 'LIVE';
      case 'paused': return 'PAUSED';
      case 'ended': return 'ENDED';
      default: return 'OFFLINE';
    }
  };

  const videoDevices = availableDevices.filter(d => d.kind === 'videoinput');
  const audioDevices = availableDevices.filter(d => d.kind === 'audioinput');

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              {title}
              <Badge className={`ml-2 ${getStatusColor()}`}>
                {getStatusText()}
              </Badge>
              {isRecording && (
                <Badge variant="destructive" className="ml-2 animate-pulse">
                  <Circle className="h-2 w-2 mr-1 fill-current" />
                  REC {formatTime(recordingTime)}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {streamStatus === 'live' && (
                <>
                  <span className="font-mono">{formatTime(streamDuration)}</span>
                  <Separator orientation="vertical" className="h-4" />
                </>
              )}
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{viewerCount}</span>
              </div>
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
              muted={isHost}
              className="w-full h-full object-contain"
            />
            
            {/* Paused overlay */}
            {streamStatus === 'paused' && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <div className="text-center text-white">
                  <Pause className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl font-semibold">Stream Paused</p>
                  <p className="text-sm opacity-70">Click resume to continue</p>
                </div>
              </div>
            )}

            {/* Idle overlay */}
            {streamStatus === 'idle' && (
              <div className="absolute inset-0 bg-muted/90 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-xl font-semibold text-foreground">Ready to Stream</p>
                  <p className="text-sm text-muted-foreground">Click Start to begin broadcasting</p>
                </div>
              </div>
            )}
            
            {/* Bottom control bar - Google Meet/Zoom style */}
            {isHost && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
                <div className="flex items-center justify-center gap-2">
                  {/* Main controls row */}
                  
                  {/* Mic toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="lg"
                        variant={isAudioOn ? "secondary" : "destructive"}
                        className="rounded-full h-12 w-12"
                        onClick={toggleAudio}
                        disabled={streamStatus === 'idle'}
                      >
                        {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isAudioOn ? 'Mute microphone' : 'Unmute microphone'}</TooltipContent>
                  </Tooltip>

                  {/* Video toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="lg"
                        variant={isVideoOn ? "secondary" : "destructive"}
                        className="rounded-full h-12 w-12"
                        onClick={toggleVideo}
                        disabled={streamStatus === 'idle'}
                      >
                        {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isVideoOn ? 'Turn off camera' : 'Turn on camera'}</TooltipContent>
                  </Tooltip>

                  {/* Screen share */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="lg"
                        variant={isScreenSharing ? "default" : "secondary"}
                        className="rounded-full h-12 w-12"
                        onClick={toggleScreenShare}
                        disabled={streamStatus === 'idle'}
                      >
                        {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isScreenSharing ? 'Stop sharing' : 'Share screen'}</TooltipContent>
                  </Tooltip>

                  <Separator orientation="vertical" className="h-8 bg-white/20" />

                  {/* Start/Stop/Pause controls */}
                  {streamStatus === 'idle' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="lg"
                          className="rounded-full h-14 w-14 bg-green-600 hover:bg-green-700"
                          onClick={startStream}
                        >
                          <Play className="h-6 w-6" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Start streaming</TooltipContent>
                    </Tooltip>
                  )}

                  {streamStatus === 'live' && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="lg"
                            className="rounded-full h-12 w-12 bg-yellow-600 hover:bg-yellow-700"
                            onClick={pauseStream}
                          >
                            <Pause className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Pause stream</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="lg"
                            variant="destructive"
                            className="rounded-full h-14 w-14"
                            onClick={stopStream}
                          >
                            <Square className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Stop streaming</TooltipContent>
                      </Tooltip>
                    </>
                  )}

                  {streamStatus === 'paused' && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="lg"
                            className="rounded-full h-14 w-14 bg-green-600 hover:bg-green-700"
                            onClick={resumeStream}
                          >
                            <Play className="h-6 w-6" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Resume stream</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="lg"
                            variant="destructive"
                            className="rounded-full h-12 w-12"
                            onClick={endCall}
                          >
                            <PhoneOff className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>End stream</TooltipContent>
                      </Tooltip>
                    </>
                  )}

                  {streamStatus === 'ended' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="lg"
                          className="rounded-full h-14 w-14 bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setStreamStatus('idle');
                            setStreamDuration(0);
                          }}
                        >
                          <RefreshCw className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>New stream</TooltipContent>
                    </Tooltip>
                  )}

                  <Separator orientation="vertical" className="h-8 bg-white/20" />

                  {/* Recording */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="lg"
                        variant={isRecording ? "destructive" : "secondary"}
                        className="rounded-full h-12 w-12"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={streamStatus !== 'live'}
                      >
                        <Circle className={`h-5 w-5 ${isRecording ? 'fill-current animate-pulse' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isRecording ? 'Stop recording' : 'Start recording'}</TooltipContent>
                  </Tooltip>

                  {/* Picture-in-Picture */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="lg"
                        variant={isPiPActive ? "default" : "secondary"}
                        className="rounded-full h-12 w-12"
                        onClick={togglePiP}
                        disabled={streamStatus === 'idle'}
                      >
                        <PictureInPicture className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Picture-in-picture</TooltipContent>
                  </Tooltip>

                  {/* Fullscreen */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="lg"
                        variant="secondary"
                        className="rounded-full h-12 w-12"
                        onClick={toggleFullscreen}
                      >
                        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</TooltipContent>
                  </Tooltip>

                  {/* Settings dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="lg"
                        variant="secondary"
                        className="rounded-full h-12 w-12"
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel>Camera</DropdownMenuLabel>
                      {videoDevices.map((device) => (
                        <DropdownMenuItem
                          key={device.deviceId}
                          onClick={() => switchCamera(device.deviceId)}
                          className={selectedVideoDevice === device.deviceId ? 'bg-accent' : ''}
                        >
                          <SwitchCamera className="h-4 w-4 mr-2" />
                          {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Microphone</DropdownMenuLabel>
                      {audioDevices.map((device) => (
                        <DropdownMenuItem
                          key={device.deviceId}
                          onClick={() => setSelectedAudioDevice(device.deviceId)}
                          className={selectedAudioDevice === device.deviceId ? 'bg-accent' : ''}
                        >
                          <Mic className="h-4 w-4 mr-2" />
                          {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}

            {/* Viewer controls (non-host) */}
            {!isHost && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-center gap-2">
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
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Stream Status Indicators (Host only) */}
          {isHost && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={isVideoOn ? "default" : "destructive"}>
                {isVideoOn ? <Video className="h-3 w-3 mr-1" /> : <VideoOff className="h-3 w-3 mr-1" />}
                Video: {isVideoOn ? "ON" : "OFF"}
              </Badge>
              <Badge variant={isAudioOn ? "default" : "destructive"}>
                {isAudioOn ? <Mic className="h-3 w-3 mr-1" /> : <MicOff className="h-3 w-3 mr-1" />}
                Audio: {isAudioOn ? "ON" : "OFF"}
              </Badge>
              {isScreenSharing && (
                <Badge variant="secondary">
                  <MonitorUp className="h-3 w-3 mr-1" />
                  Screen Sharing
                </Badge>
              )}
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  <Circle className="h-2 w-2 mr-1 fill-current" />
                  Recording
                </Badge>
              )}
              {isPiPActive && (
                <Badge variant="secondary">
                  <PictureInPicture className="h-3 w-3 mr-1" />
                  PiP Active
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default LiveStreamWithControls;