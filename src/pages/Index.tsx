import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ContentUpload } from "@/components/ContentUpload";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { CommunityChat } from "@/components/CommunityChat";
import ReelsFeed from "@/components/ReelsFeed";
import CommentModal from "@/components/CommentModal";
import { StoryFeed } from "@/components/StoryFeed";
import VideoStream from "@/components/VideoStream";
import AdminMonitoring from "@/components/AdminMonitoring";
import LiveStreamViewer from "@/components/LiveStreamViewer";
import LiveStreamRecorder from "@/components/LiveStreamRecorder";
import Auth from "./Auth";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Download, Heart, MessageCircle, Clock, Calendar, Users, Upload, Plus, MoreHorizontal, Globe } from "lucide-react";

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
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLevel, setUserLevel] = useState<string>("saint");
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
  const [facebookUrl, setFacebookUrl] = useState("https://www.facebook.com/fulfilmentcentre/");
  const [isImporting, setIsImporting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadContent();
    if (user) {
      loadLikes();
      checkAdminStatus();
      getUserLevel();
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
        .maybeSingle();
      
      if (data && !error) {
        setUserLevel(data.church_level);
        // Set admin based on church level
        setIsAdmin(data.church_level === 'administrator');
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
      if (!error && data) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const groupedContent = data.reduce((acc, item) => {
        if (!acc[item.tab_type]) acc[item.tab_type] = [];
        acc[item.tab_type].push(item);
        return acc;
      }, {} as { [key: string]: ContentItem[] });

      setContent(groupedContent);
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  const loadLikes = async () => {
    try {
      // Get all likes count
      const { data: likesData } = await supabase
        .from('content')
        .select('id, content_likes:content_likes(count)')
        .not('content_likes', 'is', null);

      // Get user's likes
      const { data: userLikesData } = await supabase
        .from('content_likes')
        .select('content_id')
        .eq('user_id', user?.id);

      if (likesData) {
        const likesCount = likesData.reduce((acc, item) => {
          acc[item.id] = item.content_likes?.[0]?.count || 0;
          return acc;
        }, {} as { [key: string]: number });
        setLikes(likesCount);
      }

      if (userLikesData) {
        setUserLikes(new Set(userLikesData.map(like => like.content_id)));
      }
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const toggleLike = async (contentId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like content",
        variant: "destructive",
      });
      return;
    }

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
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Download started",
        description: `Downloading ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const getFileExtension = (url: string) => {
    return url.split('.').pop()?.toLowerCase() || '';
  };

  const getFileName = (title: string, url: string) => {
    const extension = getFileExtension(url);
    return `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
  };

  const handleCommentClick = (contentId: string) => {
    setSelectedContentId(contentId);
    setCommentModalOpen(true);
  };

  const importFacebookFeed = async () => {
    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('facebook-import', {
        body: { facebookUrl }
      });

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `Imported ${data.imported} items from Facebook`,
      });

      // Reload content to show imported items
      loadContent();
    } catch (error) {
      console.error('Error importing Facebook feed:', error);
      toast({
        title: "Import failed",
        description: "Failed to import Facebook feed",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const ContentList = ({ tabType }: { tabType: string }) => (
    <div className="space-y-4">
      {content[tabType]?.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {item.title}
              {item.image_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(item.image_url!, getFileName(item.title, item.image_url!))}
                  className="ml-2"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              )}
            </CardTitle>
            {item.description && <CardDescription>{item.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            {item.content_text && <p className="mb-4 whitespace-pre-wrap">{item.content_text}</p>}
            {item.image_url && (user || !item.image_url.includes('private')) && (
              <div className="mb-4">
                {/* Handle different file types */}
                {item.image_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <div className="relative">
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      className="w-full max-w-md rounded-lg border"
                      onError={(e) => {
                        console.error('Image failed to load:', item.image_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : item.image_url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <div className="relative">
                    <video 
                      controls 
                      className="w-full max-w-md rounded-lg border"
                      onError={(e) => {
                        console.error('Video failed to load:', item.image_url);
                      }}
                    >
                      <source src={item.image_url} />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : item.image_url.match(/\.(mp3|wav|ogg|m4a)$/i) ? (
                  <div className="relative">
                    {/* Generate album cover for audio files */}
                    <div className="w-full max-w-md bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-lg p-6 mb-4">
                      <div className="text-center text-white">
                        <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M18 3a1 1 0 00-1.196-.98L7 3.75V13.5a2.5 2.5 0 11-2-2.45V2a1 1 0 011.196-.98L17 2.75A1 1 0 0118 3.75v7.5a2.5 2.5 0 11-2-2.45V3z"/>
                          </svg>
                        </div>
                        <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                        <p className="text-sm opacity-80">{item.description || "Audio Track"}</p>
                        <div className="mt-4 text-xs opacity-60">
                          {new Date(item.created_at).getFullYear()} • Fulfilment Centre
                        </div>
                      </div>
                    </div>
                    <audio 
                      controls 
                      className="w-full max-w-md"
                      onError={(e) => {
                        console.error('Audio failed to load:', item.image_url);
                      }}
                    >
                      <source src={item.image_url} />
                      Your browser does not support the audio tag.
                    </audio>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg bg-muted">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Uploaded file:</p>
                        <p className="font-medium">{item.title}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(item.image_url!, getFileName(item.title, item.image_url!))}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
              </p>
              {user && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this content?')) {
                        try {
                          const { error } = await supabase
                            .from('content')
                            .delete()
                            .eq('id', item.id);
                          
                          if (error) throw error;
                          
                          toast({
                            title: "Content deleted",
                            description: "Content has been removed successfully",
                          });
                          
                          loadContent();
                        } catch (error) {
                          toast({
                            title: "Delete failed",
                            description: "Failed to delete content",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )) || (
        <div className="text-center py-8 text-muted-foreground">
          No content available yet. Be the first to upload!
        </div>
      )}
    </div>
  );

  // Show auth page if requested
  if (showAuth) {
    return <Auth />;
  }

  return (
      <div className="min-h-screen bg-background" style={{
        backgroundImage: "url('/lovable-uploads/caf7ba3d-0c2a-4ed0-af59-329e325e12fb.png')",
        backgroundSize: "200px",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "top right",
        backgroundAttachment: "fixed",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backgroundBlendMode: "overlay"
      }}>
        {/* Header */}
        <header className="border-b bg-card/95 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src="/lovable-uploads/caf7ba3d-0c2a-4ed0-af59-329e325e12fb.png" 
                  alt="Fulfilment Centre Logo" 
                  className="h-12 w-auto"
                />
                <div>
                  <h1 className="text-3xl font-bold text-primary">Fulfilment Centre</h1>
                  <p className="text-muted-foreground mt-1">Building community, creating impact</p>
                </div>
              </div>
              
              {/* Auth controls */}
              <div className="flex items-center gap-2">
                {user ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      Welcome back, {user.email}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={() => supabase.auth.signOut()}
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setShowAuth(true)}>
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-8' : 'grid-cols-6'}`}>
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
              <TabsTrigger value="posts">Chat</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="contribute">Contribute</TabsTrigger>
              {isAdmin && <TabsTrigger value="livestream">Live Stream</TabsTrigger>}
              {isAdmin && <TabsTrigger value="monitoring">Admin Monitor</TabsTrigger>}
            </TabsList>

            {/* Home Tab - Reels Feed */}
            <TabsContent value="home" className="space-y-6">
              {/* Stories Section */}
              <StoryFeed />
              
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Community Reels</h2>
                {user ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Reel
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <ContentUpload tabType="home" onUploadSuccess={loadContent} />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button onClick={() => setShowAuth(true)}>
                    Sign In to Create
                  </Button>
                )}
              </div>
              
              {!user && (
                <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Join Our Community Reels</h3>
                      <p className="text-muted-foreground mb-4">
                        Sign in to create reels, like content, and comment on community content
                      </p>
                      <Button onClick={() => setShowAuth(true)} className="bg-gradient-to-r from-primary to-accent text-white hover:opacity-90">
                        Get Started
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Live Stream Viewer and Recorder for all users */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Live Stream</CardTitle>
                    <CardDescription>Watch live community events and broadcasts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LiveStreamViewer />
                  </CardContent>
                </Card>
                
                <LiveStreamRecorder />
              </div>

              {/* Reels Feed */}
              <ReelsFeed onCommentClick={handleCommentClick} />
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Community Projects</h2>
                {user ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <ContentUpload tabType="projects" onUploadSuccess={loadContent} />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button onClick={() => setShowAuth(true)}>
                    Sign In to Post
                  </Button>
                )}
              </div>
              <ContentList tabType="projects" />
            </TabsContent>

            {/* Updates Tab */}
            <TabsContent value="updates" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Latest Updates</h2>
                {user ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Post Update
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <ContentUpload tabType="updates" onUploadSuccess={loadContent} />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button onClick={() => setShowAuth(true)}>
                    Sign In to Post
                  </Button>
                )}
              </div>
              <ContentList tabType="updates" />
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="posts" className="space-y-6">
              {user ? (
                <CommunityChat />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Community Chat
                    </CardTitle>
                    <CardDescription>Connect with fellow community members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Join the conversation! Sign in to participate in community chat.
                      </p>
                      <Button onClick={() => setShowAuth(true)}>
                        Sign In to Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* History Tab - Facebook Import */}
            <TabsContent value="history" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Community History</h2>
                <div className="flex gap-2">
                  {user && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="mr-2 h-4 w-4" />
                          Add History
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <ContentUpload tabType="history" onUploadSuccess={loadContent} />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {/* Facebook Import Section */}
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Import from Facebook
                  </CardTitle>
                  <CardDescription>
                    Import content from your Facebook page to preserve community history
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      placeholder="https://www.facebook.com/fulfilmentcentre/"
                      className="flex-1"
                    />
                    <Button 
                      onClick={importFacebookFeed}
                      disabled={isImporting || !facebookUrl}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isImporting ? 'Importing...' : 'Import Feed'}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This will import recent content from the specified Facebook page into your community history.
                  </p>
                </CardContent>
              </Card>

              <ContentList tabType="history" />
            </TabsContent>

            {/* Contribute Tab */}
            <TabsContent value="contribute" className="space-y-6">
              {user ? (
                <div className="space-y-6">
                  {/* Security Notice */}
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardHeader>
                      <CardTitle className="text-amber-800">Secure Donation Portal</CardTitle>
                      <CardDescription className="text-amber-700">
                        All transactions are encrypted and verified. Your financial information is protected.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {/* Banking Requirements */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Banking & Security Requirements</CardTitle>
                      <CardDescription>
                        Please review these requirements before proceeding with your donation
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="font-semibold mb-2">Required Information</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Valid government-issued ID</li>
                            <li>• Bank account verification</li>
                            <li>• Billing address confirmation</li>
                            <li>• Phone number verification</li>
                            <li>• Email address confirmation</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Security Measures</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• SSL/TLS encryption (256-bit)</li>
                            <li>• PCI DSS compliance</li>
                            <li>• Two-factor authentication</li>
                            <li>• Fraud detection monitoring</li>
                            <li>• Regular security audits</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Anti-Money Laundering (AML) Compliance</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          In accordance with financial regulations, we are required to:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Verify donor identity for transactions over $100</li>
                          <li>• Report suspicious transactions to relevant authorities</li>
                          <li>• Maintain transaction records for regulatory purposes</li>
                          <li>• Perform enhanced due diligence for high-value donations</li>
                        </ul>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Acceptable Payment Methods</h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          <div>
                            <p className="text-sm font-medium text-green-700">✓ Accepted:</p>
                            <ul className="text-sm text-muted-foreground">
                              <li>• Major credit/debit cards</li>
                              <li>• Bank transfers (ACH)</li>
                              <li>• PayPal verified accounts</li>
                              <li>• Wire transfers (for large amounts)</li>
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-red-700">✗ Not Accepted:</p>
                            <ul className="text-sm text-muted-foreground">
                              <li>• Cryptocurrency</li>
                              <li>• Cash or money orders</li>
                              <li>• Prepaid cards</li>
                              <li>• Anonymous transfers</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Heart className="h-5 w-5 text-accent" />
                          Support Our Mission
                        </CardTitle>
                        <CardDescription>Help us continue building an amazing community</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">
                          Your donations help us maintain our community spaces, support projects, 
                          and create opportunities for growth and collaboration.
                        </p>
                        <div className="space-y-2">
                          <h5 className="font-semibold">Donation Impact:</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• $25 - Sponsors one community event</li>
                            <li>• $50 - Supports project materials</li>
                            <li>• $100 - Funds workshop equipment</li>
                            <li>• $250+ - Enables major initiatives</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                    <PaymentMethodSelector />
                  </div>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-accent" />
                      Secure Donations
                    </CardTitle>
                    <CardDescription>Support our community with verified, secure donations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Heart className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
                      <p className="text-muted-foreground mb-4">
                        For security and compliance reasons, you must be signed in to make donations. 
                        This helps us verify your identity and protect against fraud.
                      </p>
                      <Button onClick={() => setShowAuth(true)} className="mb-4">
                        Sign In to Donate
                      </Button>
                      <div className="text-xs text-muted-foreground">
                        <p>🔒 SSL Encrypted • PCI Compliant • AML Verified</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Live Stream Tab - Admin Only */}
            {isAdmin && (
              <TabsContent value="livestream" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">Live Stream Management</h2>
                </div>
                <VideoStream />
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Live Stream Viewer</h3>
                  <LiveStreamViewer />
                </div>
              </TabsContent>
            )}

            {/* Admin Monitoring Tab - Admin Only */}
            {isAdmin && (
              <TabsContent value="monitoring" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">Admin Monitoring</h2>
                </div>
                <AdminMonitoring />
              </TabsContent>
            )}
          </Tabs>

        </main>

        {/* Comment Modal */}
        <CommentModal
          isOpen={commentModalOpen}
          onClose={() => setCommentModalOpen(false)}
          contentId={selectedContentId || ''}
        />
      </div>
  );
};

export default Index;
