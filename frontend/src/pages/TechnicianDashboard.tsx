import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Loader2, Wrench, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        // Fetch only requests. If your backend filters by user automatically, great!
        const response = await fetch(`${API_BASE_URL}/operations/requests/`, {
          headers: { "Authorization": `Token ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Adjust this depending on your backend pagination/structure
          setRequests(Array.isArray(data) ? data : data.results || []);
        }
      } catch (error) {
        console.error("Failed to fetch tasks", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyTasks();
  }, []);

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight flex items-center gap-3">
          <Wrench className="w-8 h-8 text-primary" /> My Assigned Tasks
        </h1>
        <p className="text-muted-foreground mt-2 font-medium">
          Select a work order below to begin executing the SOP and updating stages.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <p className="text-slate-500 font-medium">You have no active work orders assigned to you right now.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req, index) => (
            <motion.div 
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-black text-lg text-slate-900">REQ-{req.id}</span>
                  <Badge className={cn(
                    req.status === "Open" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" :
                    req.status === "In Progress" ? "bg-amber-100 text-amber-700 hover:bg-amber-200" :
                    "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  )}>
                    {req.status || "Assigned"}
                  </Badge>
                </div>
                <p className="text-slate-600 font-medium text-sm">
                  {req.compressor_type || "Compressor"} • {req.workshop_name || "Workshop"}
                </p>
              </div>

              <Button 
                onClick={() => navigate(`/technician/requests/${req.id}`)}
                className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
              >
                Execute SOP <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}