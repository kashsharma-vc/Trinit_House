import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/api";
import {
  ChevronLeft,
  Check,
  Camera,
  Clock,
  User,
  FileText,
  Download,
  Share2,
  Lock,
  Droplets,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Package,
  Search,
  Cog,
  Sparkles,
  FlaskConical,
  ShieldCheck,
  Timer,
  ChevronDown,
  Image,
  Paperclip,
  StickyNote,
  Box,
  Gauge,
  Eye,
  FileCheck,
  Shield,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Enhanced checklist item with detailed data
interface ChecklistItemData {
  id: number;
  text: string;
  completed: boolean;
  note?: string;
  attachmentLabel?: string;
  completedBy?: string;
  completedAt?: string;
  laborTime?: string;
  delayMessage?: string;
  photoUrl?: string;
  photoDescription?: string;
  documentName?: string;
  documentUrl?: string;
  selectedValue?: string;
  inputValue?: string;
  consumableInfo?: string;
  spareInfo?: string;
}

interface SopStage {
  id: number;
  name: string;
  icon: string;
  purpose: string;
  status: "completed" | "active" | "pending";
  stageLock: string;
  checklist: ChecklistItemData[];
  laborTime?: string;
  technician?: string;
  completedAt?: string;
  trackConsumables?: boolean;
  trackSpares?: boolean;
  consumablesInfo?: string;
  sparesInfo?: string;
}

const statusColors = {
  completed: "bg-success text-success-foreground border-success",
  active: "bg-primary text-primary-foreground border-primary",
  pending: "bg-muted text-muted-foreground border-muted-foreground/30",
};

const stageIconMap: Record<string, React.ReactNode> = {
  "Pre-Inspection": <Shield className="w-5 h-5" />,
  "Transit": <Truck className="w-5 h-5" />,
  "Receiving": <Package className="w-5 h-5" />,
  "Inspection": <Eye className="w-5 h-5" />,
  "Disassembly": <Cog className="w-5 h-5" />,
  "Cleaning": <Sparkles className="w-5 h-5" />,
  "Parts Inspection": <Search className="w-5 h-5" />,
  "Assembly": <Wrench className="w-5 h-5" />,
  "Testing": <FlaskConical className="w-5 h-5" />,
  "QC Checklist": <FileCheck className="w-5 h-5" />,
};

// Helper function to resolve Stage Emojis dynamically if missing in DB backend
const getStageEmoji = (name: string): string => {
  const emojis: Record<string, string> = {
    "Pre-Inspection": "🟢", "Transit": "🚚", "Receiving": "🟢", "Inspection": "🔵",
    "Disassembly": "⚪", "Cleaning": "🧼", "Parts Inspection": "🔍", "Assembly": "🛠️",
    "Testing": "🧪", "QC Checklist": "🧾"
  };
  return emojis[name] || "📋";
};

// Animated icon component
const AnimatedIcon = ({ children, isActive, isCompleted }: { children: React.ReactNode; isActive?: boolean; isCompleted?: boolean }) => (
  <motion.div
    initial={{ scale: 0.8 }}
    animate={{ 
      scale: isActive ? [1, 1.1, 1] : 1,
      rotate: isCompleted ? [0, 10, -10, 0] : 0
    }}
    transition={{ 
      duration: isActive ? 2 : 0.3,
      repeat: isActive ? Infinity : 0,
      ease: "easeInOut"
    }}
  >
    {children}
  </motion.div>
);

export default function RequestView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [expandedStage, setExpandedStage] = useState<number | null>(1);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Real API database State management
  const [requestData, setRequestData] = useState<any>(null);
  const [sopStages, setSopStages] = useState<SopStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data directly from Django backend and map values dynamically
  useEffect(() => {
    const fetchRequestDetails = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/operations/requests/${id}/`);
        if (!response.ok) throw new Error("Request not found");
        
        const data = await response.json();
        
        // Map the backend structure to your application's UI expectations
        setRequestData({
          id: data.request_id || data.id,
          date: data.request_date || data.created_on?.split("T")[0] || "N/A",
          zone: data.zone_name || "Unassigned",
          workshop: data.workshop_name || "Unassigned",
          type: data.request_type || "Repair",
          compressor: data.compressor_type || "Unknown",
          priority: data.priority || "Medium",
          status: data.status || "Open",
          expectedDate: data.expected_date ? data.expected_date.split("T")[0] : "TBD",
          slaTat: data.sla_tat_days ? `${data.sla_tat_days} days` : "14 days", 
          daysRemaining: 14, 
          serialNumber: data.serial_number || "N/A",
          model: data.compressor_model || "N/A",
        });

        // Map live database stages arrays into frontend state structure gracefully
        if (data.stages && data.stages.length > 0) {
          
          // CRITICAL FIX: Ensure stages are ALWAYS sorted 1 to 10
          const sortedStages = [...data.stages].sort((a: any, b: any) => {
            return (a.sequence || a.id) - (b.sequence || b.id);
          });

          const mappedStages: SopStage[] = sortedStages.map((stage: any) => ({
            id: stage.id,
            name: stage.name,
            icon: stage.icon || getStageEmoji(stage.name),
            purpose: stage.purpose || `Execute ${stage.name} protocols`,
            status: (stage.status || "pending") as "completed" | "active" | "pending",
            stageLock: stage.stage_lock_message || `${stage.name} locked until previous items complete`,
            trackConsumables: stage.track_consumables || false,
            trackSpares: stage.track_spares || false,
            consumablesInfo: stage.consumables_info || "",
            sparesInfo: stage.spares_info || "",
            laborTime: stage.labor_time || undefined,
            technician: stage.technician || data.assigned_to || undefined,
            completedAt: stage.completed_at || undefined,
            checklist: (stage.checklist || []).map((item: any) => ({
              id: item.id,
              text: item.text,
              completed: item.completed || false,
              note: item.note || undefined,
              attachmentLabel: item.attachment_label || undefined,
              completedBy: item.completed_by || undefined,
              completedAt: item.completed_at ? new Date(item.completed_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' }) : undefined,
              laborTime: item.labor_time || undefined,
              delayMessage: item.delay_message || undefined,
              photoUrl: item.attachment && (item.requires_photo || item.attachment.match(/\.(jpeg|jpg|gif|png)$/i)) ? item.attachment : undefined,
              documentUrl: item.attachment && (item.requires_doc || item.attachment.match(/\.(pdf|doc|docx|xls|xlsx)$/i)) ? item.attachment : undefined,
              documentName: item.attachment ? item.attachment.split('/').pop() : undefined,
              selectedValue: item.selected_value || undefined,
              inputValue: item.input_value || undefined,
              consumableInfo: item.consumable_info || undefined,
              spareInfo: item.spare_info || undefined
            }))
          }));
          setSopStages(mappedStages);
        }
      } catch (err) {
        console.error("Failed parsing backend workflow pipeline payload:", err);
        setRequestData(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchRequestDetails();
  }, [id]);

  // Export to Excel/CSV
  const handleExportCSV = () => {
    if (!requestData) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Request ID,Date,Zone,Workshop,Type,Compressor,Priority,Status,Expected Date\n"
      + `${requestData.id},${requestData.date},${requestData.zone},${requestData.workshop},${requestData.type},${requestData.compressor},${requestData.priority},${requestData.status},${requestData.expectedDate}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${requestData.id}_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print to PDF (Job Card)
  const handleExportPDF = () => {
    window.print();
  };

  const toggleItemExpanded = (stageId: number, itemId: number) => {
    const key = `${stageId}-${itemId}`;
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getStageProgress = (stage: SopStage) => {
    if (!stage.checklist || stage.checklist.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = stage.checklist.filter((c) => c.completed).length;
    return { completed, total: stage.checklist.length, percentage: Math.round((completed / stage.checklist.length) * 100) };
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p className="font-bold uppercase tracking-widest text-sm">Loading Request Pipeline...</p>
        </div>
      </MainLayout>
    );
  }

  if (!requestData) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Request Not Found</h2>
          <p className="text-muted-foreground mb-6">This request ID does not exist in the database.</p>
          <Button onClick={() => navigate("/requests")}>Return to Requests</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" size="icon" onClick={() => navigate("/requests")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Request {requestData.id}
            </h1>
            <p className="text-muted-foreground mt-1">
              {requestData.compressor} • {requestData.workshop} • {requestData.zone} Zone
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
              <Download className="w-4 h-4" />
              Export
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="gap-2" onClick={handleExportPDF}>
              <FileText className="w-4 h-4" />
              View Job Card
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Request Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-6 shadow-soft-md mb-6"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Request Date</p>
            <p className="font-medium">{requestData.date}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Request Type</p>
            <p className="font-medium">{requestData.type}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Priority</p>
            <p className={cn(
              "font-medium",
              requestData.priority === "High" && "text-danger",
              requestData.priority === "Medium" && "text-warning",
              requestData.priority === "Low" && "text-muted-foreground"
            )}>{requestData.priority}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">SLA TAT</p>
            <p className="font-medium">{requestData.slaTat}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Expected Completion</p>
            <p className="font-medium">{requestData.expectedDate}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Days Remaining</p>
            <p className={cn(
              "font-medium",
              requestData.daysRemaining <= 3 && "text-danger",
              requestData.daysRemaining > 3 && requestData.daysRemaining <= 7 && "text-warning",
              requestData.daysRemaining > 7 && "text-success"
            )}>{requestData.daysRemaining} days</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Serial Number</p>
            <p className="font-medium">{requestData.serialNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Model</p>
            <p className="font-medium">{requestData.model}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge className={cn(
              requestData.status === "Open" && "bg-info/20 text-info",
              requestData.status === "In Progress" && "bg-warning/20 text-warning",
              requestData.status === "Closed" && "bg-success/20 text-success"
            )}>{requestData.status}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Workshop</p>
            <p className="font-medium">{requestData.workshop}</p>
          </div>
        </div>
      </motion.div>

      {/* Horizontal Stage Tracker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl p-6 shadow-soft-md mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">SOP Stage Tracker</h3>
          <div className="flex items-center gap-4 text-sm">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className="w-3 h-3 rounded-full bg-success"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-muted-foreground">Completed</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className="w-3 h-3 rounded-full bg-primary"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-muted-foreground">Active</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <span className="text-muted-foreground">Locked</span>
            </motion.div>
          </div>
        </div>
        
        {/* Professional Horizontal Timeline */}
        <div className="relative overflow-x-auto pb-6 pt-4 px-4 bg-[#f8f9fa] rounded-2xl">
          {/* Dashed Connecting Line */}
          <div className="absolute top-[calc(50%-12px)] left-8 right-8 flex items-center z-0">
            <svg className="w-full h-2" preserveAspectRatio="none">
              <line 
                x1="0" 
                y1="4" 
                x2="100%" 
                y2="4" 
                stroke="#d1d5db" 
                strokeWidth="2" 
                strokeDasharray="8 8"
              />
            </svg>
          </div>

          {/* Stages */}
          <div className="relative flex justify-between min-w-[900px] lg:min-w-0 z-10">
            {sopStages.map((stage, index) => {
              const progress = getStageProgress(stage);
              const isCompleted = stage.status === "completed";
              const isActive = stage.status === "active";
              const isPending = stage.status === "pending";
              
              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="flex flex-col items-center flex-1"
                >
                  <motion.button
                    // CRITICAL FIX: Unlocked clicking for admins
                    whileHover={{ scale: 1.1, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                    className="relative"
                  >
                    {/* Step Circle */}
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center",
                          "bg-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.4),0_4px_12px_rgba(0,0,0,0.15)]",
                          expandedStage === stage.id && "ring-4 ring-[#22c55e]/30"
                        )}
                      >
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          <Check className="w-8 h-8 lg:w-10 lg:h-10 text-white stroke-[3]" />
                        </motion.div>
                      </motion.div>
                    ) : isActive ? (
                      <motion.div
                        className={cn(
                          "w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center",
                          "border-4 border-[#22c55e] bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5",
                          "shadow-[0_0_25px_rgba(34,197,94,0.3),0_6px_16px_rgba(0,0,0,0.12)]",
                          expandedStage === stage.id && "ring-4 ring-[#22c55e]/20"
                        )}
                        animate={{ 
                          boxShadow: [
                            "0 0 20px rgba(34,197,94,0.3), 0 6px 16px rgba(0,0,0,0.12)",
                            "0 0 30px rgba(34,197,94,0.5), 0 6px 16px rgba(0,0,0,0.12)",
                            "0 0 20px rgba(34,197,94,0.3), 0 6px 16px rgba(0,0,0,0.12)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <motion.div 
                          className="w-4 h-4 bg-white rounded-full shadow-inner"
                          animate={{ 
                            scale: [1, 1.3, 1],
                            opacity: [1, 0.8, 1]
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </motion.div>
                    ) : (
                      <div
                        className={cn(
                          "w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center",
                          "border-2 border-[#d1d5db] bg-white",
                          "shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                        )}
                      >
                        <span className="text-[#9ca3af] font-semibold text-lg lg:text-xl">
                          {index + 1}
                        </span>
                      </div>
                    )}
                    
                    {/* Progress indicator badge for active stage */}
                    {isActive && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-6 h-6 bg-[#22c55e] rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-md border-2 border-white"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        {progress.completed}
                      </motion.div>
                    )}
                  </motion.button>
                  
                  {/* Stage Label */}
                  <motion.p 
                    className={cn(
                      "text-[11px] mt-3 text-center font-semibold max-w-[80px] leading-tight",
                      isCompleted ? "text-[#22c55e]" : 
                      isActive ? "text-[#22c55e]" : "text-[#9ca3af]"
                    )}
                    animate={isActive ? { opacity: [1, 0.7, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {stage.name}
                  </motion.p>
                  
                  {/* Mini progress bar for non-pending stages */}
                  {!isPending && (
                    <motion.div 
                      className="mt-2 w-14 h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.div 
                        className={cn(
                          "h-full rounded-full",
                          isCompleted ? "bg-[#22c55e]" : "bg-[#22c55e]/60"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Stage Checklist - View Only for Admin */}
      <AnimatePresence mode="wait">
        {expandedStage && (
          <motion.div
            key={expandedStage}
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-xl shadow-soft-md mb-6 overflow-hidden"
          >
            {(() => {
              const currentStage = sopStages.find((s) => s.id === expandedStage);
              if (!currentStage) return null;
              const progress = getStageProgress(currentStage);
              
              return (
                <>
                  {/* Stage Header */}
                  <motion.div 
                    className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <motion.div 
                          className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center shadow-md",
                            currentStage.status === "completed" ? "bg-success text-success-foreground" :
                            currentStage.status === "active" ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}
                          animate={currentStage.status === "active" ? { rotate: [0, 5, -5, 0] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <AnimatedIcon isActive={currentStage.status === "active"}>
                            {stageIconMap[currentStage.name]}
                          </AnimatedIcon>
                        </motion.div>
                        <div>
                          <h3 className="text-xl font-semibold flex items-center gap-2">
                            <span className="text-2xl">{currentStage.icon}</span> {currentStage.name}
                            {currentStage.status === "completed" && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500 }}
                              >
                                <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                                  <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                                </Badge>
                              </motion.div>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <Gauge className="w-4 h-4" />
                            <span className="font-medium">Purpose:</span> {currentStage.purpose}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <Badge variant="outline" className={cn(
                            "text-sm py-1 px-3",
                            progress.percentage === 100 ? "bg-success/10 text-success border-success/30" :
                            progress.percentage > 50 ? "bg-primary/10 text-primary border-primary/30" :
                            "bg-warning/10 text-warning border-warning/30"
                          )}>
                            {progress.completed} / {progress.total} items
                          </Badge>
                        </motion.div>
                        {currentStage.laborTime && (
                          <motion.div whileHover={{ scale: 1.05 }}>
                            <Badge variant="outline" className="bg-muted text-sm py-1 px-3">
                              <Timer className="w-3 h-3 mr-1" />
                              {currentStage.laborTime}
                            </Badge>
                          </motion.div>
                        )}
                        {currentStage.technician && (
                          <motion.div whileHover={{ scale: 1.05 }}>
                            <Badge variant="outline" className="bg-muted text-sm py-1 px-3">
                              <User className="w-3 h-3 mr-1" />
                              {currentStage.technician}
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Tracking Badges */}
                    {(currentStage.trackConsumables || currentStage.trackSpares) && (
                      <motion.div 
                        className="flex flex-wrap gap-2 mt-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        {currentStage.trackConsumables && (
                          <motion.div whileHover={{ scale: 1.02 }}>
                            <Badge className="bg-info/20 text-info border border-info/30 hover:bg-info/30 py-1.5 px-3">
                              <Droplets className="w-4 h-4 mr-2" />
                              <span className="font-medium">Consumables:</span> {currentStage.consumablesInfo}
                            </Badge>
                          </motion.div>
                        )}
                        {currentStage.trackSpares && (
                          <motion.div whileHover={{ scale: 1.02 }}>
                            <Badge className="bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30 py-1.5 px-3">
                              <Box className="w-4 h-4 mr-2" />
                              <span className="font-medium">Spares/Tools:</span> {currentStage.sparesInfo}
                            </Badge>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Stage Lock Warning */}
                    <motion.div 
                      className="mt-4 flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-3 border border-warning/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Lock className="w-4 h-4 text-warning shrink-0" />
                      </motion.div>
                      <span><strong className="text-warning">🔒 Stage Status:</strong> {currentStage.stageLock}</span>
                    </motion.div>
                  </motion.div>

                  {/* Checklist Items - View Only with Expandable Details */}
                  <div className="p-6">
                    <div className="space-y-3">
                      {currentStage.checklist.map((item, index) => {
                        const itemKey = `${currentStage.id}-${item.id}`;
                        const isExpanded = expandedItems[itemKey] || false;
                        const hasDetails = item.completed && (item.photoUrl || item.documentName || item.laborTime || item.delayMessage || item.note || item.selectedValue || item.inputValue);

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Collapsible open={isExpanded} onOpenChange={() => hasDetails && toggleItemExpanded(currentStage.id, item.id)}>
                              <motion.div
                                className={cn(
                                  "flex flex-col rounded-xl border transition-all overflow-hidden",
                                  item.completed
                                    ? "bg-success/5 border-success/20"
                                    : "bg-muted/30 border-border"
                                )}
                                whileHover={hasDetails ? { scale: 1.01, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } : {}}
                              >
                                <CollapsibleTrigger asChild disabled={!hasDetails}>
                                  <div
                                    className={cn(
                                      "flex items-center justify-between p-4 gap-3",
                                      hasDetails && "cursor-pointer hover:bg-muted/50"
                                    )}
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <motion.div 
                                        className={cn(
                                          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                                          item.completed 
                                            ? "bg-success border-success text-success-foreground" 
                                            : "border-muted-foreground/40"
                                        )}
                                        initial={item.completed ? { scale: 0 } : {}}
                                        animate={item.completed ? { scale: 1 } : {}}
                                        transition={{ type: "spring", stiffness: 500 }}
                                      >
                                        {item.completed && (
                                          <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                          </motion.div>
                                        )}
                                      </motion.div>
                                      <div className="flex-1">
                                        <span className={cn(
                                          "font-medium",
                                          item.completed && "text-foreground"
                                        )}>
                                          {item.text}
                                        </span>
                                        {item.note && (
                                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                            <StickyNote className="w-3 h-3" />
                                            {item.note}
                                          </p>
                                        )}
                                        {item.attachmentLabel && (
                                          <p className="text-xs text-primary/80 mt-0.5 flex items-center gap-1">
                                            <Paperclip className="w-3 h-3" />
                                            Required: {item.attachmentLabel}
                                          </p>
                                        )}
                                        {item.consumableInfo && (
                                          <p className="text-xs text-info mt-0.5 flex items-center gap-1">
                                            <Box className="w-3 h-3" />
                                            📦 {item.consumableInfo}
                                          </p>
                                        )}
                                        {item.spareInfo && (
                                          <p className="text-xs text-warning mt-0.5 flex items-center gap-1">
                                            <Wrench className="w-3 h-3" />
                                            📦 {item.spareInfo}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      {item.photoUrl && (
                                        <motion.div whileHover={{ scale: 1.1 }}>
                                          <Badge variant="outline" className="text-xs gap-1 bg-primary/5">
                                            <Camera className="w-3 h-3" />
                                            📷
                                          </Badge>
                                        </motion.div>
                                      )}
                                      {item.documentName && (
                                        <motion.div whileHover={{ scale: 1.1 }}>
                                          <Badge variant="outline" className="text-xs gap-1 bg-primary/5">
                                            <FileText className="w-3 h-3" />
                                            📎
                                          </Badge>
                                        </motion.div>
                                      )}
                                      {hasDetails && (
                                        <motion.div
                                          animate={{ rotate: isExpanded ? 180 : 0 }}
                                          transition={{ duration: 0.2 }}
                                        >
                                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                        </motion.div>
                                      )}
                                    </div>
                                  </div>
                                </CollapsibleTrigger>

                                {/* Expanded Details */}
                                <CollapsibleContent>
                                  {item.completed && hasDetails && (
                                    <motion.div 
                                      className="px-4 pb-4 pt-0 border-t border-border/50"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.1 }}
                                    >
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                        {/* Completion Info */}
                                        <motion.div 
                                          className="space-y-2"
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: 0.1 }}
                                        >
                                          <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                            <User className="w-3 h-3" /> Completion Details
                                          </p>
                                          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                            {item.completedBy && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <motion.div whileHover={{ scale: 1.1 }}>
                                                  <User className="w-4 h-4 text-primary" />
                                                </motion.div>
                                                <span className="font-medium">👤 {item.completedBy}</span>
                                              </div>
                                            )}
                                            {item.completedAt && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <motion.div whileHover={{ scale: 1.1 }}>
                                                  <Clock className="w-4 h-4 text-primary" />
                                                </motion.div>
                                                <span>🕒 {item.completedAt}</span>
                                              </div>
                                            )}
                                            {item.laborTime && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <motion.div whileHover={{ scale: 1.1 }}>
                                                  <Timer className="w-4 h-4 text-success" />
                                                </motion.div>
                                                <span className="text-success font-medium">⏱️ Labor: {item.laborTime}</span>
                                              </div>
                                            )}
                                            {item.selectedValue && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <motion.div whileHover={{ scale: 1.1 }}>
                                                  <Check className="w-4 h-4 text-info" />
                                                </motion.div>
                                                <span className="text-info">Selected: {item.selectedValue}</span>
                                              </div>
                                            )}
                                            {item.inputValue && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <motion.div whileHover={{ scale: 1.1 }}>
                                                  <Gauge className="w-4 h-4 text-info" />
                                                </motion.div>
                                                <span className="text-info">Value: {item.inputValue}</span>
                                              </div>
                                            )}
                                          </div>
                                        </motion.div>

                                        {/* Photo */}
                                        {item.photoUrl && (
                                          <motion.div 
                                            className="space-y-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                          >
                                            <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                              <Camera className="w-3 h-3" /> 📷 Photo Evidence
                                            </p>
                                            <motion.div 
                                              className="bg-muted/50 rounded-lg p-3"
                                              whileHover={{ scale: 1.02 }}
                                            >
                                              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-2 overflow-hidden border">
                                                <img src={item.photoUrl} alt="Checklist photo" className="w-full h-full object-cover" />
                                              </div>
                                              {item.photoDescription && (
                                                <p className="text-xs text-muted-foreground flex items-start gap-1">
                                                  <Image className="w-3 h-3 mt-0.5 shrink-0" />
                                                  {item.photoDescription}
                                                </p>
                                              )}
                                            </motion.div>
                                          </motion.div>
                                        )}

                                        {/* Document */}
                                        {item.documentUrl && (
                                          <motion.div 
                                            className="space-y-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                          >
                                            <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                              <FileText className="w-3 h-3" /> 📎 Document
                                            </p>
                                            <motion.div 
                                              className="bg-muted/50 rounded-lg p-3"
                                              whileHover={{ scale: 1.02 }}
                                            >
                                              <div className="flex items-center gap-3 p-2 bg-background rounded-lg border">
                                                <motion.div
                                                  whileHover={{ rotate: 10 }}
                                                >
                                                  <FileText className="w-8 h-8 text-primary" />
                                                </motion.div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium truncate">{item.documentName || "Attached Report"}</p>
                                                  <p className="text-xs text-muted-foreground">Click to view</p>
                                                </div>
                                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(item.documentUrl)}>
                                                    <Download className="w-4 h-4" />
                                                  </Button>
                                                </motion.div>
                                              </div>
                                            </motion.div>
                                          </motion.div>
                                        )}

                                        {/* Delay Message */}
                                        {item.delayMessage && (
                                          <motion.div 
                                            className="space-y-2 col-span-full"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                          >
                                            <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                              <AlertTriangle className="w-3 h-3" /> Delay Note
                                            </p>
                                            <motion.div 
                                              className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2"
                                              animate={{ x: [0, 2, -2, 0] }}
                                              transition={{ duration: 0.5, repeat: 2 }}
                                            >
                                              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                                              <p className="text-sm text-warning">{item.delayMessage}</p>
                                            </motion.div>
                                          </motion.div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </CollapsibleContent>
                              </motion.div>
                            </Collapsible>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}