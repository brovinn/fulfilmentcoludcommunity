import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Video, VideoOff, Download, Play, Square } from "lucide-react";

const LiveStreamRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);
        setRecordedChunks([blob]);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Live stream recording has begun.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: "Could not start recording. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording Stopped",
        description: "Live stream recording has been saved.",
      });
    }
  };

  const downloadRecording = () => {
    if (recordingUrl) {
      const a = document.createElement('a');
      a.href = recordingUrl;
      a.download = `livestream-recording-${new Date().toISOString().slice(0, 19)}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "Recording is being downloaded to your device.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Live Stream Recorder
        </CardTitle>
        <CardDescription>
          Record live streams from administrators for later viewing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {!isRecording ? (
            <Button onClick={startRecording} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start Recording
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              Stop Recording
            </Button>
          )}
          
          {recordingUrl && (
            <Button onClick={downloadRecording} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Recording
            </Button>
          )}
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 text-red-500">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Recording in progress...</span>
          </div>
        )}

        {recordingUrl && (
          <div className="mt-4">
            <video 
              src={recordingUrl} 
              controls 
              className="w-full rounded-md border"
              style={{ maxHeight: '300px' }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveStreamRecorder;