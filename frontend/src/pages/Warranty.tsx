import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "@/lib/api";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  AlertTriangle,
  Clock,
  CheckCircle,
  Grid3X3,
  List,
  Search,
  Download,
  Printer,
  Edit3,
  User,
  Plus,
  Upload,
  Dumbbell,
  X,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KPICard } from "@/components/dashboard/KPICard";

// --- Protein Brand x Clean UI Configs ---
const workflowStages = ["Logged", "Assigned", "Joint Note", "Closure"];

const statusColors = {
  Urgent: "bg-teal-100 text-teal-800",
  Normal: "bg-blue-100 text-blue-700",
  Pending: "bg-amber-100 text-amber-700",
  Closed: "bg-slate-200 text-slate-800"
};

const warrantyColors = {
  Active: "bg-emerald-100 text-emerald-700",
  Expired: "bg-teal-100 text-teal-800"
};

export default function Warranty() {
  const [viewMode, setViewMode] = useState<"cards" | "grid">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCall, setSelectedCall] = useState<any>(null);

  // Real Backend Data State
  const [warrantyCalls, setWarrantyCalls] = useState<any[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  // Form State includes Status so you can trigger the Urgent KPI
  const [formData, setFormData] = useState({
    id: "",
    equipment: "",
    vendor: "",
    status: "Pending",
    issue: "",
    serial: "",
    warrantyStatus: "Active"
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // FETCH DATA
  const fetchCalls = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/warranty/calls/`);
      const data = await response.json();
      setWarrantyCalls(data);

      // Keep selected call updated
      if (selectedCall) {
        const updated = data.find((c: any) => c.id === selectedCall.id);
        if (updated) setSelectedCall(updated);
      }
    } catch (error) {
      console.error("Fetch failed", error);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  // --- DYNAMIC KPI CALCULATION ---
  const dynamicKPIs = useMemo(() => {
    const openCount = warrantyCalls.filter(c => c.status !== "Closed").length;
    const pendingCount = warrantyCalls.filter(c => c.status === "Pending").length;
    const closedCount = warrantyCalls.filter(c => c.status === "Closed").length;

    // Urgent Calls KPI explicitly counts items marked "Urgent"
    const urgentCount = warrantyCalls.filter(c => c.status === "Urgent").length;

    return [
      { title: "Open Calls", value: openCount.toString(), icon: Phone, variant: "info" as const },
      { title: "Pending Action", value: pendingCount.toString(), icon: Clock, variant: "warning" as const },
      { title: "Closed (MTD)", value: closedCount.toString(), icon: CheckCircle, variant: "success" as const },
      { title: "Urgent Calls", value: urgentCount.toString(), icon: AlertTriangle, variant: "danger" as const },
    ];
  }, [warrantyCalls]);

  // CRUD OPERATIONS
  const handleSaveComplaint = async () => {
    const isEditing = !!formData.id;
    const url = isEditing
      ? `${API_BASE_URL}/warranty/calls/${formData.id}/`
      : `${API_BASE_URL}/warranty/calls/`;

    // Strip empty ID if creating a new record
    const payload = { ...formData };
    if (!isEditing) delete payload.id;

    try {
      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${localStorage.getItem("token") || localStorage.getItem("authToken")}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // This reads Django's exact error message
        const errorData = await response.json();
        console.error("BACKEND REJECTED THE DATA:", errorData);
        alert(`Validation Error: ${JSON.stringify(errorData)}`);
        return;
      }

      setFormOpen(false);
      fetchCalls();
    } catch (err) {
      console.error("Network Error:", err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedCall) {
      await fetch(`${API_BASE_URL}/warranty/calls/${selectedCall.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "Joint Note" })
      });
      fetchCalls();
    }
  };

  const handleFinalizeClosure = async () => {
    if (!selectedCall) return;
    await fetch(`${API_BASE_URL}/warranty/calls/${selectedCall.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "Closure", status: "Closed" })
    });
    fetchCalls();
  };

  const handleExport = () => {
    if (warrantyCalls.length === 0) return;
    const csv =
      "ID,Equipment,Vendor,Status,Warranty,Stage\n" +
      warrantyCalls
        .map(c => `${c.id},${c.equipment},${c.vendor},${c.status},${c.warrantyStatus},${c.stage}`)
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = "warranty_report.csv";
    a.click();
  };

  // SAFE FILTERING
  const filteredCalls = warrantyCalls.filter((c) =>
    String(c.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(c.equipment || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(c.vendor || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
        accept=".pdf,.jpg,.png"
      />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-teal-600" /> Warranty Ops
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Issue Tracking & Resolution Dashboard
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-bold border-slate-300" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button
            className="gap-2 font-bold uppercase tracking-wide"
            onClick={() => {
              setFormData({
                id: "",
                equipment: "",
                vendor: "",
                status: "Pending",
                issue: "",
                serial: "",
                warrantyStatus: "Active"
              });
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Log Issue
          </Button>
        </div>
      </div>

      {/* DYNAMIC KPI SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {dynamicKPIs.map((kpi, index) => (
          <KPICard key={kpi.title} {...kpi} index={index} />
        ))}
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cards List */}
        <div className={cn("space-y-4", selectedCall ? "hidden lg:block lg:col-span-1" : "lg:col-span-3")}>
          {/* Tool Bar */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-slate-300"
              />
            </div>
            <div className="flex border border-slate-300 rounded-lg p-1 bg-white">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className={cn(viewMode === "cards" && "bg-slate-100 text-slate-900 shadow-none")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={cn(viewMode === "grid" && "bg-slate-100 text-slate-900 shadow-none")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className={cn("grid gap-4", !selectedCall && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
            {filteredCalls.length > 0 ? (
              filteredCalls.map((call) => (
                <div
                  key={call.id}
                  onClick={() => setSelectedCall(call)}
                  className={cn(
                    "bg-white p-5 rounded-2xl border shadow-sm cursor-pointer transition-all flex flex-col justify-between min-h-[180px]",
                    selectedCall?.id === call.id
                      ? "border-teal-600 ring-1 ring-teal-600"
                      : "border-slate-200 hover:border-red-400 hover:shadow-md"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-teal-600 text-base">{String(call.id)}</h4>
                      <p className="text-sm text-slate-500">{call.loggedDate || "Today"}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 items-end">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase",
                          statusColors[call.status as keyof typeof statusColors] || "bg-slate-100"
                        )}
                      >
                        {call.status}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase",
                          warrantyColors[call.warrantyStatus as keyof typeof warrantyColors] || "bg-slate-100"
                        )}
                      >
                        {call.warrantyStatus}
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-bold text-slate-900 text-[15px]">{call.equipment}</h3>
                    <p className="text-sm text-slate-500">{call.vendor}</p>
                  </div>

                  <div className="mt-auto">
                    <div className="flex gap-1.5 mb-3">
                      {workflowStages.map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1.5 flex-1 rounded-full",
                            i <= workflowStages.indexOf(call.stage) ? "bg-teal-500" : "bg-slate-100"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 text-center">
                      {call.stage} • SLA Due: {call.slaDue || "Pending"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
                No complaints found. Log a new issue to get started!
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Details Panel */}
        <AnimatePresence>
          {selectedCall && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-md sticky top-24 h-fit"
            >
              {/* Mobile Back Button */}
              <Button
                variant="ghost"
                className="lg:hidden mb-4 -ml-4 font-bold text-slate-500"
                onClick={() => setSelectedCall(null)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to list
              </Button>

              <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase text-slate-900 tracking-tight">
                    {selectedCall.id}
                  </h2>
                  <p className="text-slate-500 font-semibold">{selectedCall.equipment}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-slate-300"
                    onClick={() => window.print()}
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-slate-300"
                    onClick={() => {
                      setFormData(selectedCall);
                      setFormOpen(true);
                    }}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden lg:flex text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                    onClick={() => setSelectedCall(null)}
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Serial Number</p>
                  <p className="font-semibold text-slate-900">{selectedCall.serial}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Vendor</p>
                  <p className="font-semibold text-slate-900">{selectedCall.vendor}</p>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="font-bold text-slate-900 text-sm mb-3 uppercase tracking-wide">
                  Issue Description
                </h4>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed">
                  {selectedCall.issue}
                </div>
              </div>

              {/* Assignment Banner */}
              {selectedCall.assigned_role ? (
                <div className="p-4 border border-slate-200 rounded-xl mb-8 bg-white shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm mb-1 flex items-center gap-2 uppercase tracking-wide">
                      <User className="w-4 h-4 text-teal-600" /> Assigned Department
                    </h4>
                    <p className="text-slate-700 font-semibold">{selectedCall.assigned_role}</p>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold px-3 py-1 rounded-full uppercase",
                      statusColors[selectedCall.status as keyof typeof statusColors]
                    )}
                  >
                    {selectedCall.status}
                  </span>
                </div>
              ) : (
                <div className="p-4 border border-amber-200 rounded-xl mb-8 bg-amber-50 flex items-center justify-between">
                  <div>
                    <p className="text-amber-800 font-bold text-sm uppercase tracking-wide">
                      No Resource Assigned
                    </p>
                    <p className="text-amber-600 text-xs mt-1">
                      Assign a technician to start resolving this issue.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
                    onClick={() => setAssignOpen(true)}
                  >
                    Assign
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button
                  variant="outline"
                  className="w-full sm:flex-1 border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" /> Upload Joint Note
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:flex-1 border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
                  onClick={() => setAssignOpen(true)}
                >
                  Reassign Dept
                </Button>
                {selectedCall.stage === "Joint Note" && (
                  <Button
                    className="w-full sm:flex-1 bg-slate-900 hover:bg-black text-white font-bold uppercase tracking-wide"
                    onClick={handleFinalizeClosure}
                  >
                    Finalize Closure
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- ADD / EDIT RECORD MODAL --- */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-black text-2xl uppercase tracking-tight">
              {formData.id ? "Modify Record" : "Log New Issue"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Manage your warranty call details.
            </p>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div>
              <Label className="font-bold text-xs text-slate-500 uppercase">Equipment Name</Label>
              <Input
                className="mt-1 border-slate-300"
                value={formData.equipment}
                onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-bold text-xs text-slate-500 uppercase">Vendor</Label>
                <Input
                  className="mt-1 border-slate-300"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                />
              </div>
              <div>
                <Label className="font-bold text-xs text-slate-500 uppercase">Serial Number</Label>
                <Input
                  className="mt-1 border-slate-300"
                  value={formData.serial}
                  onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                />
              </div>
            </div>

            {/* NEW: Explicit Status Selectors to Drive the KPIs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-bold text-xs text-slate-500 uppercase">Priority Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-bold text-xs text-slate-500 uppercase">Warranty Status</Label>
                <Select
                  value={formData.warrantyStatus}
                  onValueChange={(val) => setFormData({ ...formData, warrantyStatus: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="font-bold text-xs text-slate-500 uppercase">Issue Details</Label>
              <Textarea
                className="mt-1 resize-none border-slate-300"
                rows={4}
                value={formData.issue}
                onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
              />
            </div>

            <Button
              onClick={handleSaveComplaint}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold uppercase tracking-wide h-12 mt-2"
            >
              Save Complaint
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- ASSIGNMENT MODAL --- */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-black text-xl uppercase">Assign Resource</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Assign a department to handle the selected warranty issue.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Label className="font-bold text-xs text-slate-500 uppercase">Select Department</Label>
            <Select
              onValueChange={async (val) => {
                await fetch(`${API_BASE_URL}/warranty/calls/${selectedCall.id}/`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ assigned_role: val, stage: "Assigned" })
                });
                fetchCalls();
                setAssignOpen(false);
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Pick a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Financer">Financer</SelectItem>
                <SelectItem value="Sales">Sales Rep</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Technician">Field Technician</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
} 