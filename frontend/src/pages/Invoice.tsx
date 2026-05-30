import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@/lib/api";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable, StatusBadge } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Eye, CheckCircle, Plus, Printer, FileSpreadsheet, Search } from "lucide-react";
import { InvoiceClosureModal } from "@/components/invoice/InvoiceClosureModal"; 

export default function Invoice() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  
  // FULL State: Including all fields we discussed
  const [newInvoice, setNewInvoice] = useState({
    job_code: "", 
    department_role: "Financer", 
    facility: "Mumbai Main Plant",
    issued_by: "Admin",
    total_amount: 0,
    status: "Pending Review" 
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const headers = token ? { "Authorization": `Token ${token}` } : {};

      const invRes = await fetch(`${API_BASE_URL}/finance/invoices/`, { headers });
      const invData = await invRes.json();
      const rawInvoices = Array.isArray(invData) ? invData : (invData.results || []);

      const formattedInvoices = rawInvoices.map((inv: any) => ({
        id: inv.id, 
        displayId: inv.invoice_id || `INV-${inv.id}`, 
        jobCode: inv.department_role || "Unknown",
        batchId: inv.job_code || "N/A",
        facility: inv.facility || "N/A",
        date: inv.created_at || inv.date || new Date().toISOString().split('T')[0],
        status: inv.status || "Pending Review",
        totalAmount: inv.total_amount || 0,
      }));
      setInvoices(formattedInvoices);

      const batchRes = await fetch(`${API_BASE_URL}/operations/requests/`, { headers });
      const batchData = await batchRes.json();
      const rawBatches = Array.isArray(batchData) ? batchData : (batchData.results || []);

      const usedBatchIds = rawInvoices.map((inv: any) => inv.job_code);
      // Only allow invoices for Closed requests
      setAvailableBatches(rawBatches.filter((b: any) => !usedBatchIds.includes(b.id) && b.status === "Closed"));
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => 
      inv.displayId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.batchId.toString().includes(searchTerm) ||
      inv.jobCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const handleExportCSV = () => {
    let csv = "Invoice ID,Batch ID,Department Role,Facility,Date,Status,Amount\n";
    filteredInvoices.forEach(inv => {
      csv += `${inv.displayId},${inv.batchId},${inv.jobCode},${inv.facility},${inv.date},${inv.status},${inv.totalAmount}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoices_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  const columns = [
    { key: "displayId", header: "Invoice ID" }, 
    { key: "batchId", header: "Batch ID" },
    { key: "jobCode", header: "Department Role" },
    { key: "facility", header: "Facility" },
    { key: "date", header: "Date Created" },
    { key: "status", header: "Status", render: (val: string) => <StatusBadge status={val} variant={val === "Closed" ? "success" : "warning"} /> },
    {
      key: "actions",
      header: "Actions",
      render: (_: any, item: any) => (
        <Button variant={item.status === "Closed" ? "outline" : "default"} size="sm" className="gap-2" onClick={() => { setSelectedInvoice(item); setClosureModalOpen(true); }}>
          {item.status === "Closed" ? <><Eye className="w-4 h-4" /> View</> : <><CheckCircle className="w-4 h-4" /> Close</>}
        </Button>
      )
    }
  ];

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Finance & Costing</h1>
            <p className="text-muted-foreground">Manage and export your batch invoicing.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> PDF</Button>
            <Button variant="outline" onClick={handleExportCSV}><FileSpreadsheet className="w-4 h-4 mr-2" /> CSV</Button>
            <Button onClick={() => setAddModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Invoice</Button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by Invoice ID, Batch ID, or Role..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <DataTable title="Active Invoices" columns={columns} data={filteredInvoices} />

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create New Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Batch Dropdown */}
            <Label>Select Batch</Label>
            <Select value={newInvoice.job_code} onValueChange={(val) => setNewInvoice({...newInvoice, job_code: val})}>
              <SelectTrigger><SelectValue placeholder="Pick a batch" /></SelectTrigger>
              <SelectContent>
                {availableBatches.map(b => <SelectItem key={b.id} value={b.id.toString()}>Batch #{b.id}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Department Role */}
            <Label>Department / Role</Label>
            <Select value={newInvoice.department_role} onValueChange={(val) => setNewInvoice({...newInvoice, department_role: val})}>
              <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Sales Head">Sales Head</SelectItem>
                <SelectItem value="Financer">Financer</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>

            {/* Status */}
            <Label>Initial Status</Label>
            <Select value={newInvoice.status} onValueChange={(val) => setNewInvoice({...newInvoice, status: val})}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending Review">Pending Review</SelectItem>
                <SelectItem value="Pending Sign-off">Pending Sign-off</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Facility & Admin & Amount */}
            <Label>Facility</Label>
            <Input value={newInvoice.facility} onChange={(e) => setNewInvoice({...newInvoice, facility: e.target.value})} />
            
            <Label>Issued By (Admin)</Label>
            <Input value={newInvoice.issued_by} onChange={(e) => setNewInvoice({...newInvoice, issued_by: e.target.value})} />
            
            <Label>Initial Amount</Label>
            <Input type="number" value={newInvoice.total_amount} onChange={(e) => setNewInvoice({...newInvoice, total_amount: parseFloat(e.target.value)})} />
            
            <Button className="w-full mt-4" onClick={async () => {
              try {
                const res = await fetch(`${API_BASE_URL}/finance/invoices/`, { 
                  method: "POST", 
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${localStorage.getItem("token")}`
                  }, 
                  body: JSON.stringify(newInvoice) 
                });
                if (res.ok) { 
                  setAddModalOpen(false); 
                  fetchData(); 
                  toast.success("Invoice created successfully");
                } else { 
                  const errData = await res.json();
                  toast.error(errData[0] || "Failed to create invoice. Ensure the batch is Closed.");
                }
              } catch (e) {
                toast.error("Network error while creating invoice");
              }
            }}>Submit</Button>
          </div>
        </DialogContent>
      </Dialog>

      <InvoiceClosureModal 
        open={closureModalOpen} 
        onClose={() => setClosureModalOpen(false)} 
        invoice={selectedInvoice} 
        mode="admin"
        authToken={localStorage.getItem("token") || localStorage.getItem("authToken") || undefined}
        onClosureComplete={fetchData} 
      />
    </MainLayout>
  );
}