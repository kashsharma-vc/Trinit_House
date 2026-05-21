import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Search, User, Calendar, MapPin, Settings2, Filter } from "lucide-react";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const zones = ["All Zones", "Northern", "Southern", "Eastern", "Western", "Central"];
const workshops = ["All Workshops", "Delhi Workshop", "Mumbai Workshop", "Chennai Workshop", "Kolkata Workshop"];
const compressorTypes = ["All Types", "ELGi W-Type", "ELGi 15HP", "Reciprocating", "Screw Type"];

export function Header() {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border"
    >
      {/* Main Header */}
      <div className="flex items-center justify-between h-16 px-6">
        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search requests, jobs, inventory..."
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-danger-foreground text-[10px] flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">Workshop Manager</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings2 className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-danger">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter Bar */}
      <motion.div
        initial={false}
        animate={{ height: showFilters ? "auto" : 0, opacity: showFilters ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden border-t border-border"
      >
        <div className="flex flex-wrap items-center gap-4 px-6 py-4 bg-muted/30">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select defaultValue="7days">
              <SelectTrigger className="w-40 bg-card">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Zone */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <Select defaultValue="All Zones">
              <SelectTrigger className="w-36 bg-card">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Workshop */}
          <Select defaultValue="All Workshops">
            <SelectTrigger className="w-44 bg-card">
              <SelectValue placeholder="Workshop" />
            </SelectTrigger>
            <SelectContent>
              {workshops.map((workshop) => (
                <SelectItem key={workshop} value={workshop}>
                  {workshop}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Compressor Type */}
          <Select defaultValue="All Types">
            <SelectTrigger className="w-40 bg-card">
              <SelectValue placeholder="Compressor Type" />
            </SelectTrigger>
            <SelectContent>
              {compressorTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            Clear All
          </Button>
        </div>
      </motion.div>
    </motion.header>
  );
}
