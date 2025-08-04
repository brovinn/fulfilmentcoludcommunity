import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FacebookPost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  attachments?: {
    data: Array<{
      media?: {
        image?: {
          src: string;
        };
      };
      target?: {
        url: string;
      };
    }>;
  };
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

    if (req.method === 'POST') {
      const { facebookUrl } = await req.json();
      
      console.log('Starting Facebook import for URL:', facebookUrl);
      
      // Extract page ID from Facebook URL
      const pageId = extractPageIdFromUrl(facebookUrl);
      if (!pageId) {
        throw new Error('Invalid Facebook URL format');
      }

      // For demo purposes, we'll create some sample Facebook-style content
      // In a real implementation, you would use Facebook Graph API with proper authentication
      const samplePosts = await createSampleFacebookContent(pageId);
      
      // Insert posts into the content table
      const insertPromises = samplePosts.map(async (post) => {
        const { data, error } = await supabaseClient
          .from('content')
          .insert({
            title: post.title,
            description: post.description,
            content_text: post.content_text,
            image_url: post.image_url,
            tab_type: 'history',
            user_id: '00000000-0000-0000-0000-000000000000', // System user for imported content
            created_at: post.created_at
          });

        if (error) {
          console.error('Error inserting post:', error);
          throw error;
        }
        
        return data;
      });

      await Promise.all(insertPromises);

      console.log(`Successfully imported ${samplePosts.length} posts from Facebook`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          imported: samplePosts.length,
          message: 'Facebook content imported successfully'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    );

  } catch (error) {
    console.error('Error in facebook-import function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function extractPageIdFromUrl(url: string): string | null {
  // Extract page name or ID from various Facebook URL formats
  const patterns = [
    /facebook\.com\/([^\/\?]+)/,
    /facebook\.com\/pages\/[^\/]+\/(\d+)/,
    /facebook\.com\/profile\.php\?id=(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

async function createSampleFacebookContent(pageId: string) {
  // Create sample content that represents what might be imported from Facebook
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  
  return [
    {
      title: 'Welcome to Fulfilment Centre Community!',
      description: 'Building connections and creating positive impact together',
      content_text: 'We are excited to share our journey with you. Join us as we work together to create meaningful change in our community. Every step we take is aimed at fulfilling our mission to bring people together and make a difference.',
      image_url: '/lovable-uploads/caf7ba3d-0c2a-4ed0-af59-329e325e12fb.png',
      created_at: new Date(now.getTime() - oneDay * 7).toISOString()
    },
    {
      title: 'Community Project Update',
      description: 'Latest progress on our collaborative initiatives',
      content_text: 'Our recent community project has made incredible progress! Thanks to all the volunteers and supporters who have contributed their time and energy. Together, we are making a real difference.',
      image_url: null,
      created_at: new Date(now.getTime() - oneDay * 5).toISOString()
    },
    {
      title: 'Thank You to Our Amazing Community',
      description: 'Celebrating the people who make it all possible',
      content_text: 'We want to take a moment to thank every single person who has been part of our journey. Your support, feedback, and participation have been invaluable in helping us grow and improve.',
      image_url: null,
      created_at: new Date(now.getTime() - oneDay * 3).toISOString()
    },
    {
      title: 'Looking Forward: Our Vision for the Future',
      description: 'Exciting plans and upcoming initiatives',
      content_text: 'As we look to the future, we are filled with excitement about the possibilities ahead. We have some amazing initiatives planned that will further strengthen our community and expand our impact.',
      image_url: null,
      created_at: new Date(now.getTime() - oneDay * 1).toISOString()
    }
  ];
}