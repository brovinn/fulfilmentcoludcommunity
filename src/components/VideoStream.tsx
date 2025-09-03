import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Video, VideoOff, Square, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VideoSession {
  id: string;
  title: string;
  description: string;
  is_live: boolean;
  started_at: string;
  recording_url?: string;
  created_by_user_id: string;
}

const VideoStream = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [currentSession, setCurrentSession] = useState<VideoSession | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  useEffect(() => {
    checkAdminStatus();
    loadVideoSessions();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('is_admin', {
        _user_id: user.id
      });
      if (error) throw error;
      setIsAdmin(data);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadVideoSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('video_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading video sessions:', error);
    }
  };

  const startStream = async () => {
    if (!streamTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your stream",
        variant: "destructive"
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const streamKey = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data, error } = await supabase
        .from('video_sessions')
        .insert({
          title: streamTitle,
          description: streamDescription,
          stream_key: streamKey,
          is_live: true,
          started_at: new Date().toISOString(),
          created_by_user_id: user!.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentSession(data);
      setIsStreaming(true);
      setStreamTitle("");
      setStreamDescription("");
      
      toast({
        title: "Stream Started",
        description: "Your live stream is now active"
      });

      loadVideoSessions();
    } catch (error) {
      console.error('Error starting stream:', error);
      toast({
        title: "Stream Error",
        description: "Failed to start stream. Please check your camera permissions.",
        variant: "destructive"
      });
    }
  };

  const stopStream = async () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }

    if (currentSession) {
      try {
        await supabase
          .from('video_sessions')
          .update({
            is_live: false,
            ended_at: new Date().toISOString()
          })
          .eq('id', currentSession.id);
      } catch (error) {
        console.error('Error updating session:', error);
      }
    }

    setIsStreaming(false);
    setCurrentSession(null);
    if (isRecording) {
      stopRecording();
    }
    loadVideoSessions();
  };

  const startRecording = async () => {
    if (!videoRef.current?.srcObject) return;

    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        if (currentSession) {
          try {
            await supabase
              .from('video_sessions')
              .update({ recording_url: url })
              .eq('id', currentSession.id);
          } catch (error) {
            console.error('Error saving recording URL:', error);
          }
        }
        
        recordedChunks.current = [];
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Stream recording is now active"
      });
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording Stopped",
        description: "Recording has been saved"
      });
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await supabase
        .from('video_sessions')
        .delete()
        .eq('id', sessionId);
      
      toast({
        title: "Session Deleted",
        description: "Video session has been removed"
      });
      
      loadVideoSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete session",
        variant: "destructive"
      });
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Live Streams</h3>
            <div className="space-y-4">
              {sessions.filter(s => s.is_live).map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{session.title}</h4>
                    <Badge variant="destructive">LIVE</Badge>
                  </div>
                  {session.description && (
                    <p className="text-sm text-muted-foreground">{session.description}</p>
                  )}
                </div>
              ))}
              {sessions.filter(s => s.is_live).length === 0 && (
                <p className="text-muted-foreground">No live streams currently active</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Live Streaming Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isStreaming ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="stream-title">Stream Title</Label>
                <Input
                  id="stream-title"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="Enter stream title"
                />
              </div>
              <div>
                <Label htmlFor="stream-description">Description (Optional)</Label>
                <Textarea
                  id="stream-description"
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
                  placeholder="Enter stream description"
                />
              </div>
              <Button onClick={startStream} className="w-full">
                <Video className="mr-2 h-4 w-4" />
                Start Live Stream
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">LIVE</Badge>
                  <span className="text-sm font-medium">{currentSession?.title}</span>
                </div>
                <div className="flex gap-2">
                  {!isRecording ? (
                    <Button onClick={startRecording} variant="outline" size="sm">
                      <div className="mr-2 h-4 w-4 rounded-full bg-red-500" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button onClick={stopRecording} variant="outline" size="sm">
                      <Square className="mr-2 h-4 w-4" />
                      Stop Recording
                    </Button>
                  )}
                  <Button onClick={stopStream} variant="destructive" size="sm">
                    <VideoOff className="mr-2 h-4 w-4" />
                    End Stream
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Previous Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{session.title}</h4>
                    {session.is_live && <Badge variant="destructive">LIVE</Badge>}
                  </div>
                  {session.description && (
                    <p className="text-sm text-muted-foreground mb-2">{session.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Started: {new Date(session.started_at).toLocaleString()}
                  </p>
                  {session.recording_url && (
                    <a 
                      href={session.recording_url} 
                      download
                      className="text-xs text-primary hover:underline"
                    >
                      Download Recording
                    </a>
                  )}
                </div>
                <Button
                  onClick={() => deleteSession(session.id)}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-muted-foreground text-center">No sessions yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoStream;