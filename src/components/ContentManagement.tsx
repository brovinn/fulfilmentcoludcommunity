import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Search, AlertTriangle, FileText, MessageSquare, Image } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ContentItem {
  id: string;
  title?: string;
  content_text?: string;
  comment_text?: string;
  created_at: string;
  user_id: string;
  type: 'content' | 'comment' | 'message';
  profiles?: {
    display_name: string;
  };
}

const ContentManagement = () => {
  const { toast } = useToast();
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);

  useEffect(() => {
    loadAllContent();
  }, []);

  useEffect(() => {
    filterContent();
  }, [searchQuery, allContent]);

  const loadAllContent = async () => {
    setLoading(true);
    try {
      // Load all content types
      const [contentData, commentsData, messagesData] = await Promise.all([
        supabase.from('content').select('*').order('created_at', { ascending: false }),
        supabase.from('comments').select('*').order('created_at', { ascending: false }),
        supabase.from('messages').select('*').order('created_at', { ascending: false })
      ]);

      // Get all unique user IDs
      const userIds = new Set<string>();
      contentData.data?.forEach(item => userIds.add(item.user_id));
      commentsData.data?.forEach(item => userIds.add(item.user_id));
      messagesData.data?.forEach(item => userIds.add(item.user_id));

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const combinedContent: ContentItem[] = [
        ...(contentData.data?.map(item => ({ 
          ...item, 
          type: 'content' as const,
          profiles: profileMap.get(item.user_id)
        })) || []),
        ...(commentsData.data?.map(item => ({ 
          ...item, 
          type: 'comment' as const,
          profiles: profileMap.get(item.user_id)
        })) || []),
        ...(messagesData.data?.map(item => ({ 
          ...item, 
          type: 'message' as const, 
          content_text: item.content,
          profiles: profileMap.get(item.user_id)
        })) || [])
      ];

      // Sort by creation date
      combinedContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setAllContent(combinedContent);
      setFilteredContent(combinedContent);
    } catch (error) {
      console.error('Error loading content:', error);
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterContent = () => {
    if (!searchQuery.trim()) {
      setFilteredContent(allContent);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allContent.filter(item => {
      const searchableText = [
        item.title,
        item.content_text,
        item.comment_text,
        item.profiles?.display_name
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableText.includes(query);
    });

    setFilteredContent(filtered);
  };

  const confirmDelete = (item: ContentItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      let tableName: 'content' | 'comments' | 'messages' = 'content';
      switch (itemToDelete.type) {
        case 'content':
          tableName = 'content';
          break;
        case 'comment':
          tableName = 'comments';
          break;
        case 'message':
          tableName = 'messages';
          break;
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      // Log moderation action
      await supabase.from('content_moderation_log').insert({
        target_table: tableName,
        target_id: itemToDelete.id,
        action_type: 'delete',
        reason: 'Administrator removal via content management',
        admin_user_id: (await supabase.auth.getUser()).data.user?.id
      });

      toast({
        title: "Content Deleted",
        description: `${itemToDelete.type} has been removed successfully`,
      });

      // Reload content
      loadAllContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const getContentPreview = (item: ContentItem) => {
    const text = item.title || item.content_text || item.comment_text || '';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content':
        return <FileText className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'message':
        return <Image className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
    switch (type) {
      case 'content':
        return 'default';
      case 'comment':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Content Management & Moderation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search all content, comments, and messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Badge variant="outline">
            {filteredContent.length} items
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {allContent.filter(i => i.type === 'content').length}
              </div>
              <p className="text-xs text-muted-foreground">Content Posts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {allContent.filter(i => i.type === 'comment').length}
              </div>
              <p className="text-xs text-muted-foreground">Comments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {allContent.filter(i => i.type === 'message').length}
              </div>
              <p className="text-xs text-muted-foreground">Messages</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Table */}
        <div className="border rounded-lg">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="w-40">Author</TableHead>
                  <TableHead className="w-36">Created</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading content...
                    </TableCell>
                  </TableRow>
                ) : filteredContent.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No content found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContent.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(item.type)} className="flex items-center gap-1">
                          {getTypeIcon(item.type)}
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm line-clamp-2">{getContentPreview(item)}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.profiles?.display_name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => confirmDelete(item)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {itemToDelete?.type} 
              and remove it from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ContentManagement;
