import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar,
  Users,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Activity
} from "lucide-react";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import type { TeamCoverageAnalysis } from "@shared/schema";

interface TeamCoverageTimelineProps {
  startDate: string;
  endDate: string;
  className?: string;
}

export default function TeamCoverageTimeline({ 
  startDate, 
  endDate, 
  className 
}: TeamCoverageTimelineProps) {
  const { data: coverageAnalysis, isLoading } = useQuery<TeamCoverageAnalysis>({
    queryKey: ['/api/team-coverage-analysis', startDate, endDate],
    queryFn: async () => {
      const response = await fetch(
        `/api/team-coverage-analysis?startDate=${startDate}&endDate=${endDate}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch coverage analysis');
      return response.json();
    },
    enabled: Boolean(startDate && endDate),
  });

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getCoverageLevel = (percentage: number) => {
    if (percentage >= 80) return 'Gut';
    if (percentage >= 60) return 'Begrenzt';
    return 'Kritisch';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Team-Abdeckung wird geladen...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!coverageAnalysis) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Team-Abdeckungsanalyse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Keine Daten für den gewählten Zeitraum verfügbar.
          </p>
        </CardContent>
      </Card>
    );
  }

  const averageCoverage = coverageAnalysis.overallCoverage;
  const criticalDays = coverageAnalysis.dailyCoverage.filter(day => day.coveragePercentage < 70);
  const perfectDays = coverageAnalysis.dailyCoverage.filter(day => day.coveragePercentage === 100);

  return (
    <Card className={className} data-testid="team-coverage-timeline">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Team-Abdeckungsanalyse
          </CardTitle>
          <Badge className={getCoverageColor(averageCoverage)} data-testid="overall-coverage-badge">
            {averageCoverage}% Gesamtabdeckung
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg" data-testid="stat-average-coverage">
            <div className="text-2xl font-bold text-blue-600">{averageCoverage}%</div>
            <div className="text-sm text-muted-foreground">Durchschnittsabdeckung</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg" data-testid="stat-critical-days">
            <div className="text-2xl font-bold text-red-600">{criticalDays.length}</div>
            <div className="text-sm text-muted-foreground">Kritische Tage (&lt;70%)</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg" data-testid="stat-perfect-days">
            <div className="text-2xl font-bold text-green-600">{perfectDays.length}</div>
            <div className="text-sm text-muted-foreground">Vollständige Abdeckung</div>
          </div>
        </div>

        <Separator />

        {/* Daily Coverage Timeline */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Tägliche Abdeckung ({coverageAnalysis.dailyCoverage.length} Tage)
          </h4>
          
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {coverageAnalysis.dailyCoverage.map((day) => (
                <div
                  key={day.date}
                  className={`p-3 rounded-lg border ${getCoverageColor(day.coveragePercentage)}`}
                  data-testid={`daily-coverage-${day.date}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-sm">
                        {format(parseISO(day.date), 'EEEE, dd. MMMM', { locale: de })}
                      </div>
                      <div className="text-xs opacity-80">
                        {day.availableUsers} verfügbar, {day.onVacationUsers} im Urlaub
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{day.coveragePercentage}%</div>
                      <div className="text-xs opacity-80">{getCoverageLevel(day.coveragePercentage)}</div>
                    </div>
                  </div>
                  
                  <Progress 
                    value={day.coveragePercentage} 
                    className="h-2 mb-2" 
                    data-testid={`progress-${day.date}`}
                  />
                  
                  {day.gaps.length > 0 && (
                    <div className="flex items-center text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      <span>Lücken: {day.gaps.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Recommendations */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Empfehlungen
          </h4>
          
          <div className="space-y-2">
            {coverageAnalysis.recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                data-testid={`recommendation-${index}`}
              >
                <div className="text-blue-600 mt-0.5">
                  {averageCoverage < 70 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                </div>
                <div className="text-sm text-blue-800">{recommendation}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Period Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" data-testid="period-summary">
          <h5 className="font-medium text-gray-900 mb-2 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Zeitraum-Zusammenfassung
          </h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Zeitraum:</div>
              <div className="font-medium">
                {format(parseISO(startDate), 'dd.MM.yyyy', { locale: de })} - {format(parseISO(endDate), 'dd.MM.yyyy', { locale: de })}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Gesamttage:</div>
              <div className="font-medium">{coverageAnalysis.dailyCoverage.length}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}