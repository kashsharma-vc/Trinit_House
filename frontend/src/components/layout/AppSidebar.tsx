import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Package,
  AlertTriangle,
  FileCheck,
  PhoneCall,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import trinityLogo from "@/assets/trinity-house-logo.png";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // 1. Get the current user role from local storage
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const isSuperAdmin = user?.is_superuser === true;

  // 2. Define Admin vs Technician Links
  const adminLinks = [
    // 🌟 FIXED: Changed path from "/" to "/dashboard" to stop the login redirect loop
    { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { title: "New Request", path: "/requests", icon: FileText },
    { title: "Inventory", path: "/inventory", icon: Package },
    { title: "Penalty War Room", path: "/penalty", icon: AlertTriangle },
    { title: "Invoice & Closure", path: "/invoice", icon: FileCheck },
    { title: "Warranty Calls", path: "/warranty", icon: PhoneCall },
    { title: "Role Access", path: "/role-access", icon: ShieldCheck },
    { title: "Setup", path: "/setup", icon: Settings },
  ];

  const technicianLinks = [
    { title: "My Assigned Tasks", path: "/technician/requests", icon: Wrench },
  ];

  // 3. Select the correct links based on role
  const navItems = isSuperAdmin ? adminLinks : technicianLinks;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col"
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <img src={trinityLogo} alt="Trinity House" className="w-8 h-8 object-contain" />
            <span className="font-semibold text-foreground">TRINITY HOUSE</span>
          </motion.div>
        )}
        {collapsed && (
          <img src={trinityLogo} alt="Trinity House" className="w-8 h-8 object-contain mx-auto" />
        )}
      </div>

      {/* Role Indicator (Hidden when collapsed) */}
      {!collapsed && (
        <div className="px-6 py-3 border-b border-sidebar-border/50 bg-background/5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Current Portal</p>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isSuperAdmin ? "bg-primary" : "bg-emerald-500")} />
            <span className={cn("text-xs font-bold", isSuperAdmin ? "text-primary" : "text-emerald-500")}>
              {isSuperAdmin ? "Command Center" : "Execution Deck"}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            // 🌟 FIXED: Better active state matching so nested routes highlight correctly
            const isActive = location.pathname === item.path || 
                             (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));
            
            const Icon = item.icon;

            return (
              <motion.li
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NavLink
                  to={item.path}
                  className={cn(
                    "nav-item group",
                    isActive && "active"
                  )}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "group-hover:bg-sidebar-accent"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </NavLink>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="ml-2 text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}