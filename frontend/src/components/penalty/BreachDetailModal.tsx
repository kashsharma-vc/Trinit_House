import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  IndianRupee,
  Clock,
  TrendingDown,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  ArrowRight,
  Send,
  UserCog,
  FileText,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface BreachCase {
  id: string;
  zone: string;
  location: string;
  reason: string;
  assignedTo: string;
  status: string;
  penaltyRisk: string;
  delayed: number;
  vendor?: string;
}

interface BreachDetailModalProps {
  open: boolean;
  onClose: () => void;
  breach: BreachCase | null;
}

// Timeline events
const timelineEvents = [
  { date: "20 Jan 2024", time: "09:00 AM", event: "Job started", status: "completed" },
  { date: "22 Jan 2024", time: "02:30 PM", event: "Parts ordered from vendor", status: "completed" },
  { date: "24 Jan 2024", time: "11:00 AM", event: "SLA deadline reached", status: "warning" },
  { date: "25 Jan 2024", time: "04:00 PM", event: "Vendor delay reported", status: "danger" },
  { date: "27 Jan 2024", time: "10:00 AM", event: "Escalation raised", status: "danger" },
  { date: "28 Jan 2024", time: "Present", event: "Pending resolution", status: "active" },
];

// Breach trend data for this case
const breachTrendData = [
  { day: "Day 1", penalty: 0, breach: 0 },
  { day: "Day 2", penalty: 0, breach: 0 },
  { day: "Day 3", penalty: 0, breach: 0 },
  { day: "Day 4", penalty: 5000, breach: 1 },
  { day: "Day 5", penalty: 10000, breach: 1 },
  { day: "Day 6", penalty: 15000, breach: 1 },
  { day: "Day 7", penalty: 20000, breach: 1 },
  { day: "Day 8", penalty: 25000, breach: 1 },
];

// Zone comparison data
const zoneComparisonData = [
  { zone: "Northern", penalty: 125000 },
  { zone: "Southern", penalty: 85000 },
  { zone: "Western", penalty: 95000 },
  { zone: "Eastern", penalty: 75000 },
];

// Status breakdown
const statusBreakdownData = [
  { name: "Open", value: 12, color: "hsl(var(--danger))" },
  { name: "In Review", value: 8, color: "hsl(var(--warning))" },
  { name: "Resolved", value: 42, color: "hsl(var(--success))" },
];

const statusColors: Record<string, string> = {
  Open: "status-danger",
  "In Review": "status-warning",
  Resolved: "status-safe",
};

const riskLevelColors: Record<string, string> = {
  Low: "text-success",
  Medium: "text-warning",
  High: "text-danger",
};

export function BreachDetailModal({ open, onClose, breach }: BreachDetailModalProps) {
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);
  const [notes, setNotes] = useState("");
  const [reassignTo, setReassignTo] = useState("");
  const [actionCompleted, setActionCompleted] = useState(false);

  if (!breach) return null;

  const isUrgent = parseInt(breach.penaltyRisk.replace(/[^0-9]/g, "")) > 20000 || breach.delayed > 4;
  const vendorRiskLevel = breach.delayed > 4 ? "High" : breach.delayed > 2 ? "Medium" : "Low";
  const slaImpact = Math.min(100, 87 - (breach.delayed * 2.5)).toFixed(1);

  const handleAction = (action: string) => {
    setSelectedAction(action);
    setConfirmStep(false);
    setActionCompleted(false);
    setNotes("");
  };

  const handleConfirm = () => {
    setConfirmStep(true);
  };

  const handleExecute = () => {
    // Simulate action execution
    setTimeout(() => {
      setActionCompleted(true);
    }, 1000);
  };

  const resetActionModal = () => {
    setShowActionModal(false);
    setSelectedAction(null);
    setConfirmStep(false);
    setActionCompleted(false);
    setNotes("");
    setReassignTo("");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Breach Case Details</DialogTitle>
          </DialogHeader>

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-xl p-5 border-2",
              isUrgent ? "bg-danger-muted border-danger/30" : "bg-card border-border"
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-primary">{breach.id}</h3>
                  {isUrgent && (
                    <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-danger text-danger-foreground">
                      <AlertTriangle className="w-3 h-3" />
                      URGENT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {breach.zone} • {breach.location}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {breach.assignedTo}
                  </p>
                </div>
                <span className={cn("status-badge", statusColors[breach.status])}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {breach.status}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-1">Breach Reason</p>
              <p className="font-medium text-danger">{breach.reason}</p>
            </div>
          </motion.div>

          {/* Penalty Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="bg-danger-muted rounded-xl p-4"
            >
              <div className="flex items-center gap-2 text-danger mb-2">
                <IndianRupee className="w-5 h-5" />
                <span className="text-sm font-medium">Penalty at Risk</span>
              </div>
              <p className="text-2xl font-bold text-danger">{breach.penaltyRisk}</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-warning-muted rounded-xl p-4"
            >
              <div className="flex items-center gap-2 text-warning mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Days Delayed</span>
              </div>
              <p className="text-2xl font-bold text-warning">{breach.delayed} days</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-info-muted rounded-xl p-4"
            >
              <div className="flex items-center gap-2 text-info mb-2">
                <TrendingDown className="w-5 h-5" />
                <span className="text-sm font-medium">SLA Compliance</span>
              </div>
              <p className="text-2xl font-bold text-info">{slaImpact}%</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={cn("rounded-xl p-4", 
                vendorRiskLevel === "High" ? "bg-danger-muted" : 
                vendorRiskLevel === "Medium" ? "bg-warning-muted" : "bg-success-muted"
              )}
            >
              <div className={cn("flex items-center gap-2 mb-2", riskLevelColors[vendorRiskLevel])}>
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">Vendor Risk</span>
              </div>
              <p className={cn("text-2xl font-bold", riskLevelColors[vendorRiskLevel])}>{vendorRiskLevel}</p>
            </motion.div>
          </div>

          {/* Detailed Breach Reason & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-card rounded-xl p-5 shadow-soft-md"
            >
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Root Cause Analysis
              </h4>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">Primary Cause</p>
                  <p className="text-muted-foreground">
                    {breach.reason === "Vendor delay" 
                      ? "Vendor ABC Spares failed to deliver critical components within the agreed timeline due to supply chain disruption."
                      : breach.reason === "QC rejection"
                      ? "Quality control inspection failed due to specification mismatch. Parts require replacement."
                      : "Logistics delay caused by transport vehicle breakdown during inter-zone transfer."}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">Supporting Notes</p>
                  <p className="text-muted-foreground">
                    Escalation raised on Day 4. Multiple follow-ups with vendor. 
                    Alternate supplier being evaluated. Expected resolution within 2 days.
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">Impact Assessment</p>
                  <p className="text-muted-foreground">
                    Customer notified of delay. Penalty clause activated as per SLA terms.
                    Risk of escalation to senior management if not resolved within 48 hours.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl p-5 shadow-soft-md"
            >
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Event Timeline
              </h4>
              <div className="relative">
                {timelineEvents.map((event, index) => (
                  <div key={index} className="flex gap-4 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        event.status === "completed" ? "bg-success" :
                        event.status === "warning" ? "bg-warning" :
                        event.status === "danger" ? "bg-danger" :
                        "bg-primary animate-pulse"
                      )} />
                      {index < timelineEvents.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 -mt-1">
                      <p className="text-xs text-muted-foreground">{event.date} • {event.time}</p>
                      <p className={cn(
                        "text-sm font-medium",
                        event.status === "danger" ? "text-danger" :
                        event.status === "active" ? "text-primary" : ""
                      )}>{event.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Interactive Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="chart-container"
            >
              <h4 className="font-semibold mb-4">Breach vs Penalty Trend</h4>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={breachTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `₹${v/1000}K`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="penalty" stroke="hsl(var(--danger))" strokeWidth={2} dot={{ fill: "hsl(var(--danger))" }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="chart-container"
            >
              <h4 className="font-semibold mb-4">Zone Comparison</h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={zoneComparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `₹${v/1000}K`} />
                  <YAxis dataKey="zone" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={60} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="penalty" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="chart-container"
            >
              <h4 className="font-semibold mb-4">Status Breakdown</h4>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pt-4 border-t border-border"
          >
            <Button
              size="lg"
              className={cn(
                "w-full gap-2 text-lg font-semibold",
                isUrgent ? "bg-danger hover:bg-danger/90" : ""
              )}
              onClick={() => setShowActionModal(true)}
            >
              <AlertTriangle className="w-5 h-5" />
              Take Immediate Action
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Action Modal */}
      <Dialog open={showActionModal} onOpenChange={resetActionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Take Action on Breach Case</DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {actionCompleted ? (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-success mx-auto flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-success-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Action Completed</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedAction === "escalate" && "Vendor escalation has been raised successfully."}
                  {selectedAction === "penalty" && "Penalty has been applied to vendor account."}
                  {selectedAction === "resolve" && "Case has been marked as resolved."}
                  {selectedAction === "reassign" && `Case has been reassigned to ${reassignTo}.`}
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  Timestamp: {new Date().toLocaleString()} | User: Admin-01
                </p>
                <Button onClick={resetActionModal}>Close</Button>
              </motion.div>
            ) : confirmStep ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="p-4 bg-warning-muted rounded-xl border border-warning/30">
                  <h4 className="font-semibold text-warning mb-2">Confirm Action</h4>
                  <p className="text-sm text-muted-foreground">
                    You are about to {selectedAction === "escalate" ? "raise a vendor escalation" :
                    selectedAction === "penalty" ? "apply penalty to vendor" :
                    selectedAction === "resolve" ? "mark this case as resolved" :
                    `reassign this case to ${reassignTo}`}.
                  </p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Case ID</span>
                    <span className="font-medium">{breach.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendor</span>
                    <span className="font-medium">{breach.vendor || "ABC Spares"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Penalty Amount</span>
                    <span className="font-medium text-danger">{breach.penaltyRisk}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delay Days</span>
                    <span className="font-medium">{breach.delayed} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Breach Reason</span>
                    <span className="font-medium">{breach.reason}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setConfirmStep(false)}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleExecute}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm & Execute
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Case Summary */}
                <div className={cn(
                  "p-4 rounded-xl border-2",
                  isUrgent ? "bg-danger-muted border-danger/30" : "bg-muted/50 border-border"
                )}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{breach.id}</h4>
                      <p className="text-sm text-muted-foreground">{breach.zone} • {breach.location}</p>
                    </div>
                    {isUrgent && (
                      <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-danger text-danger-foreground">
                        <AlertTriangle className="w-3 h-3" />
                        HIGH PRIORITY
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Vendor</p>
                      <p className="font-medium">{breach.vendor || "ABC Spares"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Penalty</p>
                      <p className="font-medium text-danger">{breach.penaltyRisk}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Delayed</p>
                      <p className="font-medium">{breach.delayed} days</p>
                    </div>
                  </div>
                </div>

                {/* Action Options */}
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction("escalate")}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-colors",
                      selectedAction === "escalate" 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Send className="w-5 h-5 text-primary mb-2" />
                    <h5 className="font-medium">Raise Vendor Escalation</h5>
                    <p className="text-xs text-muted-foreground">Notify vendor with breach details</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction("penalty")}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-colors",
                      selectedAction === "penalty" 
                        ? "border-danger bg-danger/10" 
                        : "border-border hover:border-danger/50"
                    )}
                  >
                    <IndianRupee className="w-5 h-5 text-danger mb-2" />
                    <h5 className="font-medium">Apply Penalty</h5>
                    <p className="text-xs text-muted-foreground">Deduct penalty from vendor account</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction("resolve")}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-colors",
                      selectedAction === "resolve" 
                        ? "border-success bg-success/10" 
                        : "border-border hover:border-success/50"
                    )}
                  >
                    <CheckCircle className="w-5 h-5 text-success mb-2" />
                    <h5 className="font-medium">Mark as Resolved</h5>
                    <p className="text-xs text-muted-foreground">Close case with resolution notes</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction("reassign")}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-colors",
                      selectedAction === "reassign" 
                        ? "border-info bg-info/10" 
                        : "border-border hover:border-info/50"
                    )}
                  >
                    <UserCog className="w-5 h-5 text-info mb-2" />
                    <h5 className="font-medium">Reassign Case</h5>
                    <p className="text-xs text-muted-foreground">Assign to another manager</p>
                  </motion.button>
                </div>

                {/* Additional inputs based on action */}
                {selectedAction && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3"
                  >
                    {selectedAction === "reassign" && (
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Reassign To</label>
                        <Select value={reassignTo} onValueChange={setReassignTo}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select manager" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Amit Singh">Amit Singh</SelectItem>
                            <SelectItem value="Priya Sharma">Priya Sharma</SelectItem>
                            <SelectItem value="Vikram Patel">Vikram Patel</SelectItem>
                            <SelectItem value="Suresh Kumar">Suresh Kumar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Notes</label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add resolution notes or comments..."
                        rows={3}
                      />
                    </div>

                    <Button 
                      className="w-full gap-2" 
                      onClick={handleConfirm}
                      disabled={selectedAction === "reassign" && !reassignTo}
                    >
                      Proceed to Confirmation
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
