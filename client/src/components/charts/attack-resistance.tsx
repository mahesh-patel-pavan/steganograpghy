import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function AttackResistance() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center bg-gray-50 rounded border border-gray-200">
        <div className="text-center text-text-secondary">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm">Loading attack resistance data...</p>
        </div>
      </div>
    );
  }

  const data = analyticsData?.attackResistance || [
    { attackType: "JPEG Compression", successRate: 15, resistanceRate: 85 },
    { attackType: "Gaussian Noise", successRate: 25, resistanceRate: 75 },
    { attackType: "Cropping", successRate: 35, resistanceRate: 65 },
    { attackType: "Rotation", successRate: 45, resistanceRate: 55 },
    { attackType: "Scaling", successRate: 30, resistanceRate: 70 },
  ];

  return (
    <div className="h-48">
      <h4 className="font-medium text-gray-900 mb-3">Attack Resistance Analysis</h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="attackType" 
            stroke="#757575"
            fontSize={10}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke="#757575" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            formatter={(value: number, name: string) => [
              `${value}%`,
              name === 'resistanceRate' ? 'Resistance Rate' : 'Attack Success Rate'
            ]}
          />
          <Bar 
            dataKey="resistanceRate" 
            fill="hsl(120, 42%, 48%)" 
            radius={[4, 4, 0, 0]}
            name="Resistance Rate"
          />
          <Bar 
            dataKey="successRate" 
            fill="hsl(0, 84.2%, 60.2%)" 
            radius={[4, 4, 0, 0]}
            name="Attack Success Rate"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
