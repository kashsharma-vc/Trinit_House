import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowRight, Search, ChevronLeft, CheckCircle2, Circle, Upload, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

export default function TechnicianRequests() {
  const navigate = useNavigate();
  
  // State
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // View Management
  const [activeView, setActiveView] = useState<"list" | "workflow">("list");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  const getAuthToken = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      toast.error("Session expired. Please log in again.");
      navigate("/login");
      return null;
    }
    return token;
  };

  const fetchRequests = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/operations/requests/`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(Array.isArray(data) ? data : (data.results || []));
      } else {
        toast.error("Failed to load assigned requests.");
      }
    } catch (error) {
      console.error("Network error:", error);
      toast.error("Connection error loading workflow.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [navigate]);

  // --- HANDLE CHECKLIST TOGGLE ---
  const handleChecklistToggle = async (stageId: number, itemId: number, currentCompletedState: boolean) => {
    const token = getAuthToken();
    if (!token) return;

    setUpdatingItemId(itemId);

    try {
      const formData = new FormData();
      formData.append("stage_id", stageId.toString());
      formData.append("item_id", itemId.toString());
      formData.append("completed", (!currentCompletedState).toString());
      
      const response = await fetch(`${API_BASE_URL}/operations/requests/${selectedRequest.request_id}/update_checklist/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        toast.success("Checklist updated successfully");
        await fetchRequests();
        
        const freshDataResponse = await fetch(`${API_BASE_URL}/operations/requests/`, {
          headers: { "Authorization": `Token ${token}` }
        });
        const freshData = await freshDataResponse.json();
        const freshRequests = Array.isArray(freshData) ? freshData : (freshData.results || []);
        const freshSelected = freshRequests.find((r: any) => r.request_id === selectedRequest.request_id);
        
        if (freshSelected) {
          setSelectedRequest(freshSelected);
        }
      } else {
        toast.error("Failed to update checklist item");
      }
    } catch (error) {
      toast.error("Network error while saving progress");
    } finally {
      setUpdatingItemId(null);
    }
  };

  // --- 🌟 NEW: HANDLE FILE UPLOAD ---
  const handleFileUpload = async (stageId: number, itemId: number, file: File, currentCompletedState: boolean) => {
    const token = getAuthToken();
    if (!token) return;

    setUpdatingItemId(itemId);

    try {
      const formData = new FormData();
      formData.append("stage_id", stageId.toString());
      formData.append("item_id", itemId.toString());
      formData.append("completed", currentCompletedState.toString()); // Keep completion state exactly as is
      formData.append("attachment", file); // Attach the file!

      const response = await fetch(`${API_BASE_URL}/operations/requests/${selectedRequest.request_id}/update_checklist/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        toast.success("File uploaded successfully");
        await fetchRequests();
        
        const freshDataResponse = await fetch(`${API_BASE_URL}/operations/requests/`, {
          headers: { "Authorization": `Token ${token}` }
        });
        const freshData = await freshDataResponse.json();
        const freshRequests = Array.isArray(freshData) ? freshData : (freshData.results || []);
        const freshSelected = freshRequests.find((r: any) => r.request_id === selectedRequest.request_id);
        
        if (freshSelected) setSelectedRequest(freshSelected);
      } else {
        toast.error("Failed to upload file");
      }
    } catch (error) {
      toast.error("Network error while uploading");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const filteredRequests = requests.filter(req => 
    (req.request_id && req.request_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (req.compressor_type && req.compressor_type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <MainLayout>
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: REQUESTS LIST */}
        {activeView === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6 max-w-7xl mx-auto"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Assigned Requests</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Manage and execute your active service workflows
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  className="pl-9 bg-white border-slate-200 shadow-sm" 
                  placeholder="Search by ID or compressor…" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Tabs defaultValue="all">
              <TabsList className="bg-slate-100">
                <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4 space-y-4">
                {isLoading ? (
                  <div className="flex justify-center items-center py-20 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500">
                    No requests currently assigned to you.
                  </div>
                ) : (
                  filteredRequests.map((req) => (
                    <Card key={req.request_id} className="shadow-sm border-slate-200 hover:border-slate-300 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-primary">{req.request_id}</span>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-bold",
                                req.priority === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                              )}>
                                {req.priority}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold">
                                {req.status}
                              </span>
                            </div>
                            <h3 className="font-bold text-lg text-slate-900">
                              {req.compressor_type || "Unknown Compressor"} 
                              <span className="text-slate-500 font-normal ml-2 text-sm">
                                Model: {req.compressor_model || "N/A"}
                              </span>
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Workshop</div>
                                <div className="font-medium text-slate-900">{req.workshop_name || "Unassigned"}</div>
                              </div>
                              <div>
                                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Type</div>
                                <div className="font-medium text-slate-900">{req.request_type}</div>
                              </div>
                              <div className="col-span-2">
                                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">SOP Progress</div>
                                <div className="font-medium text-primary flex items-center gap-2">
                                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary rounded-full" 
                                      style={{ 
                                        width: `${req.stages ? (req.stages.filter((s:any) => s.status === 'completed').length / req.stages.length) * 100 : 0}%` 
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs whitespace-nowrap">
                                    {req.stages ? req.stages.filter((s:any) => s.status === 'completed').length : 0} / {req.stages?.length || 0} Stages
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex md:flex-col gap-2 md:w-48">
                            <Button 
                              className="w-full font-bold shadow-md hover:shadow-lg transition-all"
                              onClick={() => {
                                setSelectedRequest(req);
                                setActiveView("workflow");
                              }}
                            >
                              Open Workflow <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {/* VIEW 2: SOP WORKFLOW / CHECKLIST */}
        {activeView === "workflow" && selectedRequest && (
          <motion.div
            key="workflow"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto space-y-6 pb-20"
          >
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setActiveView("list")}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{selectedRequest.request_id} Workflow</h1>
                <p className="text-sm text-slate-500">Complete standard operating procedures in order.</p>
              </div>
            </div>

            <div className="space-y-6">
              {selectedRequest.stages?.map((stage: any, index: number) => {
                const isCompleted = stage.status === "completed";
                const isActive = stage.status === "active";
                const isPending = stage.status === "pending";

                return (
                  <Card 
                    key={stage.id} 
                    className={cn(
                      "overflow-hidden transition-all duration-300",
                      isActive ? "border-primary shadow-md ring-1 ring-primary/20" : "border-slate-200",
                      isPending ? "opacity-60 grayscale-[50%]" : ""
                    )}
                  >
                    <CardHeader className={cn(
                      "py-4",
                      isCompleted ? "bg-emerald-50 border-b border-emerald-100" : 
                      isActive ? "bg-blue-50 border-b border-blue-100" : "bg-slate-50 border-b border-slate-100"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                            isCompleted ? "bg-emerald-500 text-white" :
                            isActive ? "bg-primary text-white shadow-md" : "bg-slate-200 text-slate-500"
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{stage.name}</CardTitle>
                            <p className="text-xs text-slate-500">{stage.purpose}</p>
                          </div>
                        </div>
                        <div>
                          {isCompleted && <span className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Locked</span>}
                          {isActive && <span className="text-xs font-bold text-primary uppercase animate-pulse">In Progress</span>}
                          {isPending && <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Pending Next</span>}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-0 divide-y divide-slate-100">
                      {stage.checklist?.map((item: any) => (
                        <div key={item.id} className={cn("p-4 flex items-start gap-4", isCompleted ? "bg-slate-50/50" : "bg-white")}>
                          
                          <button 
                            disabled={isCompleted || isPending || updatingItemId === item.id}
                            onClick={() => handleChecklistToggle(stage.id, item.id, item.completed)}
                            className={cn(
                              "mt-0.5 rounded-full transition-colors focus:outline-none",
                              (isCompleted || isPending) && "cursor-not-allowed opacity-70"
                            )}
                          >
                            {updatingItemId === item.id ? (
                              <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            ) : item.completed ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            ) : (
                              <Circle className="w-6 h-6 text-slate-300 hover:text-primary" />
                            )}
                          </button>
                          
                          <div className="flex-1 space-y-2">
                            {/* 🌟 FIXED: Removed 'line-through' and added a green color for completed tasks */}
                            <p className={cn("text-sm font-medium", item.completed ? "text-emerald-700" : "text-slate-900")}>
                              {item.text}
                            </p>
                            
                            {/* 🌟 FIXED: Implemented hidden file input for functional uploads */}
                            {(item.requires_doc || item.requires_photo) && (
                              <div className="flex items-center gap-3 pt-2">
                                <div className="relative">
                                  <input
                                    type="file"
                                    id={`file-upload-${item.id}`}
                                    className="hidden"
                                    disabled={isCompleted || isPending || updatingItemId === item.id}
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleFileUpload(stage.id, item.id, e.target.files[0], item.completed);
                                      }
                                    }}
                                  />
                                  <label htmlFor={`file-upload-${item.id}`}>
                                    <div
                                      className={cn(
                                        "inline-flex items-center justify-center rounded-md text-xs font-medium border border-slate-200 bg-transparent h-8 px-3 gap-2 transition-colors",
                                        (isCompleted || isPending || updatingItemId === item.id)
                                          ? "opacity-50 cursor-not-allowed"
                                          : "cursor-pointer hover:bg-slate-100"
                                      )}
                                    >
                                      {updatingItemId === item.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Upload className="w-3 h-3" />
                                      )}
                                      {item.requires_photo ? "Upload Photo Evidence" : "Upload Document"}
                                    </div>
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}