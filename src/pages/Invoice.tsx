import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileCheck,
  IndianRupee,
  Clock,
  CheckCircle,
  Search,
  Download,
  Printer,
  Mail,
  PenTool,
  MapPin,
  Calendar,
  Eye,
  Grid3X3,
  List,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KPICard } from "@/components/dashboard/KPICard";
import { InvoiceClosureModal } from "@/components/invoice/InvoiceClosureModal";

// KPI Data
const invoiceKPIs = [
  { title: "Total Closed", value: "156", subtitle: "This month", icon: CheckCircle, variant: "success" as const },
  { title: "Total Value", value: "₹12.4L", subtitle: "Monthly revenue", icon: IndianRupee, variant: "default" as const },
  { title: "Pending Sign-off", value: "12", subtitle: "Awaiting closure", icon: Clock, variant: "warning" as const },
  { title: "Total Penalties", value: "₹85K", subtitle: "Deductions", icon: AlertTriangle, variant: "danger" as const },
];

// Invoice records
const invoiceRecords = [
  {
    id: "INV-2024-0156",
    jobCode: "JOB-2024-0123",
    zone: "Northern Zone",
    totalAmount: "₹45,000",
    finalAmount: "₹42,500",
    status: "Pending Review",
    date: "28 Jan 2024",
  },
  {
    id: "INV-2024-0155",
    jobCode: "JOB-2024-0118",
    zone: "Southern Zone",
    totalAmount: "₹38,000",
    finalAmount: "₹38,000",
    status: "Pending Sign-off",
    date: "27 Jan 2024",
  },
  {
    id: "INV-2024-0154",
    jobCode: "JOB-2024-0115",
    zone: "Western Zone",
    totalAmount: "₹52,000",
    finalAmount: "₹48,500",
    status: "Closed",
    date: "26 Jan 2024",
  },
  {
    id: "INV-2024-0153",
    jobCode: "JOB-2024-0112",
    zone: "Eastern Zone",
    totalAmount: "₹41,000",
    finalAmount: "₹39,000",
    status: "Closed",
    date: "25 Jan 2024",
  },
  {
    id: "INV-2024-0152",
    jobCode: "JOB-2024-0108",
    zone: "Central Zone",
    totalAmount: "₹33,500",
    finalAmount: "₹33,500",
    status: "Pending Review",
    date: "24 Jan 2024",
  },
  {
    id: "INV-2024-0151",
    jobCode: "JOB-2024-0105",
    zone: "Northern Zone",
    totalAmount: "₹28,000",
    finalAmount: "₹25,500",
    status: "Closed",
    date: "23 Jan 2024",
  },
];

// Audit trail records
const auditTrail = [
  { id: 1, invoiceId: "INV-2024-0154", action: "Case Closed", user: "Rajesh Kumar", timestamp: "26 Jan 2024, 4:30 PM", location: "Delhi Workshop" },
  { id: 2, invoiceId: "INV-2024-0154", action: "Signature Captured", user: "Rajesh Kumar", timestamp: "26 Jan 2024, 4:28 PM", location: "Delhi Workshop" },
  { id: 3, invoiceId: "INV-2024-0154", action: "Invoice Reviewed", user: "Amit Singh", timestamp: "26 Jan 2024, 2:15 PM", location: "Delhi Workshop" },
  { id: 4, invoiceId: "INV-2024-0153", action: "Case Closed", user: "Priya Sharma", timestamp: "25 Jan 2024, 5:45 PM", location: "Kolkata Workshop" },
  { id: 5, invoiceId: "INV-2024-0151", action: "Case Closed", user: "Vikram Patel", timestamp: "23 Jan 2024, 3:00 PM", location: "Delhi Workshop" },
];

// Workflow steps
const workflowSteps = [
  { id: 1, name: "Review Invoice", description: "Verify line items", status: "completed" },
  { id: 2, name: "Sign-off", description: "Digital signature capture", status: "active" },
  { id: 3, name: "Case Closed", description: "Audit complete", status: "pending" },
];

const statusColors: Record<string, string> = {
  "Pending Review": "status-warning",
  "Pending Sign-off": "status-info",
  Closed: "status-safe",
};

const stepColors: Record<string, string> = {
  completed: "bg-success text-success-foreground",
  active: "bg-primary text-primary-foreground",
  pending: "bg-muted text-muted-foreground",
};

interface InvoiceRecord {
  id: string;
  jobCode: string;
  zone: string;
  totalAmount: string;
  finalAmount: string;
  status: string;
  date?: string;
}

export default function Invoice() {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "grid">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "closed" | "audit">("all");

  const handleOpenClosure = (invoice: InvoiceRecord) => {
    setSelectedInvoice(invoice);
    setShowClosureModal(true);
  };

  const filteredInvoices = invoiceRecords.filter(inv => {
    const matchesSearch = inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.jobCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.zone.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending") return matchesSearch && inv.status !== "Closed";
    if (activeTab === "closed") return matchesSearch && inv.status === "Closed";
    return matchesSearch;
  });

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoice & Closure</h1>
          <p className="text-muted-foreground mt-1">
            Unified invoice preview and digital sign-off workflow
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button variant="outline" className="gap-2">
            <Mail className="w-4 h-4" />
            Email
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {invoiceKPIs.map((kpi, index) => (
          <KPICard key={kpi.title} {...kpi} index={index} />
        ))}
      </div>

      {/* Workflow Steps Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-6 shadow-soft-md mb-6"
      >
        <h3 className="text-lg font-semibold mb-6">Closure Workflow</h3>
        <div className="flex items-center justify-between">
          {workflowSteps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-semibold",
                    stepColors[step.status]
                  )}
                >
                  {step.status === "completed" ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    step.id
                  )}
                </motion.div>
                <p className="mt-2 font-medium text-sm">{step.name}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {index < workflowSteps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-4",
                  step.status === "completed" ? "bg-success" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tabs and Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {[
            { id: "all", label: "All Invoices" },
            { id: "pending", label: "Pending" },
            { id: "closed", label: "Closed" },
            { id: "audit", label: "Audit Trail" },
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
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {activeTab !== "audit" && (
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
        )}
      </div>

      {/* Audit Trail View */}
      {activeTab === "audit" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-soft-md overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Audit Trail</h3>
            <p className="text-sm text-muted-foreground">Complete log of all invoice actions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Timestamp</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {auditTrail.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="font-medium text-primary">{log.invoiceId}</td>
                    <td>
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                        log.action === "Case Closed" ? "bg-success/10 text-success" :
                        log.action === "Signature Captured" ? "bg-info/10 text-info" :
                        "bg-warning/10 text-warning"
                      )}>
                        {log.action === "Case Closed" && <CheckCircle className="w-3 h-3" />}
                        {log.action === "Signature Captured" && <PenTool className="w-3 h-3" />}
                        {log.action === "Invoice Reviewed" && <FileCheck className="w-3 h-3" />}
                        {log.action}
                      </span>
                    </td>
                    <td>{log.user}</td>
                    <td className="text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {log.timestamp}
                      </span>
                    </td>
                    <td className="text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {log.location}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Invoice Cards View */}
      {activeTab !== "audit" && viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvoices.map((invoice, index) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="bg-card rounded-xl p-5 shadow-soft-md border border-border hover:shadow-soft-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-primary">{invoice.id}</h4>
                  <p className="text-sm text-muted-foreground">{invoice.jobCode}</p>
                </div>
                <span className={cn("status-badge", statusColors[invoice.status])}>
                  {invoice.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Zone</span>
                  <span className="font-medium">{invoice.zone}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">{invoice.totalAmount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Final Amount</span>
                  <span className="font-bold text-primary">{invoice.finalAmount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{invoice.date}</span>
                </div>
              </div>

              <Button 
                size="sm" 
                variant={invoice.status === "Closed" ? "outline" : "default"}
                className="w-full gap-2"
                onClick={() => handleOpenClosure(invoice)}
              >
                <Eye className="w-4 h-4" />
                {invoice.status === "Closed" ? "View Details" : "Process Closure"}
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Invoice Grid View */}
      {activeTab !== "audit" && viewMode === "grid" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-soft-md overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Job Code</th>
                  <th>Zone</th>
                  <th>Total Amount</th>
                  <th>Final Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice, index) => (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      invoice.status === "Pending Sign-off" && "bg-warning-muted/30"
                    )}
                  >
                    <td className="font-medium text-primary">{invoice.id}</td>
                    <td>{invoice.jobCode}</td>
                    <td>{invoice.zone}</td>
                    <td>{invoice.totalAmount}</td>
                    <td className="font-bold">{invoice.finalAmount}</td>
                    <td>
                      <span className={cn("status-badge", statusColors[invoice.status])}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <Button 
                        size="sm" 
                        variant={invoice.status === "Closed" ? "ghost" : "default"}
                        onClick={() => handleOpenClosure(invoice)}
                        className="gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        {invoice.status === "Closed" ? "View" : "Process"}
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Invoice Closure Modal */}
      <InvoiceClosureModal
        open={showClosureModal}
        onClose={() => setShowClosureModal(false)}
        invoice={selectedInvoice}
        onClosureComplete={() => {
          // Update metrics in real-time would happen here
          console.log("Closure completed for", selectedInvoice?.id);
        }}
      />
    </MainLayout>
  );
}
