import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Dashboard from "./pages/Dashboard";
import Requests from "./pages/Requests";
import RequestView from "./pages/RequestView";
import Inventory from "./pages/Inventory";
import Penalty from "./pages/Penalty";
import Invoice from "./pages/Invoice";
import Warranty from "./pages/Warranty";
import Setup from "./pages/Setup";
import NotFound from "./pages/NotFound";
import RoleBaseAccessPage from "./pages/RoleBaseAccess";
import Auth from "./pages/Auth"; 
import TechnicianDashboard from "@/pages/TechnicianDashboard"; 
import TechnicianRequestView from "@/pages/TechnicianRequestView";

const queryClient = new QueryClient();

/**
 * 🔒 RoleGuard Component
 * - Checks if user is logged in.
 * - Checks if user has required role (Admin vs Technician).
 */
const RoleGuard = ({ children, requireAdmin }: { children: JSX.Element, requireAdmin: boolean }) => {
  const token = localStorage.getItem("token"); // Ensure this matches your Auth.tsx key
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  
  // 1. Not logged in? Redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // 2. Admin attempting to view anything (Allowed)
  if (user.is_superuser) {
    return children;
  }
  
  // 3. Technician attempting to view Admin-only route?
  if (requireAdmin && !user.is_superuser) {
    return <Navigate to="/technician/requests" replace />;
  }
  
  // 4. Technician is allowed to view Technician routes
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* PUBLIC ROUTE */}
          <Route path="/login" element={<Auth />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 🔴 ADMIN ONLY PROTECTED ROUTES */}
          <Route path="/setup" element={<RoleGuard requireAdmin={true}><Setup /></RoleGuard>} />
          <Route path="/role-access" element={<RoleGuard requireAdmin={true}><RoleBaseAccessPage /></RoleGuard>} />
          <Route path="/inventory" element={<RoleGuard requireAdmin={true}><Inventory /></RoleGuard>} />
          <Route path="/penalty" element={<RoleGuard requireAdmin={true}><Penalty /></RoleGuard>} />
          <Route path="/invoice" element={<RoleGuard requireAdmin={true}><Invoice /></RoleGuard>} />
          <Route path="/warranty" element={<RoleGuard requireAdmin={true}><Warranty /></RoleGuard>} />
          <Route path="/dashboard" element={<RoleGuard requireAdmin={true}><Dashboard /></RoleGuard>} />
          <Route path="/requests" element={<RoleGuard requireAdmin={true}><Requests /></RoleGuard>} />
          <Route path="/requests/:id" element={<RoleGuard requireAdmin={true}><RequestView /></RoleGuard>} />
          
          {/* 🔵 TECHNICIAN PROTECTED ROUTES */}
          <Route path="/technician/requests" element={<RoleGuard requireAdmin={false}><TechnicianDashboard /></RoleGuard>} />
          <Route path="/technician/requests/:id" element={<RoleGuard requireAdmin={false}><TechnicianRequestView /></RoleGuard>} />
          
          {/* CATCH-ALL ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;