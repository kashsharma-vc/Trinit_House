import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/api";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronLeft, Check, Camera, Upload, Loader2, Save, AlertTriangle, User, Paperclip
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Reusing your existing interfaces...
interface ChecklistItemData {
  id: number;
  text: string;
  completed: boolean;
  note?: string;
  photoUrl?: string;
}

interface SopStage {
  id: number;
  name: string;
  status: "completed" | "active" | "pending";
  checklist: ChecklistItemData[];
}

export default function TechnicianRequestView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sopStages, setSopStages] = useState<SopStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<number | null>(1);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Local state to handle form inputs before saving to backend
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  useEffect(() => {
    // Fetch your data exactly as you do in RequestView.tsx
    // (Omitted standard fetch logic for brevity - paste your existing fetchRequestDetails here)
  }, [id]);

  // --- NEW: Interactive Submission Logic ---
  const handleUpdateItem = async (stageId: number, itemId: number, updates: Partial<ChecklistItemData>, file?: File) => {
    setUploadingId(itemId);
    
    // Use FormData because we are sending files (images) alongside text
    const formData = new FormData();
    if (updates.completed !== undefined) formData.append("completed", String(updates.completed));
    if (updates.note) formData.append("note", updates.note);
    if (file) formData.append("attachment", file);

    try {
      // Assuming you have an endpoint in your operations app to update specific checklist items
      const token = localStorage.getItem("token"); // Get the technician's auth token
      
      const response = await fetch(`${API_BASE_URL}/operations/checklist-items/${itemId}/`, {
        method: "PATCH",
        headers: {
          "Authorization": `Token ${token}` // This tells Django exactly WHO is making the edit
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to update item");
      
      const updatedItem = await response.json();
      
      // Update local state to reflect the change visually
      setSopStages(prev => prev.map(stage => {
        if (stage.id === stageId) {
          return {
            ...stage,
            checklist: stage.checklist.map(item => item.id === itemId ? { ...item, ...updatedItem } : item)
          };
        }
        return stage;
      }));
      
      toast.success("Task updated successfully");
    } catch (error) {
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setUploadingId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, stageId: number, itemId: number) => {
    if (e.target.files && e.target.files[0]) {
      handleUpdateItem(stageId, itemId, {}, e.target.files[0]);
    }
  };

  if (isLoading) return <MainLayout><div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div></MainLayout>;

  return (
    <MainLayout>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/requests")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Technician Execution: Request {id}</h1>
      </div>

      {/* Render Horizontal Stage Tracker here (identical to your RequestView.tsx) */}

      {/* Interactive Checklist */}
      <AnimatePresence mode="wait">
        {expandedStage && (
          <motion.div className="bg-card rounded-xl shadow-soft-md mb-6 overflow-hidden">
            {(() => {
              const currentStage = sopStages.find((s) => s.id === expandedStage);
              if (!currentStage) return null;

              return (
                <div className="p-6 space-y-4">
                  <h3 className="font-bold text-lg mb-4">{currentStage.name} Execution</h3>
                  
                  {currentStage.checklist.map((item) => (
                    <div key={item.id} className={cn("border rounded-xl p-4 transition-all", item.completed ? "bg-success/5 border-success/30" : "bg-card")}>
                      
                      <div className="flex items-start gap-4">
                        {/* Interactive Checkbox */}
                        <button 
                          onClick={() => handleUpdateItem(currentStage.id, item.id, { completed: !item.completed })}
                          disabled={uploadingId === item.id}
                          className={cn(
                            "w-6 h-6 mt-1 rounded border-2 flex items-center justify-center transition-all",
                            item.completed ? "bg-success border-success text-white" : "border-muted-foreground/40 hover:border-primary"
                          )}
                        >
                          {item.completed && <Check className="w-4 h-4" />}
                        </button>

                        <div className="flex-1 space-y-3">
                          <p className={cn("font-medium text-lg", item.completed && "text-muted-foreground line-through")}>
                            {item.text}
                          </p>

                          {/* Image Upload UI */}
                          <div className="flex items-center gap-4">
                            <label className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer hover:bg-muted transition-all",
                              uploadingId === item.id && "opacity-50 pointer-events-none"
                            )}>
                              {uploadingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4 text-primary" />}
                              <span className="text-sm font-medium text-muted-foreground">Upload Photo Evidence</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleFileChange(e, currentStage.id, item.id)}
                              />
                            </label>

                            {item.photoUrl && (
                              <Badge className="bg-success/20 text-success border-success/30 px-3 py-1.5">
                                <Check className="w-3 h-3 mr-1" /> Image Attached
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}