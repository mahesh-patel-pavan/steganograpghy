import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = [
  "hsl(0, 84.2%, 60.2%)",    // Red
  "hsl(33, 100%, 49%)",      // Orange  
  "hsl(45, 100%, 51%)",      // Yellow
  "hsl(120, 42%, 48%)",      // Green
  "hsl(207, 90%, 54%)",      // Blue
];

export function AttackDistribution() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center bg-gray-50 rounded border border-gray-200">
        <div className="text-center text-text-secondary">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm">Loading attack distribution...</p>
        </div>
      </div>
    );
  }

  const data = analyticsData?.attackDistribution || [
    { name: "JPEG Compression", value: 45, count: 124 },
    { name: "Gaussian Noise", value: 25, count: 69 },
    { name: "Cropping", value: 20, count: 55 },
    { name: "Rotation", value: 15, count: 41 },
    { name: "Scaling", value: 10, count: 28 },
  ];

  return (
    <div className="h-48">
      <h4 className="font-medium text-gray-900 mb-3">Attack Vector Distribution</h4>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value}% (${props.payload.count} attacks)`,
              props.payload.name
            ]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            fontSize={12}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
