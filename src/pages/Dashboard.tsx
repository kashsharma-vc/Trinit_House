import { motion } from "framer-motion";
import {
  FileText,
  Briefcase,
  Clock,
  IndianRupee,
  Package,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  RequestsClosuresChart,
  JobStatusChart,
  SOPComplianceChart,
  QCVerificationChart,
  LaborHeatmap,
} from "@/components/dashboard/DashboardCharts";
import { DataTable, StatusBadge } from "@/components/dashboard/DataTable";
import { MainLayout } from "@/components/layout/MainLayout";

// KPI Data
const kpiData = [
  {
    title: "Total Requests",
    value: "1,248",
    subtitle: "This month",
    icon: FileText,
    trend: { value: 12, label: "vs last month" },
    variant: "default" as const,
  },
  {
    title: "Active Jobs",
    value: "87",
    subtitle: "In progress",
    icon: Briefcase,
    trend: { value: 5, label: "vs last week" },
    variant: "info" as const,
  },
  {
    title: "Delayed Jobs",
    value: "12",
    subtitle: "Past SLA",
    icon: Clock,
    trend: { value: -8, label: "improvement" },
    variant: "warning" as const,
  },
  {
    title: "Penalty ₹ at Risk",
    value: "₹4.8L",
    subtitle: "Total exposure",
    icon: IndianRupee,
    trend: { value: -15, label: "reduction" },
    variant: "danger" as const,
  },
  {
    title: "Inventory Alerts",
    value: "8",
    subtitle: "Reorder needed",
    icon: Package,
    trend: { value: 3, label: "new alerts" },
    variant: "warning" as const,
  },
  {
    title: "SOP Compliance",
    value: "94.5%",
    subtitle: "Overall rate",
    icon: CheckCircle,
    trend: { value: 2.5, label: "improvement" },
    variant: "success" as const,
  },
];

// Recent requests data
const recentRequests = [
  { id: "REQ-2024-0456", zone: "Northern", workshop: "Delhi", status: "Open", tat: "3 days" },
  { id: "REQ-2024-0455", zone: "Southern", workshop: "Chennai", status: "In Progress", tat: "5 days" },
  { id: "REQ-2024-0454", zone: "Western", workshop: "Mumbai", status: "Closed", tat: "2 days" },
  { id: "REQ-2024-0453", zone: "Eastern", workshop: "Kolkata", status: "Open", tat: "7 days" },
  { id: "REQ-2024-0452", zone: "Central", workshop: "Bhopal", status: "In Progress", tat: "4 days" },
];

// Inventory shortages data
const inventoryShortages = [
  { spare: "Piston Ring Set", reorderPoint: 25, vendor: "ABC Spares", eta: "3 days" },
  { spare: "Valve Plate Assembly", reorderPoint: 10, vendor: "XYZ Parts", eta: "5 days" },
  { spare: "Oil Filter", reorderPoint: 50, vendor: "Filter Pro", eta: "2 days" },
  { spare: "Gasket Kit", reorderPoint: 30, vendor: "Seal Master", eta: "4 days" },
];

// Escalated jobs data
const escalatedJobs = [
  { id: "JOB-2024-0123", reason: "Vendor delay", delayed: 5, assignedTo: "Rajesh Kumar" },
  { id: "JOB-2024-0118", reason: "Part shortage", delayed: 3, assignedTo: "Amit Singh" },
  { id: "JOB-2024-0115", reason: "QC rejection", delayed: 2, assignedTo: "Priya Sharma" },
];

const requestColumns = [
  { key: "id", header: "Request ID" },
  { key: "zone", header: "Zone" },
  { key: "workshop", header: "Workshop" },
  {
    key: "status",
    header: "Status",
    render: (value: string) => (
      <StatusBadge
        status={value}
        variant={
          value === "Closed" ? "success" : value === "In Progress" ? "warning" : "info"
        }
      />
    ),
  },
  { key: "tat", header: "TAT" },
];

const inventoryColumns = [
  { key: "spare", header: "Spare Name" },
  { key: "reorderPoint", header: "Reorder Point" },
  { key: "vendor", header: "Vendor" },
  { key: "eta", header: "ETA" },
];

const escalatedColumns = [
  { key: "id", header: "Job ID" },
  { key: "reason", header: "Reason" },
  {
    key: "delayed",
    header: "Days Delayed",
    render: (value: number) => (
      <span className="text-danger font-medium">{value} days</span>
    ),
  },
  { key: "assignedTo", header: "Assigned To" },
];

export default function Dashboard() {
  return (
    <MainLayout>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Enterprise Operations Overview • Updated just now
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {kpiData.map((kpi, index) => (
          <KPICard
            key={kpi.title}
            {...kpi}
            index={index}
          />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RequestsClosuresChart />
        <JobStatusChart />
        <SOPComplianceChart />
        <QCVerificationChart />
      </div>

      {/* Labor Heatmap - Full width */}
      <div className="mb-8">
        <LaborHeatmap />
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DataTable
          title="Recent Requests"
          columns={requestColumns}
          data={recentRequests}
        />
        <DataTable
          title="Inventory Shortages"
          columns={inventoryColumns}
          data={inventoryShortages}
        />
      </div>

      <DataTable
        title="Escalated Jobs"
        columns={escalatedColumns}
        data={escalatedJobs}
      />
    </MainLayout>
  );
}
