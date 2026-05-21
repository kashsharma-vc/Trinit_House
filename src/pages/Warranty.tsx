import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Phone,
  AlertTriangle,
  Clock,
  CheckCircle,
  Grid3X3,
  List,
  Search,
  Download,
  Eye,
  User,
  Upload,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KPICard } from "@/components/dashboard/KPICard";

// KPI Data
const warrantyKPIs = [
  { title: "Open Calls", value: "24", icon: Phone, variant: "info" as const },
  { title: "Pending Action", value: "8", icon: Clock, variant: "warning" as const },
  { title: "Closed (MTD)", value: "42", icon: CheckCircle, variant: "success" as const },
  { title: "Urgent Calls", value: "5", icon: AlertTriangle, variant: "danger" as const },
];

// Warranty calls
const warrantyCalls = [
  {
    id: "WC-2024-0034",
    status: "Urgent",
    warrantyStatus: "Active",
    equipment: "AC Compressor – 15HP",
    serial: "SN-2023-45678",
    vendor: "ELGi Equipments",
    loggedDate: "28 Jan 2024",
    stage: "Assigned",
    technician: {
      name: "Rajesh Kumar",
      grade: "Senior",
      contact: "+91 98765 43210",
    },
    slaDue: "30 Jan 2024",
    issue: "Valve plate assembly failure, unusual noise during operation",
  },
  {
    id: "WC-2024-0033",
    status: "Normal",
    warrantyStatus: "Active",
    equipment: "Screw Compressor – 20HP",
    serial: "SN-2023-45690",
    vendor: "Atlas Copco",
    loggedDate: "27 Jan 2024",
    stage: "Joint Note",
    technician: {
      name: "Amit Singh",
      grade: "Junior",
      contact: "+91 98765 43211",
    },
    slaDue: "01 Feb 2024",
    issue: "Oil leakage from main seal",
  },
  {
    id: "WC-2024-0032",
    status: "Pending",
    warrantyStatus: "Active",
    equipment: "Reciprocating Compressor – 10HP",
    serial: "SN-2023-45712",
    vendor: "Ingersoll Rand",
    loggedDate: "26 Jan 2024",
    stage: "Logged",
    technician: null,
    slaDue: "02 Feb 2024",
    issue: "Overheating issue during extended operation",
  },
  {
    id: "WC-2024-0031",
    status: "Closed",
    warrantyStatus: "Expired",
    equipment: "AC Compressor – 15HP",
    serial: "SN-2022-34567",
    vendor: "ELGi Equipments",
    loggedDate: "20 Jan 2024",
    stage: "Closure",
    technician: {
      name: "Priya Sharma",
      grade: "Senior",
      contact: "+91 98765 43212",
    },
    slaDue: "25 Jan 2024",
    issue: "Bearing replacement completed",
  },
];

// Workflow stages
const workflowStages = ["Logged", "Assigned", "Joint Note", "Closure"];

const statusColors = {
  Urgent: "status-danger",
  Normal: "status-info",
  Pending: "status-warning",
  Closed: "status-safe",
};

const warrantyColors = {
  Active: "bg-success-muted text-success",
  Expired: "bg-danger-muted text-danger",
};

export default function Warranty() {
  const [viewMode, setViewMode] = useState<"cards" | "grid">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCall, setSelectedCall] = useState<typeof warrantyCalls[0] | null>(null);

  const filteredCalls = warrantyCalls.filter(
    (call) =>
      call.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Warranty Call Management</h1>
          <p className="text-muted-foreground mt-1">
            Track warranty issues from logging to closure
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {warrantyKPIs.map((kpi, index) => (
          <KPICard key={kpi.title} {...kpi} index={index} />
        ))}
      </div>

      {/* Filters & View Toggle */}
      <div className="filter-bar mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search calls, equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("cards")}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calls List/Cards */}
        <div className={cn(selectedCall ? "lg:col-span-1" : "lg:col-span-3")}>
          {viewMode === "cards" ? (
            <div className={cn(
              "grid gap-4",
              selectedCall ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}>
              {filteredCalls.map((call, index) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedCall(call)}
                  className={cn(
                    "bg-card rounded-xl p-5 shadow-soft-md border border-border hover:shadow-soft-lg transition-all cursor-pointer",
                    selectedCall?.id === call.id && "ring-2 ring-primary"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-primary">{call.id}</h4>
                      <p className="text-sm text-muted-foreground">{call.loggedDate}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn("status-badge", statusColors[call.status as keyof typeof statusColors])}>
                        {call.status}
                      </span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", warrantyColors[call.warrantyStatus as keyof typeof warrantyColors])}>
                        {call.warrantyStatus}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="font-medium">{call.equipment}</p>
                    <p className="text-sm text-muted-foreground">{call.vendor}</p>
                  </div>

                  {/* Progress Tracker */}
                  <div className="flex items-center gap-1 mb-4">
                    {workflowStages.map((stage, idx) => {
                      const stageIndex = workflowStages.indexOf(call.stage);
                      const isCompleted = idx < stageIndex;
                      const isActive = idx === stageIndex;
                      return (
                        <div
                          key={stage}
                          className={cn(
                            "flex-1 h-1.5 rounded-full",
                            isCompleted ? "bg-success" :
                            isActive ? "bg-primary" : "bg-muted"
                          )}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {call.stage} • SLA Due: {call.slaDue}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl shadow-soft-md overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Call ID</th>
                      <th>Status</th>
                      <th>Warranty</th>
                      <th>Equipment</th>
                      <th>Vendor</th>
                      <th>Stage</th>
                      <th>SLA Due</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCalls.map((call, index) => (
                      <motion.tr
                        key={call.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedCall(call)}
                        className="cursor-pointer"
                      >
                        <td className="font-medium text-primary">{call.id}</td>
                        <td>
                          <span className={cn("status-badge", statusColors[call.status as keyof typeof statusColors])}>
                            {call.status}
                          </span>
                        </td>
                        <td>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full", warrantyColors[call.warrantyStatus as keyof typeof warrantyColors])}>
                            {call.warrantyStatus}
                          </span>
                        </td>
                        <td>{call.equipment}</td>
                        <td>{call.vendor}</td>
                        <td>{call.stage}</td>
                        <td>{call.slaDue}</td>
                        <td>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>

        {/* Detail View */}
        {selectedCall && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Call Details */}
            <div className="bg-card rounded-xl p-6 shadow-soft-md">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">{selectedCall.id}</h3>
                  <p className="text-muted-foreground">{selectedCall.equipment}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCall(null)}>
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Serial / DWL Number</p>
                  <p className="font-medium">{selectedCall.serial}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="font-medium">{selectedCall.vendor}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warranty Status</p>
                  <span className={cn("text-sm px-2 py-0.5 rounded-full", warrantyColors[selectedCall.warrantyStatus as keyof typeof warrantyColors])}>
                    {selectedCall.warrantyStatus}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <span className={cn("status-badge", statusColors[selectedCall.status as keyof typeof statusColors])}>
                    {selectedCall.status}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground mb-1">Issue Description</p>
                <p className="font-medium">{selectedCall.issue}</p>
              </div>

              {/* Technician Assignment */}
              {selectedCall.technician ? (
                <div className="p-4 border border-border rounded-lg mb-6">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Assigned Technician
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedCall.technician.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Grade</p>
                      <p className="font-medium">{selectedCall.technician.grade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact</p>
                      <p className="font-medium">{selectedCall.technician.contact}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-dashed border-warning rounded-lg mb-6 bg-warning-muted/30">
                  <p className="text-warning font-medium">No technician assigned yet</p>
                  <Button size="sm" className="mt-2">Assign Technician</Button>
                </div>
              )}

              {/* SLA Deadline */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">SLA Deadline</span>
                </div>
                <span className={cn(
                  "font-bold",
                  selectedCall.status === "Urgent" ? "text-danger" : "text-foreground"
                )}>
                  {selectedCall.slaDue}
                </span>
              </div>
            </div>

            {/* Audit Trail */}
            <div className="bg-card rounded-xl p-6 shadow-soft-md">
              <h3 className="text-lg font-semibold mb-4">Audit Trail</h3>
              <div className="space-y-3">
                {[
                  { action: `${selectedCall.stage} stage reached`, user: "System", time: "Today, 10:30 AM" },
                  { action: "Logged by Admin", user: "Admin User", time: selectedCall.loggedDate },
                ].map((log, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-muted-foreground">by {log.user}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button className="flex-1 gap-2">
                <Upload className="w-4 h-4" />
                Upload Joint Note
              </Button>
              <Button variant="outline" className="flex-1">
                Reassign Technician
              </Button>
              {selectedCall.stage === "Joint Note" && (
                <Button variant="default" className="flex-1">
                  Finalize Closure
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
