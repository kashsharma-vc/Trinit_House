import { ReactNode } from "react";
import { motion } from "framer-motion";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar strictly handles its own role-based rendering now */}
      <AppSidebar />
      
      {/* Main content area - offset by sidebar width */}
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen transition-all duration-300">
        <Header />
        
        <motion.main
          key="main-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex-1 p-6 overflow-y-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}