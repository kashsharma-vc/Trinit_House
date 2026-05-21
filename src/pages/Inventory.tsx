import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShoppingCart,
  BarChart3,
  Grid3X3,
  List,
  Search,
  Filter,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddInventoryItem } from "@/components/inventory/AddInventoryItem";
import { InventoryItemDetail } from "@/components/inventory/InventoryItemDetail";
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

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  compressor: string;
  currentStock: number;
  safetyStock: number;
  consumption: number;
  daysToShortage: number;
  status: string;
  vendor: string;
}

// KPI Data
const inventoryKPIs = [
  { title: "Total Items", value: "1,248", icon: Package, variant: "default" as const },
  { title: "Work Blocked", value: "8", icon: AlertTriangle, variant: "danger" as const },
  { title: "Order Now", value: "23", icon: ShoppingCart, variant: "warning" as const },
  { title: "Safe Stock", value: "1,217", icon: CheckCircle, variant: "success" as const },
  { title: "PO Pending", value: "15", icon: Clock, variant: "info" as const },
  { title: "Vendor SLA Breach", value: "3", icon: AlertTriangle, variant: "danger" as const },
];

// Inventory items
const inventoryItems = [
  {
    id: 1,
    name: "Piston Ring Set",
    category: "Spare",
    compressor: "ELGi W-Type",
    currentStock: 12,
    safetyStock: 25,
    consumption: 8,
    daysToShortage: 2,
    status: "blocked",
    vendor: "ABC Spares",
  },
  {
    id: 2,
    name: "Valve Plate Assembly",
    category: "Spare",
    compressor: "ELGi 15HP",
    currentStock: 18,
    safetyStock: 10,
    consumption: 3,
    daysToShortage: 6,
    status: "order",
    vendor: "XYZ Parts",
  },
  {
    id: 3,
    name: "Oil Filter",
    category: "Consumable",
    compressor: "All Types",
    currentStock: 85,
    safetyStock: 50,
    consumption: 12,
    daysToShortage: 15,
    status: "safe",
    vendor: "Filter Pro",
  },
  {
    id: 4,
    name: "Gasket Kit",
    category: "Spare",
    compressor: "Reciprocating",
    currentStock: 45,
    safetyStock: 30,
    consumption: 5,
    daysToShortage: 9,
    status: "safe",
    vendor: "Seal Master",
  },
  {
    id: 5,
    name: "Bearing Assembly",
    category: "Spare",
    compressor: "Screw Type",
    currentStock: 8,
    safetyStock: 15,
    consumption: 4,
    daysToShortage: 2,
    status: "blocked",
    vendor: "Bearing Hub",
  },
  {
    id: 6,
    name: "Lubricant Oil (20L)",
    category: "Consumable",
    compressor: "All Types",
    currentStock: 120,
    safetyStock: 80,
    consumption: 15,
    daysToShortage: 8,
    status: "safe",
    vendor: "Castrol India",
  },
];

// Chart data
const stockTrendData = [
  { day: "Mon", stock: 150, consumption: 25 },
  { day: "Tue", stock: 125, consumption: 30 },
  { day: "Wed", stock: 95, consumption: 35 },
  { day: "Thu", stock: 180, consumption: 20 },
  { day: "Fri", stock: 155, consumption: 28 },
  { day: "Sat", stock: 127, consumption: 22 },
  { day: "Sun", stock: 105, consumption: 15 },
];

const categoryHealthData = [
  { category: "Spare", safe: 85, order: 12, blocked: 3 },
  { category: "Consumable", safe: 92, order: 6, blocked: 2 },
  { category: "Tool", safe: 45, order: 3, blocked: 0 },
  { category: "Asset", safe: 28, order: 2, blocked: 0 },
];

const poStatusData = [
  { name: "Draft", value: 5, color: "hsl(var(--muted-foreground))" },
  { name: "Finalized", value: 8, color: "hsl(var(--info))" },
  { name: "Delivered", value: 42, color: "hsl(var(--success))" },
  { name: "Cancelled", value: 2, color: "hsl(var(--danger))" },
];

const statusColors = {
  safe: "status-safe",
  order: "status-warning",
  blocked: "status-danger",
};

const statusLabels = {
  safe: "Safe",
  order: "Order Now",
  blocked: "Work Blocked",
};

export default function Inventory() {
  const [viewMode, setViewMode] = useState<"cards" | "grid">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleRaisePO = (item: InventoryItem) => {
    // TODO: Navigate to PO creation with item pre-filled
    console.log("Raise PO for:", item.name);
  };

  const filteredItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Predictive spares and stock management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="gap-2" onClick={() => setIsAddItemOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Add Inventory Item Drawer */}
      <AddInventoryItem open={isAddItemOpen} onOpenChange={setIsAddItemOpen} />

      {/* Inventory Item Detail Modal */}
      <InventoryItemDetail 
        item={selectedItem} 
        open={isDetailOpen} 
        onOpenChange={setIsDetailOpen}
        onRaisePO={handleRaisePO}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {inventoryKPIs.map((kpi, index) => (
          <KPICard key={kpi.title} {...kpi} index={index} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Stock vs Consumption Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="chart-container lg:col-span-2"
        >
          <h3 className="text-lg font-semibold mb-4">Stock vs Consumption (7-day trend)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stockTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="stock"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
              <Line
                type="monotone"
                dataKey="consumption"
                stroke="hsl(var(--danger))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--danger))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* PO Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="chart-container"
        >
          <h3 className="text-lg font-semibold mb-4">PO Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={poStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {poStatusData.map((entry, index) => (
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

      {/* Filters & View Toggle */}
      <div className="filter-bar mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search items, vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="spare">Spare</SelectItem>
            <SelectItem value="consumable">Consumable</SelectItem>
            <SelectItem value="tool">Tool</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="safe">Safe</SelectItem>
            <SelectItem value="order">Order Now</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
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

      {/* Inventory Items */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              onClick={() => handleItemClick(item)}
              className="bg-card rounded-xl p-5 shadow-soft-md border border-border hover:shadow-soft-lg transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">{item.category} • {item.compressor}</p>
                </div>
                <span className={cn("status-badge", statusColors[item.status as keyof typeof statusColors])}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {statusLabels[item.status as keyof typeof statusLabels]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Current Stock</p>
                  <p className="text-lg font-bold">{item.currentStock}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Safety Stock</p>
                  <p className="text-lg font-bold">{item.safetyStock}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className={cn(
                    item.daysToShortage <= 3 ? "text-danger font-medium" : "text-muted-foreground"
                  )}>
                    {item.daysToShortage} days to shortage
                  </span>
                </div>
                {item.status !== "safe" && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(item);
                    }}
                  >
                    Raise PO
                  </Button>
                )}
              </div>
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
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Compressor</th>
                  <th>Current Stock</th>
                  <th>Safety Stock</th>
                  <th>Stock Level</th>
                  <th>Days to Shortage</th>
                  <th>Status</th>
                  <th>Vendor</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleItemClick(item)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <td className="font-medium">{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.compressor}</td>
                    <td>{item.currentStock}</td>
                    <td>{item.safetyStock}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              item.status === "safe" ? "bg-success" :
                              item.status === "order" ? "bg-warning" : "bg-danger"
                            )}
                            style={{ width: `${Math.min((item.currentStock / item.safetyStock) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm">{Math.round((item.currentStock / item.safetyStock) * 100)}%</span>
                      </div>
                    </td>
                    <td className={cn(
                      item.daysToShortage <= 3 ? "text-danger font-medium" : ""
                    )}>
                      {item.daysToShortage} days
                    </td>
                    <td>
                      <span className={cn("status-badge", statusColors[item.status as keyof typeof statusColors])}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {statusLabels[item.status as keyof typeof statusLabels]}
                      </span>
                    </td>
                    <td>{item.vendor}</td>
                    <td>
                      {item.status !== "safe" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(item);
                          }}
                        >
                          Raise PO
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </MainLayout>
  );
}
