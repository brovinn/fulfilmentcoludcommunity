import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommentData {
  content_id: string;
  comment_text: string;
  user_id?: string;
  parent_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const contentId = url.searchParams.get('content_id');
      
      if (!contentId) {
        return new Response(
          JSON.stringify({ error: 'content_id parameter required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Fetch comments for the content
      const { data: comments, error } = await supabaseClient
        .from('comments')
        .select(`
          id,
          comment_text,
          created_at,
          parent_id,
          profiles!inner (
            display_name,
            avatar_url
          )
        `)
        .eq('content_id', contentId)
        .order('created_at', { ascending: true });

      // Get comment count
      const { count: commentCount } = await supabaseClient
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('content_id', contentId);

      if (error) {
        console.error('Error fetching comments:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch comments' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ comments, commentCount: commentCount || 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'POST') {
      const commentData: CommentData = await req.json();
      
      if (!commentData.content_id || !commentData.comment_text?.trim()) {
        return new Response(
          JSON.stringify({ error: 'content_id and comment_text are required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Insert the comment
      const { data: comment, error } = await supabaseClient
        .from('comments')
        .insert({
          content_id: commentData.content_id,
          comment_text: commentData.comment_text.trim(),
          user_id: user.id,
          parent_id: commentData.parent_id || null
        })
        .select(`
          id,
          comment_text,
          created_at,
          parent_id,
          profiles!inner (
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error creating comment:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create comment' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ comment }),
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});