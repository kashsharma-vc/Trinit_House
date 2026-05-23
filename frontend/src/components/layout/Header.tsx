import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Search, User, Calendar, MapPin, Settings2, Filter, X, CheckCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const zones = ["All Zones", "Northern", "Southern", "Eastern", "Western", "Central"];
const workshops = ["All Workshops", "Delhi Workshop", "Mumbai Workshop", "Chennai Workshop", "Kolkata Workshop"];
const compressorTypes = ["All Types", "ELGi W-Type", "ELGi 15HP", "Reciprocating", "Screw Type"];

export function Header({ onFilterChange }: HeaderProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filters, setFilters] = useState({ date: "7days", zone: "All Zones", workshop: "All Workshops", compressor: "All Types" });

  // 1. Fetch Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/notifications/list/`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.log("Notification service offline.");
      }
    };
    fetchNotifications();
  }, []);

  // 2. Handle Filter Logic
  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters); // This tells the Parent component (MainLayout) to update
  };

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
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
            <Filter className="w-4 h-4" /> Filters
          </Button>

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
              <Button variant="ghost" className="gap-2 px-2"><User className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Admin User</DropdownMenuLabel>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem className="text-danger">Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter Bar */}
      <motion.div
        initial={false}
        animate={{ height: showFilters ? "auto" : 0, opacity: showFilters ? 1 : 0 }}
        className="overflow-hidden border-t border-border"
      >
        <div className="flex flex-wrap items-center gap-4 px-6 py-4 bg-muted/30">
          <Select onValueChange={(v) => updateFilter("date", v)}>
            <SelectTrigger className="w-40 bg-card"><SelectValue placeholder="Date range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(v) => updateFilter("zone", v)}>
            <SelectTrigger className="w-36 bg-card"><SelectValue placeholder="Zone" /></SelectTrigger>
            <SelectContent>
              {zones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}><X className="w-4 h-4" /></Button>
        </div>
      </motion.div>
    </motion.header>
  );
}