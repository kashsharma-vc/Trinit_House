import { motion } from "framer-motion";
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
  Area,
  AreaChart,
} from "recharts";

// Sample data
const lineChartData = [
  { month: "Jan", requests: 120, closures: 95 },
  { month: "Feb", requests: 150, closures: 130 },
  { month: "Mar", requests: 180, closures: 160 },
  { month: "Apr", requests: 200, closures: 185 },
  { month: "May", requests: 170, closures: 165 },
  { month: "Jun", requests: 220, closures: 200 },
];

const barChartData = [
  { status: "Open", count: 45, fill: "hsl(var(--info))" },
  { status: "In Progress", count: 78, fill: "hsl(var(--warning))" },
  { status: "Closed", count: 156, fill: "hsl(var(--success))" },
];

const pieChartData = [
  { name: "Compliant", value: 75, color: "hsl(var(--success))" },
  { name: "Non-Compliant", value: 15, color: "hsl(var(--danger))" },
  { name: "Pending", value: 10, color: "hsl(var(--warning))" },
];

const donutData = [
  { name: "Verified", value: 68, color: "hsl(var(--success))" },
  { name: "Pending Review", value: 22, color: "hsl(var(--warning))" },
  { name: "Failed", value: 10, color: "hsl(var(--danger))" },
];

const heatmapData = [
  { day: "Mon", W1: 8, W2: 7, W3: 9, W4: 6, W5: 8 },
  { day: "Tue", W1: 7, W2: 8, W3: 6, W4: 9, W5: 7 },
  { day: "Wed", W1: 9, W2: 6, W3: 8, W4: 7, W5: 9 },
  { day: "Thu", W1: 6, W2: 9, W3: 7, W4: 8, W5: 6 },
  { day: "Fri", W1: 8, W2: 7, W3: 9, W4: 6, W5: 8 },
];

const chartVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function RequestsClosuresChart() {
  return (
    <motion.div
      variants={chartVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="chart-container"
    >
      <h3 className="text-lg font-semibold mb-4">Requests vs Closures</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={lineChartData}>
          <defs>
            <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorClosures" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="requests"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#colorRequests)"
          />
          <Area
            type="monotone"
            dataKey="closures"
            stroke="hsl(var(--success))"
            strokeWidth={2}
            fill="url(#colorClosures)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function JobStatusChart() {
  return (
    <motion.div
      variants={chartVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="chart-container"
    >
      <h3 className="text-lg font-semibold mb-4">Job Card Status</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={barChartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis dataKey="status" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {barChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function SOPComplianceChart() {
  return (
    <motion.div
      variants={chartVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="chart-container"
    >
      <h3 className="text-lg font-semibold mb-4">SOP Compliance</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieChartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {pieChartData.map((entry, index) => (
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
  );
}

export function QCVerificationChart() {
  return (
    <motion.div
      variants={chartVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="chart-container"
    >
      <h3 className="text-lg font-semibold mb-4">QC Verification Status</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={donutData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {donutData.map((entry, index) => (
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
  );
}

export function LaborHeatmap() {
  return (
    <motion.div
      variants={chartVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="chart-container col-span-2"
    >
      <h3 className="text-lg font-semibold mb-4">Labor Timer Utilization (Hours/Day)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={heatmapData}>
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
          <Bar dataKey="W1" name="Workshop 1" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
          <Bar dataKey="W2" name="Workshop 2" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
          <Bar dataKey="W3" name="Workshop 3" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
          <Bar dataKey="W4" name="Workshop 4" fill="hsl(var(--chart-4))" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
