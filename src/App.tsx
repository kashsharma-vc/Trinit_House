import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Requests from "./pages/Requests";
import RequestView from "./pages/RequestView";
import Inventory from "./pages/Inventory";
import Penalty from "./pages/Penalty";
import Invoice from "./pages/Invoice";
import Warranty from "./pages/Warranty";
import Setup from "./pages/Setup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/requests/:id" element={<RequestView />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/penalty" element={<Penalty />} />
          <Route path="/invoice" element={<Invoice />} />
          <Route path="/warranty" element={<Warranty />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
