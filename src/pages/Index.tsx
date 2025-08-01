import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import RightSidebar from "@/components/Layout/RightSidebar";
import Feed from "@/components/Posts/Feed";

const Index = () => {
  return (
    <div className="min-h-screen bg-feed-bg">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-80 xl:mr-80 px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <Feed />
          </div>
        </main>
        
        <RightSidebar />
      </div>
    </div>
  );
};

export default Index;
