export const CustomTooltip = ({ active, payload, additional, label }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];

  if (additional) {
    // For bar charts with multiple bars, calculate percentage based on total for that date
    const present = payload.find((p: any) => p.dataKey === 'present')?.value || 0;
    const absent = payload.find((p: any) => p.dataKey === 'absent')?.value || 0;
    const total = present + absent;
    
    if (total === 0) {
      return (
        <div className="bg-white p-3 rounded-md shadow-md text-[12px] text-gray-700 border">
          <div className="font-semibold mb-1">{label}</div>
          <div>No attendance data</div>
        </div>
      );
    }
    
    let percent = ((item.value / total) * 100).toFixed(1);
    percent += '';
    
    return (
      <div className="bg-white p-3 rounded-md shadow-md text-[12px] text-gray-700 border">
        <div className="font-semibold mb-1">{label}</div>
        <div className="flex flex-col gap-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span>{entry.name}: {entry.value} ({((entry.value / total) * 100).toFixed(1)}%)</span>
            </div>
          ))}
          <div className="border-t pt-1 mt-1 font-medium">
            Total: {total} students
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 bg-white p-2 rounded-md shadow-md text-[12px] text-gray-700">
      <div className="font-semibold">{item.name}</div>
      <div>{item.value}</div>
    </div>
  );
};