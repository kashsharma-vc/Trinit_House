import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Grid3X3, List, Search, Download, Plus, Eye, Trash2, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  safe: "bg-emerald-100 text-emerald-700",
  order: "bg-amber-100 text-amber-700",
  blocked: "bg-red-100 text-red-700",
};

const statusLabels = {
  safe: "Safe Stock",
  order: "Reorder",
  blocked: "Critical",
};

export default function Inventory() {
  const [viewMode, setViewMode] = useState<"cards" | "grid">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  
  // DYNAMIC SETUP STATES
  const [categories, setCategories] = useState<any[]>([]); 
  const [compressors, setCompressors] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  
  // Adjusted State to accept undefined for dropdowns
  const [formData, setFormData] = useState({
    id: "", sku: "", name: "", categoryId: undefined as string | undefined, compressorId: undefined as string | undefined, 
    workshopId: undefined as string | undefined, vendor: "", currentStock: 0, safetyStock: 0, unitPrice: 0
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const invResponse = await fetch(`${API_BASE_URL}/inventory/items/`);
      if (!invResponse.ok) throw new Error("Failed to fetch inventory");
      const invData = await invResponse.json();
      const rawItems = Array.isArray(invData) ? invData : (invData.results || []);

      const formattedData = rawItems.map((item: any) => ({
        id: item.id || "",
        sku: item.sku || "", // Keep empty strings empty for form display
        name: item.name || "Unknown Item",
        category: item.cat_name || "Uncategorized",
        categoryId: item.category || "",
        compressor: item.comp_name || "Unknown",
        compressorId: item.compressor || "",
        workshop: item.work_name || "Unknown",
        workshopId: item.workshop || "",
        vendor: item.vendor || "",
        currentStock: item.current_stock || 0,
        safetyStock: item.safety_stock || 0,
        unitPrice: item.unit_price || 0,
        status: item.status || "safe", 
      }));

      setInventoryItems(formattedData);

      try {
        const [catRes, compRes, workRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/setups/categories/`),
          fetch(`${API_BASE_URL}/setups/compressors/`),
          fetch(`${API_BASE_URL}/setups/workshops/`) 
        ]);

        if (catRes.status === "fulfilled" && catRes.value.ok) {
          const data = await catRes.value.json();
          setCategories(Array.isArray(data) ? data : data.results || []);
        }
        if (compRes.status === "fulfilled" && compRes.value.ok) {
          const data = await compRes.value.json();
          setCompressors(Array.isArray(data) ? data : data.results || []);
        }
        if (workRes.status === "fulfilled" && workRes.value.ok) {
          const data = await workRes.value.json();
          setWorkshops(Array.isArray(data) ? data : data.results || []);
        }
      } catch (setupErr) {
        console.warn("Could not fetch setup configurations.");
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Securely maps table data to the Edit Form ---
  const openEditModal = (item: any) => {
    setFormData({
      id: item.id,
      sku: item.sku === "N/A" ? "" : item.sku,
      name: item.name,
      categoryId: item.categoryId ? String(item.categoryId) : undefined,
      compressorId: item.compressorId ? String(item.compressorId) : undefined,
      workshopId: item.workshopId ? String(item.workshopId) : undefined,
      vendor: item.vendor === "Unknown Vendor" ? "" : item.vendor,
      currentStock: Number(item.currentStock),
      safetyStock: Number(item.safetyStock),
      unitPrice: Number(item.unitPrice)
    });
    setFormOpen(true);
  };

  // --- Resets form for a blank Add Item ---
  const openAddModal = () => {
    setFormData({
      id: "", sku: "", name: "", categoryId: undefined, compressorId: undefined, workshopId: undefined, 
      vendor: "", currentStock: 0, safetyStock: 0, unitPrice: 0
    });
    setFormOpen(true);
  };

  // --- Smart Save with Exact Django Error Catching ---
  const handleSaveItem = async () => {
    // 1. Basic Frontend Validation
    if (!formData.name.trim()) return alert("Please enter an Item Name.");

    const isEditing = !!formData.id;
    const url = isEditing ? `${API_BASE_URL}/inventory/items/${formData.id}/` : `${API_BASE_URL}/inventory/items/`;

    // Send null for blank SKU so Django's Unique constraint doesn't crash on multiple empty strings
    const payload = {
      sku: formData.sku.trim() === "" ? null : formData.sku,
      name: formData.name,
      category: formData.categoryId ? Number(formData.categoryId) : null,
      compressor: formData.compressorId ? Number(formData.compressorId) : null,
      workshop: formData.workshopId ? Number(formData.workshopId) : null,
      vendor: formData.vendor.trim() === "" ? "" : formData.vendor,
      current_stock: Number(formData.currentStock),
      safety_stock: Number(formData.safetyStock),
      unit_price: Number(formData.unitPrice)
    };

    try {
      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      // 2. Catch the EXACT Django Validation Error
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Django Validation Error:", errorData);
        
        // Format the error nicely for the alert box
        const errorMessages = Object.entries(errorData)
          .map(([field, msgs]) => `${field.toUpperCase()}: ${msgs}`)
          .join('\n');
          
        alert(`Cannot save item:\n${errorMessages}`);
        return; // Stop execution
      }
      
      setFormOpen(false);
      fetchData(); 
    } catch (err) {
      alert("Failed to save item. Check backend connection.");
    }
  };

  const handleDeleteItem = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/items/${id}/`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete item");
      setFormOpen(false);
      fetchData();
    } catch (err) {
      alert("Failed to delete item.");
    }
  };

  const handleExport = () => {
    if (inventoryItems.length === 0) return;
    const csv = "SKU,Name,Category,Type,Workshop,Stock,Safety,Vendor,Unit Price,Status\n" + 
      inventoryItems.map(i => `${i.sku || 'N/A'},${i.name},${i.category},${i.compressor},${i.workshop},${i.currentStock},${i.safetyStock},${i.vendor || 'N/A'},${i.unitPrice},${statusLabels[i.status as keyof typeof statusLabels] || i.status}`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement("a"); 
    a.href = window.URL.createObjectURL(blob); 
    a.download = "inventory_report.csv"; 
    a.click();
  };

  const filteredItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <MainLayout><div className="flex justify-center items-center h-[60vh]">Loading...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground mt-1 font-medium">Track spare parts, workshops, and pricing.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button className="gap-2 font-bold uppercase tracking-wide" onClick={openAddModal}>
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search SKU, Name, or Category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-1 border rounded-lg p-1 bg-white">
          <Button variant={viewMode === "cards" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("cards")}><Grid3X3 className="w-4 h-4" /></Button>
          <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}><List className="w-4 h-4" /></Button>
        </div>
      </div>

      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase mb-0.5">{item.sku || "N/A"}</p>
                  <h3 className="font-bold text-slate-900 leading-tight">{item.name}</h3>
                </div>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ml-2 whitespace-nowrap", statusColors[item.status as keyof typeof statusColors])}>
                  {statusLabels[item.status as keyof typeof statusLabels] || item.status}
                </span>
              </div>
              
              <div className="text-xs text-slate-600 mb-4 bg-slate-50 p-2 rounded-md border border-slate-100">
                <p><strong>Cat:</strong> {item.category}</p>
                <p><strong>Type:</strong> {item.compressor}</p>
                <p><strong>Workshop:</strong> {item.workshop}</p>
              </div>
              
              <div className="space-y-2 mb-4 font-bold text-xs uppercase text-slate-500">
                <div className="flex justify-between"><span>Current Stock:</span><span className={cn("text-slate-900", item.currentStock <= item.safetyStock ? "text-red-600" : "")}>{item.currentStock}</span></div>
                <div className="flex justify-between"><span>Safety Level:</span><span className="text-slate-900">{item.safetyStock}</span></div>
                <div className="flex justify-between text-emerald-700"><span>Price:</span><span>₹{item.unitPrice}</span></div>
              </div>
              
              <Button size="sm" variant="outline" className="w-full font-bold" onClick={() => openEditModal(item)}>Modify Details</Button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 font-black uppercase text-[11px] text-slate-500 border-b">
                <tr><th className="p-4">SKU</th><th className="p-4">Item Name</th><th className="p-4">Category / Type</th><th className="p-4">Workshop</th><th className="p-4">Stock (Saf)</th><th className="p-4">Price</th><th className="p-4">Status</th><th className="p-4">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-4 text-xs font-bold text-slate-500">{item.sku || "N/A"}</td>
                    <td className="p-4 font-bold text-slate-900">{item.name}</td>
                    <td className="p-4 text-xs">
                      <p className="font-bold text-slate-700">{item.category}</p>
                      <p className="text-slate-500">{item.compressor}</p>
                    </td>
                    <td className="p-4 text-slate-600">{item.workshop}</td>
                    <td className="p-4">
                      <span className={cn("font-bold", item.currentStock <= item.safetyStock ? "text-red-600" : "text-slate-900")}>{item.currentStock}</span>
                      <span className="text-slate-400 text-xs ml-1">({item.safetyStock})</span>
                    </td>
                    <td className="p-4 font-bold text-emerald-700">₹{item.unitPrice}</td>
                    <td className="p-4"><span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase", statusColors[item.status as keyof typeof statusColors])}>{statusLabels[item.status as keyof typeof statusLabels] || item.status}</span></td>
                    
                    <td className="p-4"><Button size="icon" variant="ghost" onClick={() => openEditModal(item)}><Eye className="w-4 h-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CRUD MODAL --- */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle className="font-black uppercase tracking-tight text-xl">{formData.id ? "Modify Inventory Item" : "Add New Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1"><Label className="font-bold text-xs uppercase text-slate-500">SKU / Code</Label><Input value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} placeholder="e.g. VLV-001" /></div>
              <div className="col-span-2"><Label className="font-bold text-xs uppercase text-slate-500">Item Name *</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Compressor Valve" /></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-bold text-xs uppercase text-slate-500">Category</Label>
                <Select value={formData.categoryId || undefined} onValueChange={(v) => setFormData({...formData, categoryId: v})}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (<SelectItem key={cat.id} value={String(cat.id)}>{cat.category_name || cat.name || "Unnamed Category"}</SelectItem> ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-bold text-xs uppercase text-slate-500">Compressor Type</Label>
                <Select value={formData.compressorId || undefined} onValueChange={(v) => setFormData({...formData, compressorId: v})}>
                  <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                  <SelectContent>
                    {compressors.map((comp) => (<SelectItem key={comp.id} value={String(comp.id)}>{comp.compressor_type}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label className="font-bold text-xs uppercase text-slate-500">Vendor</Label><Input value={formData.vendor} onChange={(e) => setFormData({...formData, vendor: e.target.value})} placeholder="e.g. ABC Corp" /></div>
              <div>
                <Label className="font-bold text-xs uppercase text-slate-500">Workshop</Label>
                <Select value={formData.workshopId || undefined} onValueChange={(v) => setFormData({...formData, workshopId: v})}>
                  <SelectTrigger><SelectValue placeholder="Select Workshop" /></SelectTrigger>
                  <SelectContent>
                    {workshops.map((work) => (<SelectItem key={work.id} value={String(work.id)}>{work.workshop_name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 mt-2">
              <div><Label className="font-bold text-xs uppercase text-slate-500">Current Stock</Label><Input type="number" value={formData.currentStock} onChange={(e) => setFormData({...formData, currentStock: Number(e.target.value)})} /></div>
              <div><Label className="font-bold text-xs uppercase text-slate-500">Safety Level</Label><Input type="number" value={formData.safetyStock} onChange={(e) => setFormData({...formData, safetyStock: Number(e.target.value)})} /></div>
              <div><Label className="font-bold text-xs uppercase text-emerald-600 flex items-center gap-1"><IndianRupee className="w-3 h-3"/> Unit Price</Label><Input type="number" step="0.01" value={formData.unitPrice} onChange={(e) => setFormData({...formData, unitPrice: Number(e.target.value)})} /></div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveItem} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wide h-12">
                {formData.id ? "Save Changes" : "Add to Inventory"}
              </Button>
              {formData.id && (
                <Button variant="outline" onClick={() => handleDeleteItem(formData.id)} className="px-4 h-12 border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}