export function LaborHeatmap() {
    const workers = [
      { name: "Line A", usage: "85%" },
      { name: "Line B", usage: "62%" },
      { name: "Line C", usage: "91%" },
      { name: "Line D", usage: "74%" },
    ];
  
    return (
      <div className="bg-card p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">
          Labor Heatmap
        </h2>
  
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {workers.map((worker, index) => (
            <div
              key={index}
              className="bg-muted rounded-lg p-4 text-center"
            >
              <p className="font-medium">{worker.name}</p>
              <p className="text-2xl font-bold mt-2">
                {worker.usage}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }