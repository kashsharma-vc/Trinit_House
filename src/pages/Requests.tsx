import { useState } from "react";
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
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  ChevronLeft,
  Upload,
  Calendar,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// Sample data
const requestsData = [
  {
    id: "REQ-2024-0456",
    date: "2024-01-28",
    zone: "Northern",
    workshop: "Delhi Workshop",
    type: "Repair",
    compressor: "ELGi W-Type",
    priority: "High",
    status: "Open",
    expectedDate: "2024-02-11",
  },
  {
    id: "REQ-2024-0455",
    date: "2024-01-27",
    zone: "Southern",
    workshop: "Chennai Workshop",
    type: "Inspection",
    compressor: "ELGi 15HP",
    priority: "Medium",
    status: "In Progress",
    expectedDate: "2024-02-10",
  },
  {
    id: "REQ-2024-0454",
    date: "2024-01-26",
    zone: "Western",
    workshop: "Mumbai Workshop",
    type: "Warranty",
    compressor: "Reciprocating",
    priority: "Low",
    status: "Closed",
    expectedDate: "2024-02-05",
  },
  {
    id: "REQ-2024-0453",
    date: "2024-01-25",
    zone: "Eastern",
    workshop: "Kolkata Workshop",
    type: "Repair",
    compressor: "Screw Type",
    priority: "High",
    status: "Open",
    expectedDate: "2024-02-08",
  },
  {
    id: "REQ-2024-0452",
    date: "2024-01-24",
    zone: "Central",
    workshop: "Bhopal Workshop",
    type: "Inspection",
    compressor: "ELGi W-Type",
    priority: "Medium",
    status: "In Progress",
    expectedDate: "2024-02-07",
  },
];

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
                <h1 className="text-2xl font-bold text-foreground">New Request</h1>
                <p className="text-muted-foreground mt-1">
                  Manage and track service requests
                </p>
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
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  <SelectItem value="northern">Northern</SelectItem>
                  <SelectItem value="southern">Southern</SelectItem>
                  <SelectItem value="eastern">Eastern</SelectItem>
                  <SelectItem value="western">Western</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="progress">In Progress</SelectItem>
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
                        <td className={priorityColors[req.priority as keyof typeof priorityColors]}>
                          {req.priority}
                        </td>
                        <td>
                          <span className={cn("status-badge", statusColors[req.status as keyof typeof statusColors])}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {req.status}
                          </span>
                        </td>
                        <td>{req.expectedDate}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/requests/${req.id}`);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowForm(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
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
                  Showing 1-5 of 248 requests
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowForm(false)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Create New Request
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Fill in the details to create a new service request
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline">Save Draft</Button>
                <Button>Submit Request</Button>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Section 1: Request Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl p-6 shadow-soft-md"
              >
                <h3 className="text-lg font-semibold mb-4">Request Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Request Date</Label>
                      <Input type="date" defaultValue="2024-01-28" />
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Zone</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select zone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="northern">Northern</SelectItem>
                          <SelectItem value="southern">Southern</SelectItem>
                          <SelectItem value="eastern">Eastern</SelectItem>
                          <SelectItem value="western">Western</SelectItem>
                          <SelectItem value="central">Central</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Workshop</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select workshop" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="delhi">Delhi Workshop</SelectItem>
                          <SelectItem value="mumbai">Mumbai Workshop</SelectItem>
                          <SelectItem value="chennai">Chennai Workshop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Request Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="repair">Repair</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="warranty">Warranty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea placeholder="Describe the issue or request..." rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Attachments</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Drop files here or click to upload
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Section 2: Compressor Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl p-6 shadow-soft-md"
              >
                <h3 className="text-lg font-semibold mb-4">Compressor Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Compressor Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elgi-w">ELGi W-Type</SelectItem>
                        <SelectItem value="elgi-15hp">ELGi 15HP</SelectItem>
                        <SelectItem value="reciprocating">Reciprocating</SelectItem>
                        <SelectItem value="screw">Screw Type</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Compressor Model</Label>
                    <Input placeholder="Enter model number" />
                  </div>
                  <div className="space-y-2">
                    <Label>Serial Number</Label>
                    <Input placeholder="Enter serial number" />
                  </div>
                  <div className="space-y-2">
                    <Label>SOP Reference</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select SOP" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sop-elg-01">SOP-ELG-01 v2.1</SelectItem>
                        <SelectItem value="sop-elg-02">SOP-ELG-02 v1.5</SelectItem>
                        <SelectItem value="sop-rec-01">SOP-REC-01 v3.0</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mt-8 mb-4">Requester Info</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Requester Name</Label>
                    <Input placeholder="Enter name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Designation</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="technician">Technician</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Section 3: SLA & Penalty */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-xl p-6 shadow-soft-md"
              >
                <h3 className="text-lg font-semibold mb-4">SLA & Penalty</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SLA TAT (Days)</Label>
                      <Input value="14" disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Expected Completion</Label>
                      <Input type="date" value="2024-02-11" disabled className="bg-muted" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Penalty Applicable</p>
                      <p className="text-sm text-muted-foreground">
                        Enable penalty calculation for SLA breaches
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </motion.div>

              {/* Section 4: Metadata */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-xl p-6 shadow-soft-md"
              >
                <h3 className="text-lg font-semibold mb-4">Metadata</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select defaultValue="draft">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="progress">In Progress</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
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
                      <Input value="2024-01-28 10:30 AM" disabled className="bg-muted" />
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
