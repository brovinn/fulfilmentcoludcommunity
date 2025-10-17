import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Index from "./Index";
import VideoStream from "@/components/VideoStream";
import AdminMonitoring from "@/components/AdminMonitoring";
import LiveStreamViewer from "@/components/LiveStreamViewer";
import LiveStreamWithControls from "@/components/LiveStreamWithControls";
import ContentManagement from "@/components/ContentManagement";
import { ContributeTab } from "@/components/ContributeTab";

const MainApp = () => {
  const { user } = useAuth();
  const [userLevel, setUserLevel] = useState<string>("saint");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      getUserLevel();
      checkAdminStatus();
    }
  }, [user]);

  const getUserLevel = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('security_questionnaires')
        .select('church_level')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data && !error) {
        setUserLevel(data.church_level);
      }
    } catch (error) {
      console.error('Error getting user level:', error);
    }
  };

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('is_admin', {
        _user_id: user.id
      });
      if (!error) {
        setIsAdmin(data);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  // Saint level users see limited interface
  if (userLevel === "saint") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-6">
          <Tabs defaultValue="home" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="contribute">Contribute</TabsTrigger>
            </TabsList>
            
            <TabsContent value="home" className="mt-6">
              <div className="space-y-6">
                <Index />
                <LiveStreamViewer />
              </div>
            </TabsContent>
            
            <TabsContent value="projects" className="mt-6">
              <Index />
            </TabsContent>
            
            <TabsContent value="updates" className="mt-6">
              <Index />
            </TabsContent>
            
            <TabsContent value="chat" className="mt-6">
              <div className="text-center p-8">
                <h2 className="text-2xl font-bold mb-4">Community Chat</h2>
                <p className="text-muted-foreground">Chat features will be available here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="contribute" className="mt-6">
              <ContributeTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Admin level users see full interface with Admin Monitor
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="live">Live Stream</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="contribute">Contribute</TabsTrigger>
            {isAdmin && <TabsTrigger value="monitoring">Admin Monitor</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="home" className="mt-6">
            <div className="space-y-6">
              <Index />
              <LiveStreamViewer />
            </div>
          </TabsContent>
          
          <TabsContent value="live" className="mt-6">
            <div className="space-y-6">
              {isAdmin && <LiveStreamWithControls isHost={true} title="Administrator Live Stream" />}
              <VideoStream />
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="mt-6">
            <ContentManagement />
          </TabsContent>
          
          <TabsContent value="contribute" className="mt-6">
            <ContributeTab />
          </TabsContent>
          
          {isAdmin && (
            <TabsContent value="monitoring" className="mt-6">
              <AdminMonitoring />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default MainApp;