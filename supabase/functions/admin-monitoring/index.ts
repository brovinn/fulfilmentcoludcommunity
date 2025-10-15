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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user');
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', {
      _user_id: user.id
    });

    if (adminError || !isAdmin) {
      throw new Error('Admin access required');
    }

    const { action, tableName, recordId, reason } = await req.json();

    switch (action) {
      case 'delete_content': {
        // Delete any content and log the action
        const tables = ['content', 'comments', 'messages', 'donations', 'profiles'];
        
        if (!tables.includes(tableName)) {
          throw new Error('Invalid table name');
        }

        // Delete the record
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('id', recordId);

        if (deleteError) throw deleteError;

        // Log the moderation action
        const { error: logError } = await supabase
          .from('content_moderation_log')
          .insert({
            admin_user_id: user.id,
            action_type: `delete_${tableName}`,
            target_table: tableName,
            target_id: recordId,
            reason: reason || 'Administrator deletion'
          });

        if (logError) throw logError;

        console.log(`Admin ${user.id} deleted ${tableName} record ${recordId}`);
        
        return new Response(JSON.stringify({ 
          success: true,
          message: `Record deleted from ${tableName}`,
          action: 'delete_content'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_all_data': {
        // Get normalized view of all data
        const allData: Record<string, unknown[]> = {};
        const dataQueries = [
          { table: 'profiles', query: 'id, user_id, display_name, created_at' },
          { table: 'content', query: 'id, title, user_id, tab_type, status, created_at' },
          { table: 'messages', query: 'id, content, user_id, channel, created_at' },
          { table: 'comments', query: 'id, comment_text, user_id, content_id, created_at' },
          { table: 'donations', query: 'id, amount, currency, status, donor_email, created_at' },
          { table: 'security_questionnaires', query: 'id, user_id, user_name, church_level, created_at' },
          { table: 'video_sessions', query: 'id, title, created_by_user_id, is_live, created_at' },
          { table: 'content_moderation_log', query: 'id, admin_user_id, action_type, target_table, created_at' }
        ];

        for (const { table, query } of dataQueries) {
          try {
            const { data, error } = await supabase
              .from(table)
              .select(query)
              .order('created_at', { ascending: false })
              .limit(100);

            if (error) {
              console.error(`Error fetching ${table}:`, error);
              allData[table] = [];
            } else {
              allData[table] = data || [];
            }
          } catch (e) {
            console.error(`Error fetching ${table}:`, e);
            allData[table] = [];
          }
        }

        return new Response(JSON.stringify({ 
          success: true,
          data: allData,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_transaction_details': {
        // Get transaction details from donations
        const { data: transactions, error: transError } = await supabase
          .from('donations')
          .select(`
            id,
            amount,
            currency,
            status,
            donor_email,
            first_name,
            last_name,
            country,
            stripe_session_id,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(200);

        if (transError) throw transError;

        // Calculate statistics
        const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const successfulTransactions = transactions.filter(t => t.status === 'completed');
        const pendingTransactions = transactions.filter(t => t.status === 'pending');

        return new Response(JSON.stringify({ 
          success: true,
          transactions,
          statistics: {
            total_transactions: transactions.length,
            total_amount: totalAmount,
            successful_count: successfulTransactions.length,
            pending_count: pendingTransactions.length,
            currencies: [...new Set(transactions.map(t => t.currency))],
            countries: [...new Set(transactions.map(t => t.country).filter(Boolean))]
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ 
          error: 'Invalid action' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in admin-monitoring function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});