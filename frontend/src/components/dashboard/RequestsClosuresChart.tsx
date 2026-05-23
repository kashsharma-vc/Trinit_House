import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
  } from "recharts";
  
  export function RequestsClosuresChart({ data }: { data: any[] }) {
    const chartData = [
      { name: "Open", value: data.filter((d) => d.status === "Open").length },
      { name: "Closed", value: data.filter((d) => d.status === "Closed").length },
      {
        name: "In Progress",
        value: data.filter((d) => d.status === "In Progress").length,
      },
    ];
  
    return (
      <div className="bg-card p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">
          Request Closures
        </h2>
  
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }