import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Users } from "lucide-react";
import ExpandableLiveStream from "./ExpandableLiveStream";

interface VideoSession {
  id: string;
  title: string;
  description: string;
  is_live: boolean;
  started_at: string;
  recording_url?: string;
  created_by_user_id: string;
  profiles?: {
    display_name: string;
  } | null;
}

const LiveStreamViewer = () => {
  const [liveStreams, setLiveStreams] = useState<VideoSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLiveStreams();
    
    // Set up real-time subscription for live streams
    const channel = supabase
      .channel('live-streams')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_sessions',
          filter: 'is_live=eq.true'
        },
        () => {
          loadLiveStreams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLiveStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('video_sessions')
        .select('*')
        .eq('is_live', true)
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      
      // Get creator profiles separately
      const sessionsWithProfiles = await Promise.all(
        (data || []).map(async (session) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', session.created_by_user_id)
            .single();
          
          return {
            ...session,
            profiles: profile || null
          };
        })
      );
      
      setLiveStreams(sessionsWithProfiles);
    } catch (error) {
      console.error('Error loading live streams:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Video className="h-8 w-8 animate-pulse mx-auto mb-4" />
            <p>Loading live streams...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Live Streams
          {liveStreams.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {liveStreams.length} LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {liveStreams.length === 0 ? (
          <div className="text-center py-12">
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Live Streams</h3>
            <p className="text-muted-foreground">There are no active live streams at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {liveStreams.map((stream) => (
              <ExpandableLiveStream
                key={stream.id}
                sessionId={stream.id}
                title={stream.title}
                description={stream.description}
                creatorName={stream.profiles?.display_name || "Unknown User"}
                startedAt={stream.started_at}
                streamUrl={stream.recording_url}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveStreamViewer;