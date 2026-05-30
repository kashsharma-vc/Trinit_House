import { motion } from "framer-motion";
import {
  FileText,
  Briefcase,
  Clock,
  IndianRupee,
  Package,
  CheckCircle,
  FlaskConical,
} from "lucide-react";

import { KPICard } from "@/components/dashboard/KPICard";

import { JobStatusChart } from "@/components/dashboard/JobStatusChart";

// keep your other chart imports
import { RequestsClosuresChart } from "@/components/dashboard/RequestsClosuresChart";
import { SOPComplianceChart } from "@/components/dashboard/SOPComplianceChart";
import { QCVerificationChart } from "@/components/dashboard/QCVerificationChart";
import { LaborHeatmap } from "@/components/dashboard/LaborHeatmap";

import {
  DataTable,
  StatusBadge,
} from "@/components/dashboard/DataTable";

import { MainLayout } from "@/components/layout/MainLayout";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";

// KPI Data
const kpiData = [
  {
    title: "Total Batches",
    value: "1,248",
    subtitle: "This month",
    icon: FileText,
    trend: {
      value: 12,
      label: "vs last month",
    },
    variant: "default" as const,
  },
  {
    title: "Active Production",
    value: "87",
    subtitle: "In blending/packing",
    icon: Briefcase,
    trend: {
      value: 5,
      label: "vs last week",
    },
    variant: "info" as const,
  },
  {
    title: "QA Hold/Pending",
    value: "12",
    subtitle:
      "Awaiting lab sign-off",
    icon: FlaskConical,
    trend: {
      value: -8,
      label: "improvement",
    },
    variant: "warning" as const,
  },
  {
    title: "Cost of Waste",
    value: "₹4.8L",
    subtitle: "Monthly loss",
    icon: IndianRupee,
    trend: {
      value: -15,
      label: "reduction",
    },
    variant: "danger" as const,
  },
  {
    title: "Raw Material Alerts",
    value: "8",
    subtitle: "Reorder needed",
    icon: Package,
    trend: {
      value: 3,
      label: "new alerts",
    },
    variant: "warning" as const,
  },
  {
    title: "Batch Compliance",
    value: "94.5%",
    subtitle:
      "Formulation accuracy",
    icon: CheckCircle,
    trend: {
      value: 2.5,
      label: "improvement",
    },
    variant: "success" as const,
  },
];

// Dynamic Data Loading handled in component

const requestColumns = [
  { key: "id", header: "Batch ID" },
  { key: "zone", header: "Zone" },
  {
    key: "workshop",
    header: "Facility",
  },
  {
    key: "status",
    header: "Status",
    render: (value: string) => (
      <StatusBadge
        status={value}
        variant={
          value === "Closed"
            ? "success"
            : "info"
        }
      />
    ),
  },
  { key: "tat", header: "TAT" },
];

const inventoryColumns = [
  {
    key: "spare",
    header: "Raw Material",
  },
  {
    key: "reorderPoint",
    header: "Safety Stock",
  },
  {
    key: "vendor",
    header: "Vendor",
  },
  {
    key: "eta",
    header: "Restock ETA",
  },
];

const escalatedColumns = [
  {
    key: "id",
    header: "Alert ID",
  },
  {
    key: "reason",
    header: "Issue",
  },
  {
    key: "delayed",
    header: "Delay (Days)",
  },
  {
    key: "assignedTo",
    header: "Responsible",
  },
];

export default function Dashboard() {
  const [batches, setBatches] = useState<any[]>([]);
  const [qualityEscalations, setQualityEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Still keeping static for material shortages since we don't have an inventory endpoint yet
  const materialShortages = [
    { spare: "Whey Concentrate 80%", reorderPoint: 500, vendor: "DairySource Inc", eta: "3 days" },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Token ${token}` };

        const [requestsRes, penaltiesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/operations/requests/`, { headers }),
          fetch(`${API_BASE_URL}/operations/penalty/cases/`, { headers })
        ]);

        if (requestsRes.ok) {
          const reqData = await requestsRes.json();
          const reqArray = Array.isArray(reqData) ? reqData : reqData.results || [];
          setBatches(reqArray.map((r: any) => ({
            id: r.request_id,
            zone: r.zone?.zone_name || r.assigned_role || "Unassigned",
            workshop: r.workshop?.workshop_name || r.compressor_model || "General",
            status: r.status,
            tat: `${r.sla_tat_days || 0} days`
          })));
        }

        if (penaltiesRes.ok) {
          const penData = await penaltiesRes.json();
          const penArray = Array.isArray(penData) ? penData : penData.results || [];
          setQualityEscalations(penArray.map((p: any) => ({
            id: p.id,
            reason: p.reason,
            delayed: p.delayed,
            assignedTo: p.assignedTo || p.vendor || "Unassigned"
          })));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Build dynamic KPI values without mutating the constant
  const dynamicKpiData = kpiData.map((kpi, i) => {
    if (i === 0) return { ...kpi, value: batches.length.toString() };
    if (i === 1) return { ...kpi, value: batches.filter(b => b.status === "In Progress" || b.status === "Open").length.toString() };
    if (i === 2) return { ...kpi, value: batches.filter(b => b.status === "Draft").length.toString() };
    if (i === 3) return { ...kpi, value: qualityEscalations.length.toString() };
    return kpi;
  });

  return (
    <MainLayout>
      <motion.div
        initial={{
          opacity: 0,
          y: -10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold">
          Production Dashboard
        </h1>

        <p className="text-muted-foreground mt-1">
          Supplement Manufacturing
          Overview • Live Feed
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {dynamicKpiData.map(
          (kpi, index) => (
            <KPICard
              key={kpi.title}
              {...kpi}
              index={index}
            />
          )
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RequestsClosuresChart
          data={batches}
        />

        <JobStatusChart
          data={batches}
        />

        <SOPComplianceChart
          data={batches}
        />

        <QCVerificationChart
          data={batches}
        />
      </div>

      <div className="mb-8">
        <LaborHeatmap />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DataTable
          title="Recent Production Batches"
          columns={
            requestColumns
          }
          data={batches}
        />

        <DataTable
          title="Critical Material Shortages"
          columns={
            inventoryColumns
          }
          data={
            materialShortages
          }
        />
      </div>

      <DataTable
        title="Quality Escalations"
        columns={
          escalatedColumns
        }
        data={
          qualityEscalations
        }
      />
    </MainLayout>
  );
}