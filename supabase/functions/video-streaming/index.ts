import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, sessionId, streamData } = await req.json();

    switch (action) {
      case 'start_stream':
        // Create new streaming session
        const { data: session, error: sessionError } = await supabase
          .from('video_sessions')
          .insert({
            title: streamData.title,
            description: streamData.description,
            stream_key: `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            is_live: true,
            started_at: new Date().toISOString(),
            created_by_user_id: streamData.userId
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        console.log('Stream session created:', session);
        
        return new Response(JSON.stringify({ 
          success: true, 
          session,
          streamUrl: `wss://stream.server/${session.stream_key}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'end_stream':
        // End streaming session
        const { error: endError } = await supabase
          .from('video_sessions')
          .update({
            is_live: false,
            ended_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (endError) throw endError;

        console.log('Stream session ended:', sessionId);
        
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Stream ended successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'save_recording':
        // Save recording URL
        const { recordingUrl } = streamData;
        const { error: recordingError } = await supabase
          .from('video_sessions')
          .update({ recording_url: recordingUrl })
          .eq('id', sessionId);

        if (recordingError) throw recordingError;

        console.log('Recording saved for session:', sessionId);
        
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Recording saved successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_live_streams':
        // Get all live streams
        const { data: liveStreams, error: liveError } = await supabase
          .from('video_sessions')
          .select(`
            *,
            profiles!video_sessions_created_by_user_id_fkey(display_name)
          `)
          .eq('is_live', true)
          .order('started_at', { ascending: false });

        if (liveError) throw liveError;

        return new Response(JSON.stringify({ 
          success: true, 
          streams: liveStreams 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        return new Response(JSON.stringify({ 
          error: 'Invalid action' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in video-streaming function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});