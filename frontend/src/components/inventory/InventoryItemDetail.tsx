import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Package, AlertTriangle, User, FileText, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

interface ConsumptionLog {
  id: number;
  technician: string;
  jobCardId: string;
  unitsConsumed: number;
  date: string;
}

interface InventoryItemDetailProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRaisePO?: (item: InventoryItem) => void;
}

// Mock 7-day usage data
const generateUsageData = (itemId: number) => {
  const baseConsumption = [2, 4, 3, 5, 6, 4, 3];
  return [
    { day: "Day 1", usage: baseConsumption[0] + (itemId % 3) },
    { day: "Day 2", usage: baseConsumption[1] + (itemId % 2) },
    { day: "Day 3", usage: baseConsumption[2] + (itemId % 4) },
    { day: "Day 4", usage: baseConsumption[3] + (itemId % 2) },
    { day: "Day 5", usage: baseConsumption[4] + (itemId % 3) },
    { day: "Day 6", usage: baseConsumption[5] + (itemId % 2) },
    { day: "Day 7", usage: baseConsumption[6] + (itemId % 3) },
  ];
};

// Mock consumption logs
const consumptionLogs: Record<number, ConsumptionLog[]> = {
  1: [
    { id: 1, technician: "Amit Sharma", jobCardId: "JC-2024-0156", unitsConsumed: 2, date: "2024-01-15" },
    { id: 2, technician: "Rajesh Kumar", jobCardId: "JC-2024-0155", unitsConsumed: 1, date: "2024-01-14" },
    { id: 3, technician: "Sunil Verma", jobCardId: "JC-2024-0152", unitsConsumed: 3, date: "2024-01-12" },
  ],
  2: [
    { id: 1, technician: "Priya Singh", jobCardId: "JC-2024-0148", unitsConsumed: 1, date: "2024-01-15" },
    { id: 2, technician: "Amit Sharma", jobCardId: "JC-2024-0145", unitsConsumed: 2, date: "2024-01-13" },
  ],
  3: [
    { id: 1, technician: "Rajesh Kumar", jobCardId: "JC-2024-0160", unitsConsumed: 5, date: "2024-01-15" },
    { id: 2, technician: "Sunil Verma", jobCardId: "JC-2024-0158", unitsConsumed: 4, date: "2024-01-14" },
    { id: 3, technician: "Priya Singh", jobCardId: "JC-2024-0155", unitsConsumed: 3, date: "2024-01-12" },
  ],
  4: [
    { id: 1, technician: "Amit Sharma", jobCardId: "JC-2024-0162", unitsConsumed: 2, date: "2024-01-15" },
  ],
  5: [
    { id: 1, technician: "Rajesh Kumar", jobCardId: "JC-2024-0159", unitsConsumed: 2, date: "2024-01-15" },
    { id: 2, technician: "Sunil Verma", jobCardId: "JC-2024-0157", unitsConsumed: 2, date: "2024-01-14" },
  ],
  6: [
    { id: 1, technician: "Priya Singh", jobCardId: "JC-2024-0161", unitsConsumed: 8, date: "2024-01-15" },
    { id: 2, technician: "Amit Sharma", jobCardId: "JC-2024-0156", unitsConsumed: 7, date: "2024-01-13" },
  ],
};

export function InventoryItemDetail({ item, open, onOpenChange, onRaisePO }: InventoryItemDetailProps) {
  if (!item) return null;

  const usageData = generateUsageData(item.id);
  const logs = consumptionLogs[item.id] || [];
  const isCritical = item.daysToShortage <= 3;
  const avgConsumption = item.consumption;
  const itemCode = `INV-${String(item.id).padStart(3, "0")}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {item.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{itemCode}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Historical Usage Trend */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Historical Usage Trend (Last 7 Days)</h3>
            </div>
            <div className="bg-muted/30 rounded-xl p-4">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={usageData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`${value} units`, "Usage"]}
                  />
                  <Bar dataKey="usage" radius={[4, 4, 0, 0]}>
                    {usageData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === usageData.length - 1 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.6)"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                <span>7 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </motion.div>

          {/* Prediction Logic */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-4 shadow-soft-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Prediction Logic</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Stock</span>
                <span className="font-semibold">{item.currentStock} {item.category === "Consumable" ? "Kits" : "Sets"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Consumption Rate</span>
                <span className="font-semibold">{avgConsumption} / day</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Safety Stock</span>
                <span className="font-semibold">{item.safetyStock} {item.category === "Consumable" ? "Kits" : "Sets"}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Days to Shortage</span>
                <span className={cn(
                  "font-bold text-lg",
                  isCritical ? "text-danger" : "text-success"
                )}>
                  {item.daysToShortage} days
                </span>
              </div>
            </div>
          </motion.div>

          {/* Consumption Logs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Consumption Logs</h3>
            </div>
            <div className="space-y-2">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{log.technician}</p>
                        <p className="text-xs text-primary">{log.jobCardId}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">
                      -{log.unitsConsumed} unit{log.unitsConsumed > 1 ? "s" : ""}
                    </span>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No consumption logs available
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Raise PO Button */}
        <div className="p-5 pt-4 border-t border-border bg-muted/20">
          <Button 
            className="w-full h-12 text-base font-semibold gap-2"
            onClick={() => {
              onRaisePO?.(item);
              onOpenChange(false);
            }}
          >
            <ShoppingCart className="w-5 h-5" />
            Raise Purchase Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
