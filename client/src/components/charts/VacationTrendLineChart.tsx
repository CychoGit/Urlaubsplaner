import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface TrendData {
  period: string;
  requestCount: number;
  totalDays: number;
  approvalRate: number;
  averageProcessingTime: number;
}

interface VacationTrendLineChartProps {
  data: TrendData[];
  isLoading?: boolean;
  title?: string;
  height?: number;
  showApprovalRate?: boolean;
  showProcessingTime?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
        <p className="font-medium mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-blue-600">
            <span className="font-medium">Anträge:</span> {data.requestCount}
          </p>
          <p className="text-green-600">
            <span className="font-medium">Gesamt Tage:</span> {data.totalDays}
          </p>
          <p className="text-purple-600">
            <span className="font-medium">Genehmigungsrate:</span> {data.approvalRate.toFixed(1)}%
          </p>
          <p className="text-orange-600">
            <span className="font-medium">Bearbeitungszeit:</span> {data.averageProcessingTime.toFixed(1)}h
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function VacationTrendLineChart({ 
  data, 
  isLoading = false, 
  title = "Urlaubstrends über Zeit",
  height = 400,
  showApprovalRate = true,
  showProcessingTime = false
}: VacationTrendLineChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <div className="flex gap-2">
              <Badge variant="outline">Anträge</Badge>
              <Badge variant="outline">Tage</Badge>
              {showApprovalRate && <Badge variant="outline">Genehmigung</Badge>}
              {showProcessingTime && <Badge variant="outline">Bearbeitung</Badge>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-96" />
        </CardContent>
      </Card>
    );
  }

  // Calculate average lines for reference
  const avgRequests = data.reduce((sum, d) => sum + d.requestCount, 0) / data.length;
  const avgDays = data.reduce((sum, d) => sum + d.totalDays, 0) / data.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <div className="flex gap-2">
            <Badge variant="outline">Anträge</Badge>
            <Badge variant="outline">Tage</Badge>
            {showApprovalRate && <Badge variant="outline">Genehmigung</Badge>}
            {showProcessingTime && <Badge variant="outline">Bearbeitung</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
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
              dataKey="period" 
              className="text-muted-foreground text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-muted-foreground text-xs"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Reference lines for averages */}
            <ReferenceLine 
              y={avgRequests} 
              stroke="#3b82f6" 
              strokeDasharray="5 5" 
              strokeOpacity={0.5}
            />
            <ReferenceLine 
              y={avgDays} 
              stroke="#10b981" 
              strokeDasharray="5 5" 
              strokeOpacity={0.5}
            />
            
            <Line 
              type="monotone" 
              dataKey="requestCount" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Anträge"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="totalDays" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Tage"
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            
            {showApprovalRate && (
              <Line 
                type="monotone" 
                dataKey="approvalRate" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Genehmigungsrate (%)"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            
            {showProcessingTime && (
              <Line 
                type="monotone" 
                dataKey="averageProcessingTime" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Bearbeitungszeit (h)"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}