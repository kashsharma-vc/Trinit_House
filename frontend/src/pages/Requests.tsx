import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Search, Eye, Edit, ChevronLeft, Upload, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";

const statusColors = {
  Open: "status-info",
  "In Progress": "status-warning",
  Closed: "status-safe",
  Draft: "status-badge bg-muted text-muted-foreground",
};

const priorityColors = {
  High: "text-danger font-medium",
  Medium: "text-warning font-medium",
  Low: "text-muted-foreground",
};

export default function Requests() {
  const navigate = useNavigate();
  
  // --- UI STATES ---
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- DATA STATES ---
  const [requestsData, setRequestsData] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [compressors, setCompressors] = useState<any[]>([]);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    id: "",
    request_type: "Repair",
    priority: "Medium",
    status: "Open",
    description: "",
    compressor_model: "",
    serial_number: "",
    expected_date: new Date().toISOString().split("T")[0],
    zone_id: undefined as string | undefined,
    workshop_id: undefined as string | undefined,
    compressor_id: undefined as string | undefined,
    
    // Extra UI fields (Will be kept in state for UI, but backend might not accept them yet)
    requester_name: "", department: "", designation: "", penalty_applicable: false
  });

  // --- FILE UPLOAD STATE ---
  const [file, setFile] = useState<File | null>(null);

  // --- FETCH ALL DATA ---
  const fetchAllData = async () => {
    try {
      const [reqRes, zoneRes, wsRes, compRes] = await Promise.all([
        fetch(`${API_BASE_URL}/operations/requests/`),
        fetch(`${API_BASE_URL}/setups/zones/`),
        fetch(`${API_BASE_URL}/setups/workshops/`),
        fetch(`${API_BASE_URL}/setups/compressors/`)
      ]);

      const reqData = await reqRes.json();
      const zoneData = await zoneRes.json();
      const wsData = await wsRes.json();
      const compData = await compRes.json();

      setZones(Array.isArray(zoneData) ? zoneData : (zoneData.results || []));
      setWorkshops(Array.isArray(wsData) ? wsData : (wsData.results || []));
      setCompressors(Array.isArray(compData) ? compData : (compData.results || []));

      const rawRequests = Array.isArray(reqData) ? reqData : (reqData.results || []);

      const formattedRequests = rawRequests.map((req: any) => ({
        id: req.request_id || req.id,
        date: req.request_date || req.created_on?.split("T")[0] || "N/A",
        zone: req.zone_name || "Unassigned",
        zoneId: req.zone,
        workshop: req.workshop_name || "Unassigned",
        workshopId: req.workshop,
        type: req.request_type || "Repair",
        compressor: req.compressor_type || "Unknown",
        compressorId: req.compressor,
        priority: req.priority || "Medium",
        status: req.status || "Open",
        expectedDate: req.expected_date?.split("T")[0] || "",
        serialNumber: req.serial_number || "",
        compressorModel: req.compressor_model || "",
        description: req.description || ""
      }));

      setRequestsData(formattedRequests);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- ACTION HANDLERS ---
  const openAddForm = () => {
    setFormData({
      id: "", request_type: "Repair", priority: "Medium", status: "Open", description: "",
      compressor_model: "", serial_number: "", expected_date: new Date().toISOString().split("T")[0],
      zone_id: undefined, workshop_id: undefined, compressor_id: undefined,
      requester_name: "", department: "", designation: "", penalty_applicable: false
    });
    setFile(null); // Reset file state
    setShowForm(true);
  };

  const openEditForm = (req: any) => {
    setFormData({
      id: req.id,
      request_type: req.type,
      priority: req.priority,
      status: req.status,
      description: req.description,
      compressor_model: req.compressorModel,
      serial_number: req.serialNumber,
      expected_date: req.expectedDate,
      zone_id: req.zoneId ? String(req.zoneId) : undefined,
      workshop_id: req.workshopId ? String(req.workshopId) : undefined,
      compressor_id: req.compressorId ? String(req.compressorId) : undefined,
      requester_name: "", department: "", designation: "", penalty_applicable: false
    });
    setFile(null); // Reset file state
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    if (e.target.files && e.target.files.length > 0) { 
      setFile(e.target.files[0]); 
    } 
  };

  const handleSubmit = async (isDraft = false) => {
    setIsSubmitting(true);
    const isEditing = !!formData.id;
    const url = isEditing 
      ? `${API_BASE_URL}/operations/requests/${formData.id}/` 
      : `${API_BASE_URL}/operations/requests/`;

    const formDataObj = new FormData();

    // Append standard text/select fields
    formDataObj.append('request_type', formData.request_type);
    formDataObj.append('priority', formData.priority);
    formDataObj.append('status', isDraft ? "Draft" : formData.status);
    formDataObj.append('description', formData.description);
    formDataObj.append('compressor_model', formData.compressor_model);
    formDataObj.append('serial_number', formData.serial_number);
    
    // Append fields that might be null/undefined
    if (formData.expected_date) {
      formDataObj.append('expected_date', formData.expected_date);
    }
    if (formData.zone_id) {
      formDataObj.append('zone', formData.zone_id);
    }
    if (formData.workshop_id) {
      formDataObj.append('workshop', formData.workshop_id);
    }
    if (formData.compressor_id) {
      formDataObj.append('compressor', formData.compressor_id);
    }

    // Append the actual file
    if (file) {
      formDataObj.append('attachment', file);
    }

    try {
      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        // IMPORTANT: DO NOT set "Content-Type": "application/json"
        // Browser sets it automatically when using FormData
        body: formDataObj,
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Failed to save: ${JSON.stringify(errorData)}`);
        return;
      }

      setShowForm(false);
      setFile(null);
      fetchAllData();
    } catch (error) {
      alert("Network error saving request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FILTERS ---
  const filteredRequests = requestsData.filter((req) => {
    const matchesSearch = 
      String(req.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.workshop.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesZone = zoneFilter === "all" || String(req.zoneId) === zoneFilter;
    const matchesStatus = statusFilter === "all" || req.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesZone && matchesStatus;
  });

  return (
    <MainLayout>
      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Service Requests</h1>
                <p className="text-muted-foreground mt-1">Manage and track service requests</p>
              </div>
              <Button onClick={openAddForm} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Request
              </Button>
            </div>

            {/* Filters */}
            <div className="filter-bar mb-6 flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, Zone, Workshop..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Zones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={String(z.id)}>{z.zone_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl shadow-soft-md overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="data-table w-full text-left text-sm">
                  <thead className="bg-slate-50 font-black uppercase text-[11px] text-slate-500 border-b">
                    <tr>
                      <th className="p-4">Request ID</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Zone</th>
                      <th className="p-4">Workshop</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Compressor</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Expected Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((req, index) => (
                      <motion.tr
                        key={req.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => navigate(`/requests/${req.id}`)}
                      >
                        <td className="p-4 font-bold text-primary">#{req.id}</td>
                        <td className="p-4 text-slate-500">{req.date}</td>
                        <td className="p-4 font-medium">{req.zone}</td>
                        <td className="p-4 text-slate-600">{req.workshop}</td>
                        <td className="p-4 font-medium">{req.type}</td>
                        <td className="p-4 text-slate-600">{req.compressor}</td>
                        <td className={cn("p-4", priorityColors[req.priority as keyof typeof priorityColors])}>
                          {req.priority}
                        </td>
                        <td className="p-4">
                          <span className={cn("status-badge", statusColors[req.status as keyof typeof statusColors])}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {req.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">{req.expectedDate}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => { e.stopPropagation(); navigate(`/requests/${req.id}`); }}
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => { e.stopPropagation(); openEditForm(req); }}
                            >
                              <Edit className="w-4 h-4 text-primary" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredRequests.length} requests
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm" disabled={filteredRequests.length < 10}>Next</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {/* Form Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {formData.id ? `Edit Request #${formData.id}` : "Create New Request"}
                  </h1>
                  <p className="text-muted-foreground mt-1">Fill in the details for the service request</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                >
                  Save Draft
                </Button>
                <Button 
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                >
                  {formData.id ? "Save Changes" : "Submit Request"}
                </Button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Section 1: Request Details */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-6 shadow-soft-md border">
                <h3 className="text-lg font-semibold mb-4">Request Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Expected Completion Date</Label>
                      <Input type="date" value={formData.expected_date} onChange={(e) => setFormData({...formData, expected_date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={formData.priority} onValueChange={(val) => setFormData({...formData, priority: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Zone</Label>
                      <Select value={formData.zone_id || undefined} onValueChange={(val) => setFormData({...formData, zone_id: val})}>
                        <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                        <SelectContent>
                          {zones.map((z) => (<SelectItem key={z.id} value={String(z.id)}>{z.zone_name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Workshop</Label>
                      <Select value={formData.workshop_id || undefined} onValueChange={(val) => setFormData({...formData, workshop_id: val})}>
                        <SelectTrigger><SelectValue placeholder="Select workshop" /></SelectTrigger>
                        <SelectContent>
                          {workshops.map((w) => (<SelectItem key={w.id} value={String(w.id)}>{w.workshop_name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Request Type</Label>
                    <Select value={formData.request_type} onValueChange={(val) => setFormData({...formData, request_type: val})}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Repair">Repair</SelectItem>
                        <SelectItem value="Inspection">Inspection</SelectItem>
                        <SelectItem value="Warranty">Warranty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea placeholder="Describe the issue or request..." rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  </div>
                  
                  {/* Updated Attachments Section */}
                  <div className="space-y-2"> 
                    <Label>Attachments</Label> 
                    <div 
                      className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer" 
                      onClick={() => document.getElementById('file-upload')?.click()} 
                    > 
                      <input 
                        id="file-upload" 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileChange} 
                      /> 
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" /> 
                      <p className="text-sm text-muted-foreground"> 
                        {file ? file.name : "Drop files here or click to upload"} 
                      </p> 
                    </div> 
                  </div>

                </div>
              </motion.div>

              {/* Section 2: Compressor Details */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl p-6 shadow-soft-md border">
                <h3 className="text-lg font-semibold mb-4">Compressor Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Compressor Type (Master)</Label>
                    <Select value={formData.compressor_id || undefined} onValueChange={(val) => setFormData({...formData, compressor_id: val})}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {compressors.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.compressor_type}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Compressor Model</Label>
                    <Input placeholder="Enter specific model" value={formData.compressor_model} onChange={(e) => setFormData({...formData, compressor_model: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Serial Number</Label>
                    <Input placeholder="Enter serial number" value={formData.serial_number} onChange={(e) => setFormData({...formData, serial_number: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>SOP Reference (UI Only)</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select SOP" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sop-elg-01">SOP-ELG-01 v2.1</SelectItem>
                        <SelectItem value="sop-rec-01">SOP-REC-01 v3.0</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mt-8 mb-4">Requester Info (UI Only)</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Requester Name</Label>
                    <Input placeholder="Enter name" value={formData.requester_name} onChange={(e) => setFormData({...formData, requester_name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select value={formData.department} onValueChange={(val) => setFormData({...formData, department: val})}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Designation</Label>
                      <Select value={formData.designation} onValueChange={(val) => setFormData({...formData, designation: val})}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="technician">Technician</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Section 3: SLA & Penalty */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-xl p-6 shadow-soft-md border">
                <h3 className="text-lg font-semibold mb-4">SLA & Penalty</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SLA TAT (Days)</Label>
                      <Input value="14" disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Expected Completion</Label>
                      <Input type="date" value={formData.expected_date} disabled className="bg-muted" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Penalty Applicable</p>
                      <p className="text-sm text-muted-foreground">Enable penalty calculation for SLA breaches</p>
                    </div>
                    <Switch checked={formData.penalty_applicable} onCheckedChange={(val) => setFormData({...formData, penalty_applicable: val})} />
                  </div>
                </div>
              </motion.div>

              {/* Section 4: Metadata */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-xl p-6 shadow-soft-md border">
                <h3 className="text-lg font-semibold mb-4">Metadata</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Created By</Label>
                      <Input value="Admin User" disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Created On</Label>
                      <Input value={new Date().toLocaleDateString()} disabled className="bg-muted" />
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}