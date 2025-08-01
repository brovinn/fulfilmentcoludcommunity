import { useState, useEffect } from "react";
import { Send, Phone, Video, MoreHorizontal, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderUsername: string;
  senderName: string;
  senderAvatar: string;
  timestamp: string;
  isOwn: boolean;
}

interface ChatContact {
  id: string;
  username: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastMessage?: string;
  unreadCount?: number;
}

const ChatWindow = () => {
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Mock data - in real app, this would come from Supabase
  const contacts: ChatContact[] = [
    {
      id: "1",
      username: "john_doe",
      name: "John Doe",
      avatar: "/placeholder.svg",
      isOnline: true,
      lastMessage: "Hey! How are you doing?",
      unreadCount: 2
    },
    {
      id: "2", 
      username: "sarah_smith",
      name: "Sarah Smith",
      avatar: "/placeholder.svg",
      isOnline: false,
      lastMessage: "See you tomorrow!",
      unreadCount: 0
    },
    {
      id: "3",
      username: "mike_wilson", 
      name: "Mike Wilson",
      avatar: "/placeholder.svg",
      isOnline: true,
      lastMessage: "Thanks for the help",
      unreadCount: 1
    }
  ];

  const mockMessages: Message[] = [
    {
      id: "1",
      content: "Hey! How are you doing?",
      senderId: "1",
      senderUsername: "john_doe",
      senderName: "John Doe", 
      senderAvatar: "/placeholder.svg",
      timestamp: "2:30 PM",
      isOwn: false
    },
    {
      id: "2",
      content: "I'm doing great! Just working on some new projects. How about you?",
      senderId: "current",
      senderUsername: "current_user",
      senderName: "You",
      senderAvatar: "/placeholder.svg", 
      timestamp: "2:32 PM",
      isOwn: true
    },
    {
      id: "3",
      content: "That sounds awesome! I'd love to hear more about your projects sometime.",
      senderId: "1",
      senderUsername: "john_doe",
      senderName: "John Doe",
      senderAvatar: "/placeholder.svg",
      timestamp: "2:35 PM", 
      isOwn: false
    }
  ];

  useEffect(() => {
    if (selectedContact) {
      setMessages(mockMessages);
    }
  }, [selectedContact]);

  const handleSendMessage = () => {
    if (message.trim() && selectedContact) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: message,
        senderId: "current",
        senderUsername: "current_user", 
        senderName: "You",
        senderAvatar: "/placeholder.svg",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true
      };
      setMessages([...messages, newMessage]);
      setMessage("");
    }
  };

  return (
    <Card className="h-[600px] flex">
      {/* Contacts List */}
      <div className="w-80 border-r border-border">
        <CardHeader className="pb-3">
          <h3 className="font-semibold text-lg">Messages</h3>
        </CardHeader>
        <ScrollArea className="h-[520px]">
          <div className="space-y-1 px-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-secondary ${
                  selectedContact?.id === contact.id ? "bg-primary/10" : ""
                }`}
                onClick={() => setSelectedContact(contact)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback>{contact.name[0]}</AvatarFallback>
                    </Avatar>
                    {contact.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-success rounded-full border-2 border-card"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm truncate">{contact.name}</p>
                      {contact.unreadCount! > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">@{contact.username}</p>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {contact.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedContact.avatar} />
                      <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
                    </Avatar>
                    {selectedContact.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-success rounded-full border-2 border-card"></div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedContact.name}</p>
                    <p className="text-sm text-muted-foreground">
                      @{selectedContact.username} • {selectedContact.isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                      <DropdownMenuItem>Block User</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            <Separator />

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex items-end space-x-2 max-w-[70%] ${msg.isOwn ? "flex-row-reverse space-x-reverse" : ""}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.senderAvatar} />
                        <AvatarFallback className="text-xs">{msg.senderName[0]}</AvatarFallback>
                      </Avatar>
                      <div className={`rounded-lg px-3 py-2 ${
                        msg.isOwn 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-secondary-foreground"
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.isOwn 
                            ? "text-primary-foreground/70" 
                            : "text-muted-foreground"
                        }`}>
                          @{msg.senderUsername} • {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder={`Message @${selectedContact.username}...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button onClick={handleSendMessage} disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ChatWindow;