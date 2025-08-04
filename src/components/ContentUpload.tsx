import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ContentUploadProps {
  tabType: string;
  onUploadSuccess: () => void;
}

export const ContentUpload = ({ tabType, onUploadSuccess }: ContentUploadProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let imageUrl = null;

      // Upload file if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('content-uploads')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('content-uploads')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Insert content
      const { error: insertError } = await supabase
        .from('content')
        .insert({
          title,
          description,
          content_text: content,
          image_url: imageUrl,
          tab_type: tabType,
          user_id: user.id,
        });

      if (insertError) throw insertError;

      // Reset form
      setTitle("");
      setDescription("");
      setContent("");
      setFile(null);
      
      toast({
        title: "Success",
        description: "Content uploaded successfully!",
      });
      
      onUploadSuccess();
    } catch (error: any) {
      console.error('Error uploading content:', error);
      setError(error.message || 'Failed to upload content');
    } finally {
      setLoading(false);
    }
  };

  const getUserProfile = async () => {
    if (!user) return null;
    
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', user.id)
      .single();
    
    return data;
  };

  const [userProfile, setUserProfile] = useState<any>(null);

  useState(() => {
    if (user) {
      getUserProfile().then(setUserProfile);
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={userProfile?.avatar_url || user?.user_metadata?.avatar_url || ""} />
            <AvatarFallback>
              {userProfile?.display_name?.charAt(0) || user?.user_metadata?.display_name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">
              Create New {tabType === 'home' ? 'Reel' : 'Post'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Posting as {userProfile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">
              {tabType === 'home' ? 'Video/Image' : 'Image'} (Optional)
            </Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept={tabType === 'home' ? "image/*,video/*" : "image/*"}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {tabType === 'home' ? 'Reel' : 'Content'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};