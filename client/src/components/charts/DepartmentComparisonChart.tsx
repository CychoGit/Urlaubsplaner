import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface DepartmentData {
  department: string;
  totalEmployees: number;
  totalRequests: number;
  approvedRequests: number;
  totalDays: number;
  averageDaysPerEmployee: number;
  utilizationRate: number;
  approvalRate: number;
  averageProcessingTime: number;
}

interface DepartmentComparisonChartProps {
  data: DepartmentData[];
  isLoading?: boolean;
  title?: string;
  height?: number;
  metric?: 'utilization' | 'requests' | 'days' | 'approval';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
        <p className="font-medium mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Mitarbeiter:</span> {data.totalEmployees}</p>
          <p><span className="font-medium">Anträge:</span> {data.totalRequests}</p>
          <p><span className="font-medium">Genehmigte:</span> {data.approvedRequests}</p>
          <p><span className="font-medium">Gesamt Tage:</span> {data.totalDays}</p>
          <p><span className="font-medium">Ø Tage/MA:</span> {data.averageDaysPerEmployee.toFixed(1)}</p>
          <p><span className="font-medium">Auslastung:</span> {data.utilizationRate.toFixed(1)}%</p>
          <p><span className="font-medium">Genehmigungsrate:</span> {data.approvalRate.toFixed(1)}%</p>
          <p><span className="font-medium">Bearbeitungszeit:</span> {data.averageProcessingTime.toFixed(1)}h</p>
        </div>
      </div>
    );
  }
  return null;
};

const getMetricConfig = (metric: string) => {
  switch (metric) {
    case 'utilization':
      return {
        dataKey: 'utilizationRate',
        name: 'Auslastung (%)',
        color: '#8b5cf6',
        format: (value: number) => `${value.toFixed(1)}%`
      };
    case 'requests':
      return {
        dataKey: 'totalRequests',
        name: 'Anträge',
        color: '#3b82f6',
        format: (value: number) => value.toString()
      };
    case 'days':
      return {
        dataKey: 'averageDaysPerEmployee',
        name: 'Ø Tage/MA',
        color: '#10b981',
        format: (value: number) => value.toFixed(1)
      };
    case 'approval':
      return {
        dataKey: 'approvalRate',
        name: 'Genehmigungsrate (%)',
        color: '#f59e0b',
        format: (value: number) => `${value.toFixed(1)}%`
      };
    default:
      return {
        dataKey: 'utilizationRate',
        name: 'Auslastung (%)',
        color: '#8b5cf6',
        format: (value: number) => `${value.toFixed(1)}%`
      };
  }
};

export default function DepartmentComparisonChart({ 
  data, 
  isLoading = false, 
  title = "Abteilungsvergleich",
  height = 400,
  metric = 'utilization'
}: DepartmentComparisonChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <Badge variant="outline">Wird geladen...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-96" />
        </CardContent>
      </Card>
    );
  }

  const metricConfig = getMetricConfig(metric);

  // Sort data by the selected metric for better visualization
  const sortedData = [...data].sort((a, b) => {
    const aValue = a[metricConfig.dataKey as keyof DepartmentData] as number;
    const bValue = b[metricConfig.dataKey as keyof DepartmentData] as number;
    return bValue - aValue;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="outline">{metricConfig.name}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={sortedData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="department" 
              className="text-muted-foreground text-xs"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              className="text-muted-foreground text-xs"
              tick={{ fontSize: 12 }}
              tickFormatter={metricConfig.format}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey={metricConfig.dataKey}
              name={metricConfig.name}
              fill={metricConfig.color}
              radius={[4, 4, 0, 0]}
            >
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}