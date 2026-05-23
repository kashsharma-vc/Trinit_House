import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Grid3X3, List, Search, Download, Plus, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  safe: "status-safe",
  order: "status-warning",
  blocked: "status-danger",
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchInventory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/inventory/items/`);
        
        if (!response.ok) {
          throw new Error(`Server Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (isMounted) {
          // Safely extract the array, no matter how Django sends it
          const rawItems = Array.isArray(data) ? data : (data.results || []);

          const formattedData = rawItems.map((item: any) => ({
            id: item.id || Math.random(),
            name: item.name || "Unknown Item",
            category: item.category_name || "Uncategorized",
            compressor: item.compressor_type || "Universal",
            currentStock: item.current_stock || 0,
            safetyStock: item.safety_stock || 0,
            vendor: item.vendor || "Unknown Vendor",
            status: item.status || "safe",
          }));

          setInventoryItems(formattedData);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Fetch failed:", err);
          setError(err.message || "Failed to connect to the Django server.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchInventory();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <MainLayout>
        <div className="p-6 bg-red-50 border-2 border-red-500 rounded-xl mt-6">
          <h2 className="text-xl font-bold text-red-700 mb-2">Backend Connection Failed!</h2>
          <p className="text-red-600 font-medium">{error}</p>
          <p className="mt-4 text-sm text-red-800">
            Check if your Django server is running and API_BASE_URL is correct.
          </p>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="font-medium text-lg">Loading inventory data...</p>
        </div>
      </MainLayout>
    );
  }

  const filteredItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Track spare parts and safety stock levels</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, category, or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button variant={viewMode === "cards" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("cards")}>
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-5 shadow-soft-md border border-border"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold">{item.name}</h3>
                <span className={cn("status-badge text-xs", statusColors[item.status as keyof typeof statusColors])}>
                  {statusLabels[item.status as keyof typeof statusLabels] || item.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{item.category} • {item.compressor}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Stock:</span>
                  <span className={cn("font-medium", item.currentStock <= item.safetyStock ? "text-danger" : "")}>
                    {item.currentStock}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Safety Level:</span>
                  <span className="font-medium">{item.safetyStock}</span>
                </div>
              </div>
              
              <Button size="sm" variant="outline" className="w-full">
                View Details
              </Button>
            </motion.div>
          ))}
          {filteredItems.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">No items found.</p>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-soft-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4">Safety Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4 text-muted-foreground">{item.category}</td>
                    <td className={cn("p-4 font-medium", item.currentStock <= item.safetyStock ? "text-danger" : "")}>
                      {item.currentStock}
                    </td>
                    <td className="p-4">{item.safetyStock}</td>
                    <td className="p-4">
                      <span className={cn("status-badge", statusColors[item.status as keyof typeof statusColors])}>
                        {statusLabels[item.status as keyof typeof statusLabels] || item.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{item.vendor}</td>
                    <td className="p-4">
                      <Button size="icon" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </MainLayout>
  );
}