import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Loader2, Wrench, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  Open: "bg-blue-100 text-blue-700",
  "In Progress": "bg-amber-100 text-amber-700",
  Closed: "bg-emerald-100 text-emerald-700",
};

const priorityColors = {
  High: "text-red-600 font-bold",
  Medium: "text-amber-600 font-bold",
  Low: "text-slate-500 font-medium",
};

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/operations/requests/`, {
          headers: { "Authorization": `Token ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const raw = Array.isArray(data) ? data : data.results || [];
          setRequests(raw);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Wrench className="w-6 h-6 text-primary" /> My Assigned Tasks
        </h1>
        <p className="text-muted-foreground mt-1">Select a work order below to execute the SOP.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <p className="text-slate-500 font-medium">You have no active work orders assigned to you.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-soft-md overflow-hidden border">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 font-black uppercase text-[11px] text-slate-500 border-b">
              <tr>
                <th className="p-4">Request ID</th><th className="p-4">Workshop</th>
                <th className="p-4">Type</th><th className="p-4">Compressor</th>
                <th className="p-4">Priority</th><th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-primary">{req.request_id || `REQ-${req.id}`}</td>
                  <td className="p-4 font-medium text-slate-700">{req.workshop_name}</td>
                  <td className="p-4 font-medium">{req.request_type}</td>
                  <td className="p-4 text-slate-600">{req.compressor_type}</td>
                  <td className={cn("p-4", priorityColors[req.priority as keyof typeof priorityColors])}>{req.priority}</td>
                  <td className="p-4"><span className={cn("px-2.5 py-1 rounded-full text-xs font-bold", statusColors[req.status as keyof typeof statusColors])}>{req.status}</span></td>
                  <td className="p-4 text-right">
                    <Button onClick={() => navigate(`/technician/requests/${req.request_id || req.id}`)} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
                      Execute SOP <ArrowRight className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </MainLayout>
  );
}