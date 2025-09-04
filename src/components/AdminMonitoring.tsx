import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Trash2, 
  Users, 
  MessageSquare, 
  FileText, 
  Heart, 
  DollarSign,
  Shield,
  Video
} from "lucide-react";
import TransactionDetails from "./TransactionDetails";

interface TableData {
  [key: string]: any;
}

const AdminMonitoring = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [tableData, setTableData] = useState<Record<string, TableData[]>>({});
  const [loading, setLoading] = useState(true);

  const tables = [
    { name: 'profiles', icon: Users, color: 'bg-blue-500' },
    { name: 'messages', icon: MessageSquare, color: 'bg-green-500' },
    { name: 'content', icon: FileText, color: 'bg-purple-500' },
    { name: 'comments', icon: MessageSquare, color: 'bg-orange-500' },
    { name: 'content_likes', icon: Heart, color: 'bg-red-500' },
    { name: 'message_likes', icon: Heart, color: 'bg-pink-500' },
    { name: 'donations', icon: DollarSign, color: 'bg-yellow-500' },
    { name: 'security_questionnaires', icon: Shield, color: 'bg-indigo-500' },
    { name: 'video_sessions', icon: Video, color: 'bg-cyan-500' },
    { name: 'user_roles', icon: Users, color: 'bg-gray-500' },
    { name: 'content_moderation_log', icon: Shield, color: 'bg-red-600' }
  ];

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadAllTableData();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('is_admin', {
        _user_id: user.id
      });
      if (error) throw error;
      setIsAdmin(data);
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllTableData = async () => {
    setLoading(true);
    
    try {
      const response = await supabase.functions.invoke('admin-monitoring', {
        body: { action: 'get_all_data' }
      });

      if (response.error) throw response.error;
      
      const result = await response.data;
      if (result.success) {
        setTableData(result.data);
      } else {
        throw new Error('Failed to load data');
      }
    } catch (error) {
      console.error('Error loading all table data:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load monitoring data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (tableName: string, recordId: string) => {
    try {
      const response = await supabase.functions.invoke('admin-monitoring', {
        body: { 
          action: 'delete_content',
          tableName,
          recordId,
          reason: 'Administrator deletion via monitoring panel'
        }
      });

      if (response.error) throw response.error;
      
      const result = await response.data;
      if (result.success) {
        toast({
          title: "Record Deleted",
          description: result.message
        });
        loadAllTableData();
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete record",
        variant: "destructive"
      });
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return String(value);
  };

  const getTableStats = () => {
    const stats = tables.map(table => ({
      ...table,
      count: tableData[table.name]?.length || 0
    }));
    return stats;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Database className="h-8 w-8 animate-pulse mx-auto mb-4" />
            <p>Loading monitoring data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">Administrator access required</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Database Overview</TabsTrigger>
          <TabsTrigger value="tables">Data Tables</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {getTableStats().map((table) => (
                  <div key={table.name} className="text-center p-4 border rounded-lg">
                    <div className={`${table.color} w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2`}>
                      <table.icon className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-sm font-medium capitalize">{table.name.replace('_', ' ')}</p>
                    <p className="text-lg font-bold">{table.count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="mt-6">

          <Card>
            <CardHeader>
              <CardTitle>Data Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={tables[0].name}>
                <TabsList className="grid grid-cols-4 lg:grid-cols-6 gap-1">
                  {tables.map((table) => (
                    <TabsTrigger 
                      key={table.name} 
                      value={table.name}
                      className="text-xs"
                    >
                      {table.name.replace('_', ' ').substring(0, 8)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {tables.map((table) => (
                  <TabsContent key={table.name} value={table.name} className="mt-4">
                    <div className="border rounded-lg">
                      <div className="p-4 border-b bg-muted/50">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold capitalize flex items-center gap-2">
                            <table.icon className="h-4 w-4" />
                            {table.name.replace('_', ' ')} ({tableData[table.name]?.length || 0} records)
                          </h3>
                          <Button onClick={loadAllTableData} variant="outline" size="sm">
                            Refresh
                          </Button>
                        </div>
                      </div>
                      
                      <div className="max-h-96 overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {tableData[table.name]?.[0] && Object.keys(tableData[table.name][0]).map((column) => (
                                <TableHead key={column} className="min-w-32">
                                  {column}
                                </TableHead>
                              ))}
                              <TableHead className="w-20">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tableData[table.name]?.map((record, index) => (
                              <TableRow key={record.id || index}>
                                {Object.entries(record).map(([column, value]) => (
                                  <TableCell key={column} className="font-mono text-xs">
                                    {formatValue(value)}
                                  </TableCell>
                                ))}
                                <TableCell>
                                  <Button
                                    onClick={() => deleteRecord(table.name, record.id)}
                                    variant="outline"
                                    size="sm"
                                    disabled={!record.id}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {(!tableData[table.name] || tableData[table.name].length === 0) && (
                              <TableRow>
                                <TableCell colSpan={100} className="text-center text-muted-foreground">
                                  No data available
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <TransactionDetails />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMonitoring;