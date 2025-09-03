import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Index from "./Index";
import VideoStream from "@/components/VideoStream";
import AdminMonitoring from "@/components/AdminMonitoring";

const MainApp = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="live">Live Stream</TabsTrigger>
            <TabsTrigger value="contribute">Contribute</TabsTrigger>
            <TabsTrigger value="monitoring">Admin Monitor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="home" className="mt-6">
            <Index />
          </TabsContent>
          
          <TabsContent value="live" className="mt-6">
            <VideoStream />
          </TabsContent>
          
          <TabsContent value="contribute" className="mt-6">
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold mb-4">Contribute</h2>
              <p className="text-muted-foreground">Contribution features will be available here</p>
            </div>
          </TabsContent>
          
          <TabsContent value="monitoring" className="mt-6">
            <AdminMonitoring />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MainApp;