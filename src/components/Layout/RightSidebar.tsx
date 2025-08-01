import { MessageCircle, Phone, Video, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const RightSidebar = () => {
  const contacts = [
    { id: 1, name: "Sarah Wilson", isOnline: true, avatar: "/placeholder.svg" },
    { id: 2, name: "Mike Johnson", isOnline: true, avatar: "/placeholder.svg" },
    { id: 3, name: "Emma Davis", isOnline: false, avatar: "/placeholder.svg" },
    { id: 4, name: "Tom Brown", isOnline: true, avatar: "/placeholder.svg" },
    { id: 5, name: "Lisa Garcia", isOnline: false, avatar: "/placeholder.svg" },
  ];

  const suggestedGroups = [
    { name: "React Developers", members: "24.5k members", image: "/placeholder.svg" },
    { name: "UI/UX Design", members: "18.2k members", image: "/placeholder.svg" },
    { name: "Photography", members: "15.8k members", image: "/placeholder.svg" },
  ];

  const birthdays = [
    { name: "Alex Thompson", avatar: "/placeholder.svg" },
    { name: "Rachel Kim", avatar: "/placeholder.svg" },
  ];

  return (
    <aside className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-sidebar-bg border-l border-border overflow-y-auto hidden xl:block">
      <div className="p-4 space-y-4">
        {/* Birthdays */}
        {birthdays.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Birthdays</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {birthdays.map((person) => (
                <div key={person.name} className="flex items-center space-x-3 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={person.avatar} />
                    <AvatarFallback>{person.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    <span className="font-medium">{person.name}</span> has a birthday today!
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Contacts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Contacts</CardTitle>
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback>{contact.name[0]}</AvatarFallback>
                    </Avatar>
                    {contact.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-success rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">{contact.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Suggested Groups */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Suggested for you</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {suggestedGroups.map((group) => (
                <div key={group.name} className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={group.image} />
                    <AvatarFallback>{group.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.members}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Join
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
};

export default RightSidebar;