import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, Search, User, Calendar, MapPin, Settings2, CheckCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onFilterChange?: (filters: any) => void;
}

export function Header({ onFilterChange }: HeaderProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);

  // 1. Retrieve the active user
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : { username: "Guest", is_superuser: false };

  // Fetch Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      // 1. Get the token
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) return;
  
      try {
        // 2. Add the token to the fetch headers
        const response = await fetch(`${API_BASE_URL}/notifications/list/`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };
  
    fetchNotifications();
    // Optional: Set up an interval to poll for notifications every minute
    // const interval = setInterval(fetchNotifications, 60000);
    // return () => clearInterval(interval);
  }, []);

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border"
    >
      <div className="flex items-center justify-between h-16 px-6">
        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search requests..." className="pl-10 bg-muted/50 border-0" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          
          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[10px] flex items-center justify-center font-bold">
                    {notifications.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <DropdownMenuItem key={n.id} className="cursor-pointer py-3 border-b flex flex-col items-start">
                    <span className="text-sm font-medium">{n.message}</span>
                    <span className="text-xs text-muted-foreground">{n.created_at}</span>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <div className="hidden md:block text-right mr-1">
                  <p className="text-sm font-bold leading-none">{user.username}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user.is_superuser ? "Administrator" : "Technician"}
                  </p>
                </div>
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Dynamic User Label */}
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.is_superuser ? "Administrator Account" : "Service Technician Account"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="cursor-pointer">Profile Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {/* Secure Logout */}
              <DropdownMenuItem 
                className="text-red-600 font-bold cursor-pointer"
                onClick={() => {
                  // 🌟 FIXED: Changed "authToken" to "token" to match Auth.tsx
                  localStorage.removeItem("token"); 
                  localStorage.removeItem("user");
                  navigate("/login"); // or whatever your login route is named
                }}
              >
                Log out
              </DropdownMenuItem>
              
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}