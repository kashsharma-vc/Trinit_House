import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
  } from "recharts";
  
  export function QCVerificationChart({ data }: { data: any[] }) {
    const chartData = [
      { name: "Week 1", verified: 20 },
      { name: "Week 2", verified: 35 },
      { name: "Week 3", verified: 28 },
      { name: "Week 4", verified: 42 },
    ];
  
    return (
      <div className="bg-card p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">
          QC Verification
        </h2>
  
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="verified"
              stroke="#f59e0b"
              fill="#f59e0b"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }