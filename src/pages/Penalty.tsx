import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  IndianRupee,
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  Grid3X3,
  List,
  Search,
  Download,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KPICard } from "@/components/dashboard/KPICard";
import { BreachDetailModal } from "@/components/penalty/BreachDetailModal";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

// KPI Data
const penaltyKPIs = [
  { title: "Penalty ₹ at Risk", value: "₹4.8L", icon: IndianRupee, variant: "danger" as const },
  { title: "Breaches This Month", value: "18", icon: AlertTriangle, variant: "warning" as const },
  { title: "Resolved Cases", value: "42", icon: CheckCircle, variant: "success" as const },
  { title: "Avg Delay (Days)", value: "3.5", icon: Clock, variant: "info" as const },
  { title: "Top 3 Vendors at Risk", value: "3", icon: Users, variant: "danger" as const },
  { title: "SLA Compliance", value: "87%", icon: TrendingUp, variant: "success" as const },
];

// Active penalties
const activePenalties = [
  {
    id: "JOB-2024-0123",
    zone: "Northern",
    location: "Delhi",
    workshop: "Delhi",
    reason: "Vendor delay",
    delayed: 5,
    penaltyRisk: "₹25,000",
    assignedTo: "Rajesh Kumar",
    status: "Open",
    vendor: "ABC Spares",
  },
  {
    id: "JOB-2024-0118",
    zone: "Southern",
    location: "Chennai",
    workshop: "Chennai",
    reason: "Part shortage",
    delayed: 3,
    penaltyRisk: "₹15,000",
    assignedTo: "Amit Singh",
    status: "In Review",
    vendor: "XYZ Parts",
  },
  {
    id: "JOB-2024-0115",
    zone: "Western",
    location: "Mumbai",
    workshop: "Mumbai",
    reason: "QC rejection",
    delayed: 2,
    penaltyRisk: "₹10,000",
    assignedTo: "Priya Sharma",
    status: "Open",
    vendor: "Filter Pro",
  },
  {
    id: "JOB-2024-0112",
    zone: "Eastern",
    location: "Kolkata",
    workshop: "Kolkata",
    reason: "Transport delay",
    delayed: 4,
    penaltyRisk: "₹20,000",
    assignedTo: "Vikram Patel",
    status: "In Review",
    vendor: "ABC Spares",
  },
];

// Resolved penalties
const resolvedPenalties = [
  {
    id: "JOB-2024-0098",
    zone: "Northern",
    location: "Delhi",
    workshop: "Delhi",
    reason: "Vendor delay",
    delayed: 2,
    penaltyRisk: "₹10,000",
    assignedTo: "Rajesh Kumar",
    status: "Resolved",
    vendor: "ABC Spares",
  },
  {
    id: "JOB-2024-0092",
    zone: "Central",
    location: "Bhopal",
    workshop: "Bhopal",
    reason: "Part shortage",
    delayed: 1,
    penaltyRisk: "₹5,000",
    assignedTo: "Suresh Kumar",
    status: "Resolved",
    vendor: "XYZ Parts",
  },
];

// Vendor tracker
const vendorTracker = [
  { vendor: "ABC Spares", totalPenalty: "₹1.2L", breachCount: 5, avgDelay: 4, status: "Critical" },
  { vendor: "XYZ Parts", totalPenalty: "₹85,000", breachCount: 3, avgDelay: 3, status: "Warning" },
  { vendor: "Filter Pro", totalPenalty: "₹25,000", breachCount: 1, avgDelay: 2, status: "Normal" },
];

// Chart data
const penaltyByZoneData = [
  { zone: "Northern", penalty: 125000 },
  { zone: "Southern", penalty: 85000 },
  { zone: "Western", penalty: 95000 },
  { zone: "Eastern", penalty: 75000 },
  { zone: "Central", penalty: 50000 },
];

const trendData = [
  { month: "Jan", breaches: 12, penalty: 180000 },
  { month: "Feb", breaches: 15, penalty: 225000 },
  { month: "Mar", breaches: 8, penalty: 120000 },
  { month: "Apr", breaches: 18, penalty: 270000 },
  { month: "May", breaches: 10, penalty: 150000 },
  { month: "Jun", breaches: 14, penalty: 210000 },
];

const penaltyStatusData = [
  { name: "Open", value: 12, color: "hsl(var(--danger))" },
  { name: "In Review", value: 8, color: "hsl(var(--warning))" },
  { name: "Resolved", value: 42, color: "hsl(var(--success))" },
];

const statusColors: Record<string, string> = {
  Open: "status-danger",
  "In Review": "status-warning",
  Resolved: "status-safe",
  Critical: "status-danger",
  Warning: "status-warning",
  Normal: "status-safe",
};

interface BreachCase {
  id: string;
  zone: string;
  location: string;
  workshop: string;
  reason: string;
  delayed: number;
  penaltyRisk: string;
  assignedTo: string;
  status: string;
  vendor?: string;
}

export default function Penalty() {
  const [viewMode, setViewMode] = useState<"cards" | "grid">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "resolved" | "vendor">("active");
  const [selectedBreach, setSelectedBreach] = useState<BreachCase | null>(null);
  const [showBreachModal, setShowBreachModal] = useState(false);

  const handleViewDetails = (breach: BreachCase) => {
    setSelectedBreach(breach);
    setShowBreachModal(true);
  };

  const currentPenalties = activeTab === "active" ? activePenalties : 
                          activeTab === "resolved" ? resolvedPenalties : [];

  const filteredPenalties = currentPenalties.filter(p => 
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Penalty War Room</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage SLA breaches and penalties
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {penaltyKPIs.map((kpi, index) => (
          <KPICard key={kpi.title} {...kpi} index={index} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Penalty by Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="chart-container"
        >
          <h3 className="text-lg font-semibold mb-4">Penalty by Zone</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={penaltyByZoneData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v/1000}K`} />
              <YAxis dataKey="zone" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={70} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, "Penalty"]}
              />
              <Bar dataKey="penalty" fill="hsl(var(--danger))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Breaches vs Penalty Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="chart-container"
        >
          <h3 className="text-lg font-semibold mb-4">Breaches vs Penalty Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v/1000}K`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="breaches" stroke="hsl(var(--warning))" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="penalty" stroke="hsl(var(--danger))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Penalty Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="chart-container"
        >
          <h3 className="text-lg font-semibold mb-4">Penalty Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={penaltyStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {penaltyStatusData.map((entry, index) => (
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
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {[
            { id: "active", label: "Active Cases" },
            { id: "resolved", label: "Resolved Cases" },
            { id: "vendor", label: "Vendor Tracker" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
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

      {/* Active Penalties - Cards View */}
      {(activeTab === "active" || activeTab === "resolved") && viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPenalties.map((penalty, index) => (
            <motion.div
              key={penalty.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="bg-card rounded-xl p-5 shadow-soft-md border border-border hover:shadow-soft-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-primary">{penalty.id}</h4>
                  <p className="text-sm text-muted-foreground">{penalty.zone} • {penalty.workshop}</p>
                </div>
                <span className={cn("status-badge", statusColors[penalty.status])}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {penalty.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Breach Reason</span>
                  <span className="font-medium">{penalty.reason}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Days Delayed</span>
                  <span className="font-medium text-danger">{penalty.delayed} days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Penalty at Risk</span>
                  <span className="font-bold text-danger">{penalty.penaltyRisk}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Assigned To</span>
                  <span className="font-medium">{penalty.assignedTo}</span>
                </div>
              </div>

              <Button 
                size="sm" 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => handleViewDetails(penalty)}
              >
                <Eye className="w-4 h-4" />
                View Details
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Active Penalties - Grid View */}
      {(activeTab === "active" || activeTab === "resolved") && viewMode === "grid" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-soft-md overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Zone / Workshop</th>
                  <th>Breach Reason</th>
                  <th>Days Delayed</th>
                  <th>Penalty ₹ at Risk</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPenalties.map((penalty, index) => (
                  <motion.tr
                    key={penalty.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="font-medium text-primary">{penalty.id}</td>
                    <td>{penalty.zone} / {penalty.workshop}</td>
                    <td>{penalty.reason}</td>
                    <td className="text-danger font-medium">{penalty.delayed} days</td>
                    <td className="text-danger font-bold">{penalty.penaltyRisk}</td>
                    <td>{penalty.assignedTo}</td>
                    <td>
                      <span className={cn("status-badge", statusColors[penalty.status])}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {penalty.status}
                      </span>
                    </td>
                    <td>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleViewDetails(penalty)}
                      >
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

      {/* Vendor Tracker */}
      {activeTab === "vendor" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-soft-md overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Total Penalty ₹</th>
                  <th>SLA Breach Count</th>
                  <th>Avg Delay</th>
                  <th>Escalation Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {vendorTracker.map((vendor, index) => (
                  <motion.tr
                    key={vendor.vendor}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="font-medium">{vendor.vendor}</td>
                    <td className="text-danger font-bold">{vendor.totalPenalty}</td>
                    <td>{vendor.breachCount}</td>
                    <td>{vendor.avgDelay} days</td>
                    <td>
                      <span className={cn("status-badge", statusColors[vendor.status])}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {vendor.status}
                      </span>
                    </td>
                    <td>
                      <Button size="sm" variant="outline">
                        Escalate
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Breach Detail Modal */}
      <BreachDetailModal
        open={showBreachModal}
        onClose={() => setShowBreachModal(false)}
        breach={selectedBreach}
      />
    </MainLayout>
  );
}
