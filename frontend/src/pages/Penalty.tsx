import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "@/lib/api";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle, IndianRupee, Clock, CheckCircle, TrendingUp, Users,
  Grid3X3, List, Search, Download, Eye, Plus, Edit3, User, Printer, X, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// --- Theme Configs ---
const statusColors: Record<string, string> = {
  "Open": "status-danger",
  "In Review": "status-warning",
  "Resolved": "status-safe",
  "Critical": "status-danger",
  "Warning": "status-warning",
  "Normal": "status-safe",
};

interface BreachCase {
  id: string;
  zone: string;
  location: string;
  workshop: string;
  reason: string;
  delayed: number;
  penaltyRisk: number;
  assignedTo: string;
  status: string;
  vendor: string;
  loggedDate?: string;
}

export default function Penalty() {
  const [viewMode, setViewMode] = useState<"cards" | "grid">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "resolved" | "vendor">("active");
  const [selectedBreach, setSelectedBreach] = useState<BreachCase | null>(null);
  
  // Backend State
  const [penalties, setPenalties] = useState<BreachCase[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<BreachCase>>({ 
    zone: "Northern", status: "Open", delayed: 0, penaltyRisk: 0, reason: "", vendor: "", workshop: "", location: "" 
  });

  // --- 1. FETCH DATA FROM THE CORRECT ENDPOINT ---
  const fetchPenalties = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/operations/penalty/cases/`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setPenalties(data);
      if (selectedBreach) {
        const updated = data.find((p: any) => p.id === selectedBreach.id);
        if (updated) setSelectedBreach(updated);
      }
    } catch (error) { console.error("Fetch failed", error); }
  };

  useEffect(() => {
    fetchPenalties();
  }, []);

  // --- 2. DYNAMIC KPI & CHART CALCULATIONS ---
  const dynamicKPIs = useMemo(() => {
    const activeCases = penalties.filter(p => p.status !== "Resolved");
    const totalRisk = activeCases.reduce((sum, p) => sum + Number(p.penaltyRisk || 0), 0);
    const resolvedCases = penalties.filter(p => p.status === "Resolved").length;
    const avgDelay = penalties.length ? (penalties.reduce((sum, p) => sum + Number(p.delayed || 0), 0) / penalties.length).toFixed(1) : "0";

    return [
      { title: "Penalty ₹ at Risk", value: `₹${(totalRisk / 1000).toFixed(1)}K`, icon: IndianRupee, variant: "danger" as const },
      { title: "Breaches This Month", value: activeCases.length.toString(), icon: AlertTriangle, variant: "warning" as const },
      { title: "Resolved Cases", value: resolvedCases.toString(), icon: CheckCircle, variant: "success" as const },
      { title: "Avg Delay (Days)", value: avgDelay.toString(), icon: Clock, variant: "info" as const },
      { title: "Vendors at Risk", value: [...new Set(activeCases.map(p => p.vendor))].length.toString(), icon: Users, variant: "danger" as const },
      { title: "SLA Compliance", value: penalties.length ? `${Math.round((resolvedCases / penalties.length) * 100)}%` : "100%", icon: TrendingUp, variant: "success" as const },
    ];
  }, [penalties]);

  const chartData = useMemo(() => {
    const zones: Record<string, number> = { Northern: 0, Southern: 0, Western: 0, Eastern: 0, Central: 0 };
    const statuses = { Open: 0, "In Review": 0, Resolved: 0 };
    
    penalties.forEach(p => {
      if (zones[p.zone] !== undefined) zones[p.zone] += Number(p.penaltyRisk || 0);
      if (statuses[p.status as keyof typeof statuses] !== undefined) statuses[p.status as keyof typeof statuses] += 1;
    });

    return {
      zones: Object.entries(zones).map(([zone, penalty]) => ({ zone, penalty })),
      status: [
        { name: "Open", value: statuses.Open, color: "hsl(var(--danger))" },
        { name: "In Review", value: statuses["In Review"], color: "hsl(var(--warning))" },
        { name: "Resolved", value: statuses.Resolved, color: "hsl(var(--success))" },
      ],
      trend: [
        { month: "Current", breaches: penalties.length, penalty: penalties.reduce((s, p) => s + Number(p.penaltyRisk || 0), 0) }
      ]
    };
  }, [penalties]);

  const vendorTracker = useMemo(() => {
    const stats: Record<string, any> = {};
    penalties.forEach(p => {
      if (!p.vendor) return;
      if (!stats[p.vendor]) stats[p.vendor] = { vendor: p.vendor, totalPenalty: 0, breachCount: 0, totalDelay: 0 };
      stats[p.vendor].totalPenalty += Number(p.penaltyRisk || 0);
      stats[p.vendor].breachCount += 1;
      stats[p.vendor].totalDelay += Number(p.delayed || 0);
    });
    return Object.values(stats).map(v => ({
      ...v,
      avgDelay: Math.round(v.totalDelay / v.breachCount),
      status: v.breachCount >= 3 ? "Critical" : v.breachCount === 2 ? "Warning" : "Normal"
    })).sort((a, b) => b.totalPenalty - a.totalPenalty);
  }, [penalties]);

  // --- 3. CRUD ACTIONS MAPPED TO OPERATIONS ---
  const handleSaveBreach = async () => {
    const isEditing = !!formData.id;
    const url = isEditing 
      ? `${API_BASE_URL}/operations/penalty/cases/${formData.id}/` 
      : `${API_BASE_URL}/operations/penalty/cases/`;
      
    const payload = { ...formData };
    if (!isEditing) delete payload.id;

    await fetch(url, {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setFormOpen(false);
    fetchPenalties();
  };

  const handleAction = async (actionStatus: string) => {
    if (!selectedBreach) return;
    await fetch(`${API_BASE_URL}/operations/penalty/cases/${selectedBreach.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: actionStatus })
    });
    fetchPenalties();
  };

  const handleExport = () => {
    if (penalties.length === 0) return;
    const csv = "ID,Zone,Workshop,Vendor,Status,Risk\n" + penalties.map(p => `${p.id},${p.zone},${p.workshop},${p.vendor},${p.status},${p.penaltyRisk}`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement("a"); a.href = window.URL.createObjectURL(blob); a.download = "penalty_report.csv"; a.click();
  };

  // --- FILTER LOGIC ---
  const currentPenalties = activeTab === "active" ? penalties.filter(p => p.status !== "Resolved") : 
                           activeTab === "resolved" ? penalties.filter(p => p.status === "Resolved") : [];

  const filteredPenalties = currentPenalties.filter(p => 
    String(p.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(p.vendor || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(p.reason || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-red-600" /> Penalty War Room
          </h1>
          <p className="text-muted-foreground mt-1">Monitor and manage SLA breaches and penalties</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="font-bold border-slate-300" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wide" onClick={() => { 
            setFormData({zone: "Northern", status: "Open", delayed: 0, penaltyRisk: 0, reason: "", vendor: "", workshop: "", location: ""}); 
            setFormOpen(true); 
          }}>
            <Plus className="w-4 h-4 mr-2" /> Log Breach
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {dynamicKPIs.map((kpi, index) => <KPICard key={kpi.title} {...kpi} index={index} />)}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">Penalty by Zone</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.zones} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v/1000}K`} />
              <YAxis dataKey="zone" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={70} />
              <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, "Penalty"]} contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px" }} />
              <Bar dataKey="penalty" fill="hsl(var(--danger))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">Breaches vs Penalty Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v/1000}K`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px" }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="breaches" stroke="hsl(var(--warning))" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="penalty" stroke="hsl(var(--danger))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">Penalty Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={chartData.status} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {chartData.status.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABS & FILTERS */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {[
            { id: "active", label: "Active Cases" },
            { id: "resolved", label: "Resolved Cases" },
            { id: "vendor", label: "Vendor Tracker" },
          ].map((tab) => (
            <Button key={tab.id} variant={activeTab === tab.id ? "default" : "ghost"} size="sm" onClick={() => { setActiveTab(tab.id as any); setSelectedBreach(null); }}>
              {tab.label}
            </Button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        {(activeTab === "active" || activeTab === "resolved") && (
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button variant={viewMode === "cards" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("cards")}><Grid3X3 className="w-4 h-4" /></Button>
            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}><List className="w-4 h-4" /></Button>
          </div>
        )}
      </div>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cn(selectedBreach ? "lg:col-span-1" : "lg:col-span-3")}>
          
          {/* CARDS MODE */}
          {(activeTab === "active" || activeTab === "resolved") && viewMode === "cards" && (
            <div className={cn("grid gap-4", selectedBreach ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
              {filteredPenalties.map((penalty, index) => (
                <motion.div key={penalty.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} whileHover={{ y: -4 }} onClick={() => setSelectedBreach(penalty)} className={cn("bg-card rounded-xl p-5 shadow-soft-md border border-border hover:shadow-soft-lg transition-all cursor-pointer flex flex-col justify-between", selectedBreach?.id === penalty.id && "ring-2 ring-primary")}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-primary">{penalty.id}</h4>
                      <p className="text-sm text-muted-foreground">{penalty.zone} • {penalty.workshop}</p>
                    </div>
                    <span className={cn("status-badge", statusColors[penalty.status])}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" /> {penalty.status}
                    </span>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Breach Reason</span><span className="font-medium">{penalty.reason}</span></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Days Delayed</span><span className="font-medium text-danger">{penalty.delayed} days</span></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Penalty Risk</span><span className="font-bold text-danger">₹{Number(penalty.penaltyRisk).toLocaleString()}</span></div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full gap-2"><Eye className="w-4 h-4" /> View Details</Button>
                </motion.div>
              ))}
            </div>
          )}

          {/* GRID MODE */}
          {(activeTab === "active" || activeTab === "resolved") && viewMode === "grid" && (
            <div className="bg-card rounded-xl shadow-soft-md overflow-hidden border">
              <table className="data-table w-full">
                <thead>
                  <tr><th>Job ID</th><th>Zone / Workshop</th><th>Breach Reason</th><th>Days Delayed</th><th>Penalty ₹ at Risk</th><th>Assigned To</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {filteredPenalties.map((penalty) => (
                    <tr key={penalty.id} onClick={() => setSelectedBreach(penalty)} className="cursor-pointer hover:bg-muted/30">
                      <td className="font-medium text-primary">{penalty.id}</td>
                      <td>{penalty.zone} / {penalty.workshop}</td>
                      <td>{penalty.reason}</td>
                      <td className="text-danger font-medium">{penalty.delayed} days</td>
                      <td className="text-danger font-bold">₹{Number(penalty.penaltyRisk).toLocaleString()}</td>
                      <td>{penalty.assignedTo || "Unassigned"}</td>
                      <td><span className={cn("status-badge", statusColors[penalty.status])}>{penalty.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VENDOR TRACKER */}
          {activeTab === "vendor" && (
            <div className="bg-card rounded-xl shadow-soft-md overflow-hidden border">
              <table className="data-table w-full">
                <thead>
                  <tr><th>Vendor Name</th><th>Total Penalty ₹</th><th>SLA Breach Count</th><th>Avg Delay</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {vendorTracker.map((vendor) => (
                    <tr key={vendor.vendor}>
                      <td className="font-medium">{vendor.vendor}</td>
                      <td className="text-danger font-bold">₹{vendor.totalPenalty.toLocaleString()}</td>
                      <td>{vendor.breachCount}</td>
                      <td>{vendor.avgDelay} days</td>
                      <td><span className={cn("status-badge", statusColors[vendor.status])}>{vendor.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SIDEBAR DETAIL VIEW Panel */}
        <AnimatePresence>
          {selectedBreach && (activeTab === "active" || activeTab === "resolved") && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-xl p-6 shadow-soft-md sticky top-24 border">
                <div className="flex items-center justify-between mb-6 border-b pb-4">
                  <div>
                    <h3 className="text-xl font-bold">{selectedBreach.id} Case Details</h3>
                    <p className="text-muted-foreground">{selectedBreach.zone} • {selectedBreach.workshop}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { setFormData(selectedBreach); setFormOpen(true); }}><Edit3 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedBreach(null)}><X className="w-5 h-5" /></Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div><p className="text-sm text-muted-foreground">Vendor</p><p className="font-medium">{selectedBreach.vendor}</p></div>
                  <div><p className="text-sm text-muted-foreground">Status</p><span className={cn("status-badge mt-1 inline-flex", statusColors[selectedBreach.status])}>{selectedBreach.status}</span></div>
                  <div><p className="text-sm text-muted-foreground">Days Delayed</p><p className="font-bold text-danger">{selectedBreach.delayed} Days</p></div>
                  <div><p className="text-sm text-muted-foreground">Penalty Risk</p><p className="font-bold text-danger">₹{Number(selectedBreach.penaltyRisk).toLocaleString()}</p></div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Breach Reason</p>
                  <p className="font-medium">{selectedBreach.reason}</p>
                </div>

                <div className="p-4 border border-border rounded-lg mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Assigned Specialist</p>
                    <p className="font-medium flex items-center gap-2"><User className="w-4 h-4 text-primary" /> {selectedBreach.assignedTo || "Unassigned"}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>Assign Case</Button>
                </div>

                <div className="flex gap-3">
                  {selectedBreach.status !== "Resolved" ? (
                    <>
                      <Button className="flex-1" variant="secondary" onClick={() => handleAction("In Review")}>Mark In Review</Button>
                      <Button className="flex-1 bg-success hover:bg-success/90 text-white font-bold" onClick={() => handleAction("Resolved")}>Resolve Case</Button>
                    </>
                  ) : (
                    <Button className="w-full" variant="outline" onClick={() => handleAction("Open")}>Reopen Case</Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- ADD / EDIT RECORD MODAL --- */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{formData.id ? "Modify Breach Record" : "Log New SLA Breach"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Zone</Label>
                <Select value={formData.zone} onValueChange={(v) => setFormData({...formData, zone: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="Northern">Northern</SelectItem><SelectItem value="Southern">Southern</SelectItem><SelectItem value="Western">Western</SelectItem><SelectItem value="Eastern">Eastern</SelectItem><SelectItem value="Central">Central</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="Open">Open</SelectItem><SelectItem value="In Review">In Review</SelectItem><SelectItem value="Resolved">Resolved</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Vendor</Label><Input value={formData.vendor} onChange={(e) => setFormData({...formData, vendor: e.target.value})} /></div>
              <div><Label>Workshop</Label><Input value={formData.workshop} onChange={(e) => setFormData({...formData, workshop: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Days Delayed</Label><Input type="number" value={formData.delayed} onChange={(e) => setFormData({...formData, delayed: Number(e.target.value)})} /></div>
              <div><Label>Penalty Risk (₹)</Label><Input type="number" value={formData.penaltyRisk} onChange={(e) => setFormData({...formData, penaltyRisk: Number(e.target.value)})} /></div>
            </div>
            <div><Label>Breach Reason</Label><Textarea rows={3} value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} /></div>
            <Button onClick={handleSaveBreach} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12">Save Record</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- ASSIGN SPECIALIST DIALOG --- */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Assign Specialist</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Label>Operator / Specialist Name</Label>
            <Input placeholder="e.g. Rajesh Kumar" onChange={(e) => setFormData({...formData, assignedTo: e.target.value})} />
            <Button className="w-full bg-slate-900 text-white font-bold" onClick={async () => {
              if(!selectedBreach) return;
              await fetch(`${API_BASE_URL}/operations/penalty/cases/${selectedBreach.id}/`, { method: "PATCH", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ assignedTo: formData.assignedTo }) });
              setAssignOpen(false);
              fetchPenalties();
            }}>Confirm Assignment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}