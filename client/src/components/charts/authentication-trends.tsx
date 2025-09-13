import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function AuthenticationTrends() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-gray-200">
        <div className="text-center text-text-secondary">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>Loading authentication trends...</p>
        </div>
      </div>
    );
  }

  const data = analyticsData?.authenticationTrends || [
    { date: "2024-01-01", authentications: 45, verifications: 120 },
    { date: "2024-01-02", authentications: 52, verifications: 145 },
    { date: "2024-01-03", authentications: 38, verifications: 98 },
    { date: "2024-01-04", authentications: 61, verifications: 167 },
    { date: "2024-01-05", authentications: 49, verifications: 134 },
    { date: "2024-01-06", authentications: 55, verifications: 156 },
    { date: "2024-01-07", authentications: 47, verifications: 142 },
  ];

  return (
    <div className="h-64">
      <h4 className="font-medium text-gray-900 mb-3">Authentication Trends (Last 7 Days)</h4>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#757575"
            fontSize={12}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis stroke="#757575" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <Line 
            type="monotone" 
            dataKey="authentications" 
            stroke="hsl(207, 90%, 54%)" 
            strokeWidth={2}
            dot={{ fill: "hsl(207, 90%, 54%)", strokeWidth: 2, r: 4 }}
            name="New Authentications"
          />
          <Line 
            type="monotone" 
            dataKey="verifications" 
            stroke="hsl(120, 42%, 48%)" 
            strokeWidth={2}
            dot={{ fill: "hsl(120, 42%, 48%)", strokeWidth: 2, r: 4 }}
            name="Verifications"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
