import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface VacationUsageData {
  name: string;
  usedDays: number;
  totalDays: number;
  remainingDays: number;
  utilizationRate: number;
}

interface VacationUsageBarChartProps {
  data: VacationUsageData[];
  isLoading?: boolean;
  title?: string;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        <p className="text-blue-600">
          <span className="font-medium">Genutzt:</span> {data.usedDays} Tage
        </p>
        <p className="text-green-600">
          <span className="font-medium">Verbleibend:</span> {data.remainingDays} Tage
        </p>
        <p className="text-gray-600">
          <span className="font-medium">Gesamt:</span> {data.totalDays} Tage
        </p>
        <p className="text-purple-600">
          <span className="font-medium">Auslastung:</span> {data.utilizationRate.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export default function VacationUsageBarChart({ 
  data, 
  isLoading = false, 
  title = "Urlaubsnutzung nach Mitarbeiter",
  height = 400 
}: VacationUsageBarChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-80" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-muted-foreground text-xs"
              tick={{ fontSize: 12 }}
              angle={data.length > 5 ? -45 : 0}
              textAnchor={data.length > 5 ? "end" : "middle"}
              height={data.length > 5 ? 80 : 60}
            />
            <YAxis 
              className="text-muted-foreground text-xs"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="usedDays" 
              name="Genutzte Tage" 
              fill="#3b82f6" 
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="remainingDays" 
              name="Verbleibende Tage" 
              fill="#10b981" 
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}