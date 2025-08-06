import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ContentUpload } from "@/components/ContentUpload";
import ReelsFeed from "@/components/ReelsFeed";
import CommentModal from "@/components/CommentModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Download, Heart, MessageCircle, Clock, Calendar, Users, Upload, Plus, MoreHorizontal, Globe, LogOut } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  content_text: string | null;
  image_url: string | null;
  created_at: string;
  tab_type: string;
  user_id: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [content, setContent] = useState<{ [key: string]: ContentItem[] }>({
    home: [],
    projects: [],
    updates: [],
    history: []
  });
  const [likes, setLikes] = useState<{ [key: string]: number }>({});
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [facebookUrl, setFacebookUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadContent();
    if (user) {
      loadLikes();
    }
  }, [user]);

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const userIds = [...new Set(data.map(item => item.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        const contentWithProfiles = data.map(item => ({
          ...item,
          profiles: profiles?.find(p => p.user_id === item.user_id) || {
            display_name: 'Unknown User',
            avatar_url: null
          }
        }));

        const groupedContent: { [key: string]: ContentItem[] } = {
          home: [],
          projects: [],
          updates: [],
          history: []
        };

        contentWithProfiles?.forEach((item) => {
          if (groupedContent[item.tab_type]) {
            groupedContent[item.tab_type].push(item);
          }
        });

        setContent(groupedContent);
      }

      if (error) throw error;
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  const loadLikes = async () => {
    try {
      const { data: userLikesData } = await supabase
        .from('content_likes')
        .select('content_id')
        .eq('user_id', user?.id);

      if (userLikesData) {
        setUserLikes(new Set(userLikesData.map(like => like.content_id)));
      }

      const { data: likeCounts } = await supabase
        .from('content_likes')
        .select('content_id');

      if (likeCounts) {
        const counts: { [key: string]: number } = {};
        likeCounts.forEach(like => {
          counts[like.content_id] = (counts[like.content_id] || 0) + 1;
        });
        setLikes(counts);
      }
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const handleLike = async (contentId: string) => {
    if (!user) return;

    try {
      const isLiked = userLikes.has(contentId);

      if (isLiked) {
        await supabase
          .from('content_likes')
          .delete()
          .eq('content_id', contentId)
          .eq('user_id', user.id);

        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(contentId);
          return newSet;
        });
        setLikes(prev => ({ ...prev, [contentId]: (prev[contentId] || 1) - 1 }));
      } else {
        await supabase
          .from('content_likes')
          .insert({ content_id: contentId, user_id: user.id });

        setUserLikes(prev => new Set([...prev, contentId]));
        setLikes(prev => ({ ...prev, [contentId]: (prev[contentId] || 0) + 1 }));
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleCommentClick = (contentId: string) => {
    setSelectedContentId(contentId);
    setCommentModalOpen(true);
  };

  const handleFacebookImport = async () => {
    if (!facebookUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Facebook URL",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('facebook-import', {
        body: { facebookUrl },
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Imported ${data.imported} items from Facebook`,
      });
      
      setFacebookUrl("");
      loadContent();
    } catch (error: any) {
      console.error('Error importing from Facebook:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to import from Facebook",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const renderContentList = (items: ContentItem[]) => (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={item.profiles?.avatar_url || ""} />
                  <AvatarFallback>
                    {item.profiles?.display_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    by {item.profiles?.display_name || "Unknown User"} • {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {item.description && (
              <CardDescription className="mb-2">{item.description}</CardDescription>
            )}
            {item.content_text && (
              <p className="mb-3">{item.content_text}</p>
            )}
            {item.image_url && (
              <img 
                src={item.image_url} 
                alt={item.title}
                className="w-full max-h-64 object-cover rounded-md mb-3"
              />
            )}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(item.id)}
                className={userLikes.has(item.id) ? "text-red-500" : ""}
              >
                <Heart className={`h-4 w-4 mr-1 ${userLikes.has(item.id) ? "fill-current" : ""}`} />
                {likes[item.id] || 0}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCommentClick(item.id)}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Fulfilment Community</h1>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
              <AvatarFallback>
                {user?.user_metadata?.display_name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2">
              <Dialog open={showUpload} onOpenChange={setShowUpload}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <ContentUpload 
                    tabType={activeTab} 
                    onUploadSuccess={() => {
                      setShowUpload(false);
                      loadContent();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <TabsContent value="home" className="space-y-6">
            <ReelsFeed onCommentClick={handleCommentClick} />
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            {renderContentList(content.projects)}
          </TabsContent>

          <TabsContent value="updates" className="space-y-6">
            {renderContentList(content.updates)}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Import from Facebook</CardTitle>
                <CardDescription>
                  Import your Facebook content to preserve your community history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter Facebook page URL"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                  />
                  <Button onClick={handleFacebookImport} disabled={importing}>
                    {importing ? "Importing..." : "Import"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            {renderContentList(content.history)}
          </TabsContent>
        </Tabs>
      </div>

      <CommentModal
        isOpen={commentModalOpen}
        onClose={() => {
          setCommentModalOpen(false);
          setSelectedContentId(null);
        }}
        contentId={selectedContentId}
      />
    </div>
  );
};

export default Index;
