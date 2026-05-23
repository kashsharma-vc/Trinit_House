import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
  } from "recharts";
  
  export function SOPComplianceChart({ data }: { data: any[] }) {
    const chartData = [
      { day: "Mon", compliance: 92 },
      { day: "Tue", compliance: 95 },
      { day: "Wed", compliance: 91 },
      { day: "Thu", compliance: 97 },
      { day: "Fri", compliance: 94 },
    ];
  
    return (
      <div className="bg-card p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">
          SOP Compliance
        </h2>
  
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="compliance" stroke="#10b981" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }