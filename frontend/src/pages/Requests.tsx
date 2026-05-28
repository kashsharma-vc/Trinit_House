import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, ChevronLeft, User, Grid3X3, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

const statusColors = {
  Open: "bg-blue-100 text-blue-700",
  "In Progress": "bg-amber-100 text-amber-700",
  Closed: "bg-emerald-100 text-emerald-700",
  Draft: "bg-slate-100 text-slate-700",
};

const priorityColors = {
  High: "text-red-600 font-bold",
  Medium: "text-amber-600 font-bold",
  Low: "text-slate-500 font-medium",
};

const initialFormData = {
  zone_id: "",
  workshop_id: "",
  compressor_id: "",
  compressor_model: "",
  serial_number: "",
  priority: "Medium",
  request_type: "Repair",
  status: "Open",
  sla_days: 3,
  assigned_role: "",
  assigned_to: "",
};

export default function Requests() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Lists data states
  const [requests, setRequests] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [compressors, setCompressors] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  // Role-based assignment state
  const [selectedRole, setSelectedRole] = useState<string>("");
  const standardRoles = ["Technician", "Workshop Manager", "Supervisor", "Operator"];

  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState(initialFormData);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");

    if (!token) {
      toast.error("Authentication expired. Please log in again.");
      navigate("/login");
      return null;
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    };
  };

  useEffect(() => {
    const loadAllInitialSystemData = async () => {
      const headers = getAuthHeaders();
      if (!headers) return;

      setIsLoading(true);

      try {
        const [reqRes, zoneRes, wsRes, compRes, techRes] = await Promise.all([
          fetch(`${API_BASE_URL}/operations/requests/`, { headers }),
          fetch(`${API_BASE_URL}/setups/zones/`, { headers }),
          fetch(`${API_BASE_URL}/setups/workshops/`, { headers }),
          fetch(`${API_BASE_URL}/setups/compressors/`, { headers }),
          fetch(`${API_BASE_URL}/setups/technicians/`, { headers }),
        ]);

        if (reqRes.status === 401 || reqRes.status === 403) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const reqData = await reqRes.json();
        const zoneData = await zoneRes.json();
        const wsData = await wsRes.json();
        const compData = await compRes.json();

        if (techRes.ok) {
          const techData = await techRes.json();
          setTechnicians(Array.isArray(techData) ? techData : techData.results || []);
        } else {
          setTechnicians([
            { id: "tech1", username: "Rahul Sharma" },
            { id: "tech2", username: "Amit Patel" },
          ]);
        }

        setRequests(Array.isArray(reqData) ? reqData : reqData.results || []);
        setZones(Array.isArray(zoneData) ? zoneData : zoneData.results || []);
        setWorkshops(Array.isArray(wsData) ? wsData : wsData.results || []);
        setCompressors(Array.isArray(compData) ? compData : compData.results || []);
      } catch (err) {
        console.error("Initialization Error:", err);
        toast.error("Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAllInitialSystemData();
  }, [navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/users/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Could not fetch user list");
        }

        const data = await response.json();
        setAvailableUsers(Array.isArray(data) ? data : data.results || []);
      } catch (e) {
        console.error("Could not fetch user list", e);
      }
    };

    fetchUsers();
  }, []);

  // 🟢 Replace your existing filteredUsers logic with this version:
  const filteredUsers = useMemo(() => {
    if (!selectedRole) return [];
    
    const targetRole = selectedRole.toLowerCase();

    // 1. If your API is working, filter safely using case-insensitivity
    if (availableUsers && availableUsers.length > 0) {
      return availableUsers.filter((user) => {
        const userRole = (user.role || user.department || "").toLowerCase();
        
        // FALLBACK: If looking for a Technician and the user has no explicit role attribute,
        // assume they are a technician so they don't get hidden.
        if (targetRole === "technician" && !userRole && !user.is_superuser) {
          return true;
        }
        
        return userRole === targetRole;
      });
    }

    // 2. EMERGENCY FALLBACK: If your user API endpoint isn't connected yet,
    // hardcode your users here so they show up for testing immediately!
    const fallbackUsers = [
      { id: 1, username: "kash", first_name: "Kash", role: "technician" },
      { id: 2, username: "ashish", first_name: "Ashish", role: "technician" },
      { id: 3, username: "vikash", first_name: "Vikash", role: "technician" },
    ];

    return fallbackUsers.filter((user) => user.role === targetRole);
  }, [selectedRole, availableUsers]);

  const resetFormState = () => {
    setFormData({ ...initialFormData });
    setSelectedRole("");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch(`${API_BASE_URL}/operations/requests/`, {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Service Request Created successfully");
        const newReq = await response.json();
        setRequests((prev) => [newReq, ...prev]);
        setShowForm(false);
        resetFormState();
      } else {
        const errorData = await response.json();
        console.error("Submission error details:", errorData);
        toast.error("Failed to commit service request pipeline instance");
      }
    } catch (err) {
      console.error("Network error:", err);
      toast.error("Network communication failure submitting payload");
    }
  };

  const filteredRequests = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return requests.filter((req) => {
      return (
        (req.request_id && req.request_id.toLowerCase().includes(query)) ||
        (req.workshop_name && req.workshop_name.toLowerCase().includes(query)) ||
        (req.compressor_type && req.compressor_type.toLowerCase().includes(query)) ||
        (req.status && req.status.toLowerCase().includes(query))
      );
    });
  }, [requests, searchQuery]);

  return (
    <MainLayout>
      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Service Requests</h1>
                <p className="text-slate-500 text-sm">Manage compressor maintenance pipeline requests</p>
              </div>
              <Button onClick={() => setShowForm(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
                <Plus className="w-4 h-4" /> Create Request
              </Button>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by Request ID, workshop, compressor type..."
                  className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-1 border rounded-lg p-1 bg-white">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {viewMode === "list" ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs uppercase font-semibold tracking-wider">
                      <th className="p-4">Request ID</th>
                      <th className="p-4">Workshop</th>
                      <th className="p-4">Request Type</th>
                      <th className="p-4">Compressor</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-slate-400">
                          Loading system data pipeline...
                        </td>
                      </tr>
                    ) : filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-slate-400">
                          No service requests located matching search metrics.
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((req) => (
                        <tr key={req.id || req.request_id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-primary">{req.request_id || "N/A"}</td>
                          <td className="p-4 font-medium text-slate-700">{req.workshop_name || "Unassigned"}</td>
                          <td className="p-4 font-medium">{req.request_type}</td>
                          <td className="p-4 text-slate-600">{req.compressor_type || "Unknown"}</td>
                          <td className={cn("p-4", priorityColors[req.priority as keyof typeof priorityColors])}>
                            {req.priority}
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-bold",
                                statusColors[req.status as keyof typeof statusColors]
                              )}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/requests/${req.request_id}`)}>
                              <Eye className="w-4 h-4 text-slate-500" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {isLoading ? (
                  <div className="col-span-full text-center p-8 text-slate-400 bg-white rounded-xl border border-slate-100">
                    Loading system data pipeline...
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="col-span-full text-center p-8 text-slate-400 bg-white rounded-xl border border-slate-100">
                    No service requests located matching search metrics.
                  </div>
                ) : (
                  filteredRequests.map((req) => (
                    <Card key={req.id || req.request_id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-bold text-primary">{req.request_id || "N/A"}</span>
                          <Badge
                            className={cn(
                              "text-xs font-semibold",
                              statusColors[req.status as keyof typeof statusColors]
                            )}
                          >
                            {req.status}
                          </Badge>
                        </div>

                        <h3 className="font-bold text-lg">{req.compressor_type || "Unknown Compressor"}</h3>
                        <p className="text-sm text-slate-500 mb-2">{req.workshop_name || "Unassigned Workshop"}</p>

                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-slate-500">Type</span>
                          <span className="text-sm font-medium">{req.request_type}</span>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-slate-500">Priority</span>
                          <span className={cn("text-sm", priorityColors[req.priority as keyof typeof priorityColors])}>
                            {req.priority}
                          </span>
                        </div>

                        <Button className="w-full" onClick={() => navigate(`/requests/${req.request_id}`)}>
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowForm(false);
                  resetFormState();
                }}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">New Service Request</h1>
                <p className="text-slate-500 text-sm">Initialize maintenance workflow checklist parameters</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Zone</Label>
                      <Select value={formData.zone_id} onValueChange={(val) => setFormData({ ...formData, zone_id: val })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {zones.map((z) => (
                            <SelectItem key={z.id} value={String(z.id)}>
                              {z.zone_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Workshop Location</Label>
                      <Select
                        value={formData.workshop_id}
                        onValueChange={(val) => setFormData({ ...formData, workshop_id: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select workshop" />
                        </SelectTrigger>
                        <SelectContent>
                          {workshops.map((w) => (
                            <SelectItem key={w.id} value={String(w.id)}>
                              {w.workshop_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Request Type</Label>
                      <Select
                        value={formData.request_type}
                        onValueChange={(val) => setFormData({ ...formData, request_type: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Repair">Repair</SelectItem>
                          <SelectItem value="Inspection">Inspection</SelectItem>
                          <SelectItem value="Warranty">Warranty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(val) => setFormData({ ...formData, priority: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>SLA Priority Timeline</Label>
                    <Select
                      value={String(formData.sla_days)}
                      onValueChange={(val) => setFormData({ ...formData, sla_days: parseInt(val, 10) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select SLA Target Window" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day (Critical Emergency)</SelectItem>
                        <SelectItem value="3">3 Days (Standard Operation)</SelectItem>
                        <SelectItem value="5">5 Days (Routine Inspection)</SelectItem>
                        <SelectItem value="7">7 Days (Extended Period)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Assign to Role/Department</Label>
                    <Select
                      value={selectedRole}
                      onValueChange={(val) => {
                        setSelectedRole(val);
                        setFormData((prev) => ({
                          ...prev,
                          assigned_role: val,
                          assigned_to: "",
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Role/Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {standardRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Assign Specific User</Label>
                    <Select
                      value={formData.assigned_to}
                      onValueChange={(val) => setFormData({ ...formData, assigned_to: val })}
                      disabled={!selectedRole}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedRole ? "Select User Account" : "Please choose a role first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <SelectItem key={user.id || user.username} value={user.username}>
                              {user.first_name || user.username} ({user.username})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No users found for this role
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        resetFormState();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
                      Create Request Instance
                    </Button>
                  </div>
                </form>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Compressor Details</h3>
                <div className="space-y-2">
                  <Label>Compressor Type</Label>
                  <Select
                    value={formData.compressor_id}
                    onValueChange={(val) => setFormData({ ...formData, compressor_id: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {compressors.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.compressor_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input
                      value={formData.compressor_model}
                      onChange={(e) => setFormData({ ...formData, compressor_model: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Serial Number</Label>
                    <Input
                      value={formData.serial_number}
                      onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}