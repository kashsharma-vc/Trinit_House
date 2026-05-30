import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#6b7280"];

interface JobStatusChartProps {
  data: any[];
}

export function JobStatusChart({
  data,
}: JobStatusChartProps) {
  const statusCounts = data.reduce(
    (acc: any, curr: any) => {
      const status = curr.status || "Unknown";

      acc[status] = (acc[status] || 0) + 1;

      return acc;
    },
    {}
  );

  const chartData = Object.keys(statusCounts).map(
    (key) => ({
      name: key,
      value: statusCounts[key],
    })
  );

  return (
    <div className="bg-card rounded-xl border p-4">
      <h3 className="text-lg font-semibold mb-4">
        Job Status Chart
      </h3>

      <ResponsiveContainer
        width="100%"
        height={300}
      >
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {chartData.map(
              (_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    COLORS[
                      index %
                        COLORS.length
                    ]
                  }
                />
              )
            )}
          </Pie>

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}