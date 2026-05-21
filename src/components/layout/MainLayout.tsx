import { ReactNode } from "react";
import { motion } from "framer-motion";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      
      {/* Main content area - offset by sidebar width */}
      <div className="flex-1 ml-[260px] transition-all duration-300">
        <Header />
        
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
