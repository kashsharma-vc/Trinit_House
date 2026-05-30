import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { AIAssistantWidget } from "../AIAssistantWidget";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden w-full relative">
      {/* Overlay for mobile when sidebar is open */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <AppSidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      
      {/* Main content area - full width on mobile, offset on desktop */}
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 w-full md:ml-[260px]">
        <Header setMobileMenuOpen={setMobileMenuOpen} />
        
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
      
      {/* Global AI Assistant Floating Widget */}
      <AIAssistantWidget />
    </div>
  );
}