import { useState, useEffect } from "react";
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
  User,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import trinityLogo from "@/assets/trinity-house-logo.png";

interface AppSidebarProps {
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export function AppSidebar({ mobileMenuOpen, setMobileMenuOpen }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768 && setMobileMenuOpen) {
        setMobileMenuOpen(false); // Close mobile menu if resizing to desktop
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMobileMenuOpen]);

  // 1. Get the current user role and permissions from local storage
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const isSuperAdmin = user?.is_superuser === true;
  const permissions = user?.permissions || {};

  // Helper to check if user has view access for a feature key
  const hasAccess = (featureKey?: string) => {
    if (isSuperAdmin || !featureKey) return true; // Admins and items without keys are always visible
    return permissions[featureKey]?.view === true;
  };

  // 2. Define Admin vs Technician Links with feature keys mapping
  const adminLinks = [
    // 🌟 FIXED: Changed path from "/" to "/dashboard" to stop the login redirect loop
    { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { title: "New Request", path: "/requests", icon: FileText, featureKey: "work_order" },
    { title: "Inventory", path: "/inventory", icon: Package, featureKey: "vendors" },
    { title: "Penalty War Room", path: "/penalty", icon: AlertTriangle, featureKey: "incidents" },
    { title: "Invoice & Closure", path: "/invoice", icon: FileCheck, featureKey: "bills" },
    { title: "Warranty Calls", path: "/warranty", icon: PhoneCall, featureKey: "work_order" },
    { title: "Role Access", path: "/role-access", icon: ShieldCheck, featureKey: "staff" },
    { title: "User Approvals", path: "/user-approvals", icon: UserCheck, featureKey: "staff" },
    { title: "Setup", path: "/setup", icon: Settings, featureKey: "setup_tickets" },
    { title: "Profile", path: "/profile", icon: User },
    { title: "AI Command Center", path: "/ai-assistant", icon: Sparkles },
  ];

  const technicianLinks = [
    { title: "My Assigned Tasks", path: "/technician/requests", icon: Wrench, featureKey: "my_tickets" },
    { title: "Profile", path: "/profile", icon: User },
  ];

  // 3. Select the correct links based on role and permissions
  const navItems = (isSuperAdmin ? adminLinks : technicianLinks).filter(item => hasAccess(item.featureKey));

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: collapsed && !isMobile ? 72 : 260,
        x: isMobile ? (mobileMenuOpen ? 0 : -260) : 0
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col",
        "md:translate-x-0" // Ensure it's always visible on desktop
      )}
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
              {isSuperAdmin ? "Command Center" : (user?.role ? `${user.role} Portal` : "Execution Deck")}
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
                  onClick={() => {
                    if (window.innerWidth < 768 && setMobileMenuOpen) {
                      setMobileMenuOpen(false);
                    }
                  }}
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