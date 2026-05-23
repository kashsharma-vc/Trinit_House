import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
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
import { Plus, Search, Eye, Edit, ChevronLeft, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

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
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // 1. Data States
  const [requestsData, setRequestsData] = useState<any[]>([]);
  
  // NEW: States to hold your dropdown options from Django Setup APIs
  const [zones, setZones] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [compressors, setCompressors] = useState<any[]>([]);

  // 2. Form State
  const [formData, setFormData] = useState({
    request_type: "Repair",
    priority: "Medium",
    status: "Open",
    description: "",
    compressor_model: "",
    serial_number: "",
    expected_date: new Date().toISOString().split("T")[0],
    zone_id: "",
    workshop_id: "",
    compressor_id: "",
  });

  // 3. Fetch EVERYTHING on page load
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch requests and setup masters all at the same time
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

        // Safely extract arrays (handles Django pagination)
        const rawRequests = Array.isArray(reqData) ? reqData : (reqData.results || []);
        setZones(Array.isArray(zoneData) ? zoneData : (zoneData.results || []));
        setWorkshops(Array.isArray(wsData) ? wsData : (wsData.results || []));
        setCompressors(Array.isArray(compData) ? compData : (compData.results || []));

        // Format requests for the table
        const formattedRequests = rawRequests.map((req: any) => ({
          id: req.request_id,
          date: req.request_date,
          zone: req.zone_name || "Unassigned",
          workshop: req.workshop_name || "Unassigned",
          type: req.request_type,
          compressor: req.compressor_type || "Unknown",
          priority: req.priority,
          status: req.status,
          expectedDate: req.expected_date || "TBD",
        }));

        setRequestsData(formattedRequests);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchAllData();
  }, []);

  // 4. Submit Function
  const handleSubmit = async () => {
    try {
      // Clean data before sending to Django
      const payload = {
        request_type: formData.request_type,
        priority: formData.priority,
        status: formData.status,
        description: formData.description,
        compressor_model: formData.compressor_model,
        serial_number: formData.serial_number,
        expected_date: formData.expected_date || null,
        // Convert the string dropdown values back into integers for Django
        zone: formData.zone_id ? parseInt(formData.zone_id) : null,
        workshop: formData.workshop_id ? parseInt(formData.workshop_id) : null,
        compressor: formData.compressor_id ? parseInt(formData.compressor_id) : null,
      };

      const response = await fetch(`${API_BASE_URL}/operations/requests/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Django Error:", errorData);
        alert("Failed to save! Check the console.");
        return;
      }

      const newRequest = await response.json();
      
      const formattedNewRequest = {
        id: newRequest.request_id,
        date: newRequest.request_date,
        zone: newRequest.zone_name || "Unassigned",
        workshop: newRequest.workshop_name || "Unassigned",
        type: newRequest.request_type,
        compressor: newRequest.compressor_type || "Unknown",
        priority: newRequest.priority,
        status: newRequest.status,
        expectedDate: newRequest.expected_date || "TBD",
      };

      setRequestsData([formattedNewRequest, ...requestsData]);
      setShowForm(false);
      
      // Reset form
      setFormData({
        request_type: "Repair",
        priority: "Medium",
        status: "Open",
        description: "",
        compressor_model: "",
        serial_number: "",
        expected_date: new Date().toISOString().split("T")[0],
        zone_id: "",
        workshop_id: "",
        compressor_id: "",
      });

    } catch (error) {
      console.error("Network error:", error);
    }
  };

  const filteredRequests = requestsData.filter(
    (req) =>
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.workshop.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Request
              </Button>
            </div>

            {/* Filters */}
            <div className="filter-bar mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, Zone, Workshop..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl shadow-soft-md overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Date</th>
                      <th>Zone</th>
                      <th>Workshop</th>
                      <th>Type</th>
                      <th>Compressor</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Expected Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req, index) => (
                      <motion.tr
                        key={req.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/requests/${req.id}`)}
                      >
                        <td className="font-medium text-primary">{req.id}</td>
                        <td>{req.date}</td>
                        <td>{req.zone}</td>
                        <td>{req.workshop}</td>
                        <td>{req.type}</td>
                        <td>{req.compressor}</td>
                        <td className={priorityColors[req.priority as keyof typeof priorityColors] || ""}>
                          {req.priority}
                        </td>
                        <td>
                          <span className={cn("status-badge", statusColors[req.status as keyof typeof statusColors] || "")}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {req.status}
                          </span>
                        </td>
                        <td>{req.expectedDate}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/requests/${req.id}`); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
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
                  <h1 className="text-2xl font-bold text-foreground">Create New Request</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline">Save Draft</Button>
                <Button onClick={handleSubmit}>Submit Request</Button>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Section 1: Request Details */}
              <motion.div className="bg-card rounded-xl p-6 shadow-soft-md">
                <h3 className="text-lg font-semibold mb-4">Request Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Expected Date</Label>
                      <Input 
                        type="date" 
                        value={formData.expected_date} 
                        onChange={(e) => setFormData({...formData, expected_date: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select 
                        value={formData.priority} 
                        onValueChange={(val) => setFormData({...formData, priority: val})}
                      >
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
                    
                    {/* DYNAMIC ZONE DROPDOWN */}
                    <div className="space-y-2">
                      <Label>Zone</Label>
                      <Select 
                        value={formData.zone_id} 
                        onValueChange={(val) => setFormData({...formData, zone_id: val})}
                      >
                        <SelectTrigger><SelectValue placeholder="Select Zone" /></SelectTrigger>
                        <SelectContent>
                          {zones.map((z) => (
                            <SelectItem key={z.id} value={z.id.toString()}>{z.zone_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* DYNAMIC WORKSHOP DROPDOWN */}
                    <div className="space-y-2">
                      <Label>Workshop</Label>
                      <Select 
                        value={formData.workshop_id} 
                        onValueChange={(val) => setFormData({...formData, workshop_id: val})}
                      >
                        <SelectTrigger><SelectValue placeholder="Select Workshop" /></SelectTrigger>
                        <SelectContent>
                          {workshops.map((w) => (
                            <SelectItem key={w.id} value={w.id.toString()}>{w.workshop_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                  </div>
                  <div className="space-y-2">
                    <Label>Request Type</Label>
                    <Select 
                      value={formData.request_type} 
                      onValueChange={(val) => setFormData({...formData, request_type: val})}
                    >
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
                    <Textarea 
                      placeholder="Describe the issue or request..." 
                      rows={4} 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Section 2: Compressor Details */}
              <motion.div className="bg-card rounded-xl p-6 shadow-soft-md">
                <h3 className="text-lg font-semibold mb-4">Compressor Details</h3>
                <div className="space-y-4">
                  
                  {/* DYNAMIC COMPRESSOR DROPDOWN */}
                  <div className="space-y-2">
                    <Label>Compressor Master</Label>
                    <Select 
                        value={formData.compressor_id} 
                        onValueChange={(val) => setFormData({...formData, compressor_id: val})}
                      >
                        <SelectTrigger><SelectValue placeholder="Select Compressor" /></SelectTrigger>
                        <SelectContent>
                          {compressors.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.compressor_type} {c.model ? `(${c.model})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Compressor Model (Specific)</Label>
                    <Input 
                      placeholder="Enter model number" 
                      value={formData.compressor_model}
                      onChange={(e) => setFormData({...formData, compressor_model: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Serial Number</Label>
                    <Input 
                      placeholder="Enter serial number" 
                      value={formData.serial_number}
                      onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Section 3: Metadata */}
              <motion.div className="bg-card rounded-xl p-6 shadow-soft-md lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(val) => setFormData({...formData, status: val})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Created By</Label>
                    <Input value="Admin User" disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Created On</Label>
                    <Input value={new Date().toLocaleDateString()} disabled className="bg-muted" />
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