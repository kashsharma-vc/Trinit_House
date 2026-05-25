import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

const queryClient = new QueryClient();

// Security wrapper that checks for the login token
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("authToken");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
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
          
          {/* PROTECTED ROUTES */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
          <Route path="/requests/:id" element={<ProtectedRoute><RequestView /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/penalty" element={<ProtectedRoute><Penalty /></ProtectedRoute>} />
          <Route path="/invoice" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
          <Route path="/warranty" element={<ProtectedRoute><Warranty /></ProtectedRoute>} />
          <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
          <Route path="/role-access" element={<ProtectedRoute><RoleBaseAccessPage /></ProtectedRoute>} />
          
          {/* CATCH-ALL ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;