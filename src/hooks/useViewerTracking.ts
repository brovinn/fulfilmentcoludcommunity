import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Viewer {
  user_id: string;
  display_name: string;
  is_admin: boolean;
  online_at: string;
}

export const useViewerTracking = (sessionId: string | undefined) => {
  const { user } = useAuth();
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`viewers_${sessionId}`, {
      config: {
        presence: {
          key: user?.id || `anonymous_${crypto.randomUUID()}`,
        },
      },
    });

    // Handle presence sync
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const viewerList: Viewer[] = [];
      
      Object.entries(state).forEach(([, presences]) => {
        const presence = presences[0] as any;
        if (presence) {
          viewerList.push({
            user_id: presence.user_id || 'anonymous',
            display_name: presence.display_name || 'Anonymous',
            is_admin: presence.is_admin || false,
            online_at: presence.online_at,
          });
        }
      });
      
      setViewers(viewerList);
      setViewerCount(viewerList.length);
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        let displayName = 'Anonymous';
        let isAdmin = false;

        if (user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', user.id)
            .single();

          displayName = profile?.display_name || user.email?.split('@')[0] || 'Anonymous';

          // Check if admin
          const { data: adminStatus } = await supabase.rpc('is_admin', { _user_id: user.id });
          isAdmin = adminStatus || false;
        }

        await channel.track({
          user_id: user?.id || 'anonymous',
          display_name: displayName,
          is_admin: isAdmin,
          online_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, user]);

  return { viewers, viewerCount };
};
