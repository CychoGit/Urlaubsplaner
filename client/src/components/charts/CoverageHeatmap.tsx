import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CoverageData {
  date: string;
  totalEmployees: number;
  onVacation: number;
  available: number;
  coveragePercentage: number;
  level: 'high' | 'medium' | 'low' | 'critical';
}

interface CoverageHeatmapProps {
  data: CoverageData[];
  isLoading?: boolean;
  title?: string;
  height?: number;
  weeks?: number; // Number of weeks to show
}

const getCoverageColor = (level: string, coveragePercentage: number) => {
  switch (level) {
    case 'high':
      return 'bg-green-500 hover:bg-green-600';
    case 'medium':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'low':
      return 'bg-orange-500 hover:bg-orange-600';
    case 'critical':
      return 'bg-red-500 hover:bg-red-600';
    default:
      return 'bg-gray-300 hover:bg-gray-400';
  }
};

const getCoverageIntensity = (coveragePercentage: number) => {
  if (coveragePercentage >= 80) return 'opacity-100';
  if (coveragePercentage >= 60) return 'opacity-80';
  if (coveragePercentage >= 40) return 'opacity-60';
  if (coveragePercentage >= 20) return 'opacity-40';
  return 'opacity-20';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', { 
    day: '2-digit', 
    month: '2-digit' 
  });
};

const getWeekday = (dateString: string) => {
  const date = new Date(dateString);
  const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  return weekdays[date.getDay()];
};

export default function CoverageHeatmap({ 
  data, 
  isLoading = false, 
  title = "Team Abdeckung Heatmap",
  height = 300,
  weeks = 8
}: CoverageHeatmapProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-green-500/20">Hoch</Badge>
              <Badge variant="outline" className="bg-yellow-500/20">Mittel</Badge>
              <Badge variant="outline" className="bg-red-500/20">Kritisch</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-72" />
        </CardContent>
      </Card>
    );
  }

  // Group data by weeks
  const groupedData: CoverageData[][] = [];
  let currentWeek: CoverageData[] = [];
  
  data.slice(0, weeks * 7).forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === data.length - 1) {
      groupedData.push([...currentWeek]);
      currentWeek = [];
    }
  });

  // Calculate statistics
  const avgCoverage = data.reduce((sum, day) => sum + day.coveragePercentage, 0) / data.length;
  const criticalDays = data.filter(day => day.level === 'critical').length;
  const highCoverageDays = data.filter(day => day.level === 'high').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-500/20">
              Hoch ({highCoverageDays})
            </Badge>
            <Badge variant="outline" className="bg-red-500/20">
              Kritisch ({criticalDays})
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend and Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Ø Abdeckung: {avgCoverage.toFixed(1)}%</span>
              <span>Kritische Tage: {criticalDays}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">Niedrig</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              </div>
              <span className="text-xs">Hoch</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
              <div>Mo</div>
              <div>Di</div>
              <div>Mi</div>
              <div>Do</div>
              <div>Fr</div>
              <div>Sa</div>
              <div>So</div>
            </div>

            {/* Week rows */}
            {groupedData.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2">
                {week.map((day, dayIndex) => {
                  const colorClass = getCoverageColor(day.level, day.coveragePercentage);
                  const intensityClass = getCoverageIntensity(day.coveragePercentage);
                  
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={cn(
                        "relative aspect-square rounded-md cursor-pointer transition-all duration-200",
                        colorClass,
                        intensityClass,
                        "group"
                      )}
                      title={`${formatDate(day.date)}: ${day.coveragePercentage.toFixed(1)}% Abdeckung (${day.available}/${day.totalEmployees} verfügbar)`}
                    >
                      {/* Date label */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white drop-shadow-sm">
                          {formatDate(day.date).split('.')[0]}
                        </span>
                      </div>
                      
                      {/* Hover tooltip */}
                      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                          {day.coveragePercentage.toFixed(1)}%
                        </div>
                      </div>
                      
                      {/* Weekend indicator */}
                      {(dayIndex === 5 || dayIndex === 6) && (
                        <div className="absolute top-0 right-0 w-2 h-2 bg-white/30 rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Coverage levels explanation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <div className="text-sm">
                <div className="font-medium">Hoch</div>
                <div className="text-xs text-muted-foreground">≥80% verfügbar</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <div className="text-sm">
                <div className="font-medium">Mittel</div>
                <div className="text-xs text-muted-foreground">60-79% verfügbar</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <div className="text-sm">
                <div className="font-medium">Niedrig</div>
                <div className="text-xs text-muted-foreground">40-59% verfügbar</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <div className="text-sm">
                <div className="font-medium">Kritisch</div>
                <div className="text-xs text-muted-foreground">&lt;40% verfügbar</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}