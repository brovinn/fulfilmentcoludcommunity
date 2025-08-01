import { Home, Users, Bookmark, Clock, MessageSquare, Calendar, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Sidebar = () => {
  const menuItems = [
    { icon: Home, label: "Home", active: true },
    { icon: Users, label: "Friends", badge: "12" },
    { icon: MessageSquare, label: "Messages", badge: "3" },
    { icon: Bookmark, label: "Saved" },
    { icon: Clock, label: "Memories" },
    { icon: Calendar, label: "Events" },
    { icon: Star, label: "Favorites" },
    { icon: TrendingUp, label: "Trending" },
  ];

  const shortcuts = [
    { name: "React Developers", avatar: "/placeholder.svg" },
    { name: "Photography Club", avatar: "/placeholder.svg" },
    { name: "Travel Enthusiasts", avatar: "/placeholder.svg" },
  ];

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 bg-sidebar-bg border-r border-border overflow-y-auto hidden lg:block">
      <div className="p-4 space-y-4">
        {/* User Profile */}
        <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">John Doe</p>
            <p className="text-sm text-muted-foreground">View your profile</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.label}
              variant={item.active ? "secondary" : "ghost"}
              className="w-full justify-start h-12 px-3 relative"
            >
              <item.icon className="mr-3 h-5 w-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Button>
          ))}
        </nav>

        {/* Shortcuts */}
        <div className="pt-4 border-t border-border">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 px-3">
            Your Shortcuts
          </h3>
          <div className="space-y-1">
            {shortcuts.map((shortcut) => (
              <Button
                key={shortcut.name}
                variant="ghost"
                className="w-full justify-start h-12 px-3"
              >
                <Avatar className="mr-3 h-8 w-8">
                  <AvatarImage src={shortcut.avatar} />
                  <AvatarFallback>{shortcut.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-left truncate">{shortcut.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;