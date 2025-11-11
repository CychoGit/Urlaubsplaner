import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  Users, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Shield,
  Star
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { ConflictAnalysis, CoverageSuggestion } from "@shared/schema";

interface ConflictAnalysisPanelProps {
  requestId: string;
  className?: string;
}

export default function ConflictAnalysisPanel({ requestId, className }: ConflictAnalysisPanelProps) {
  const { data: conflictAnalysis, isLoading } = useQuery<ConflictAnalysis>({
    queryKey: ['/api/vacation-requests', requestId, 'conflict-analysis'],
    queryFn: async () => {
      const response = await fetch(`/api/vacation-requests/${requestId}/conflict-analysis`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch conflict analysis');
      return response.json();
    },
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'limited':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'unavailable':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Konfliktanalyse wird geladen...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!conflictAnalysis) {
    return (
      <Card className={`border-green-200 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center text-green-700">
            <CheckCircle className="h-5 w-5 mr-2" />
            Keine Konflikte erkannt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Dieser Urlaubsantrag führt zu keinen Terminkonflikten mit anderen genehmigten Anträgen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="conflict-analysis-panel">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
            Konfliktanalyse
          </CardTitle>
          <Badge className={getSeverityColor(conflictAnalysis.severity)} data-testid={`badge-severity-${conflictAnalysis.severity}`}>
            {conflictAnalysis.severity === 'critical' && 'Kritisch'}
            {conflictAnalysis.severity === 'high' && 'Hoch'}
            {conflictAnalysis.severity === 'medium' && 'Mittel'}
            {conflictAnalysis.severity === 'low' && 'Niedrig'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        {/* Impact Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg" data-testid="metric-coverage-gap">
            <div className="text-2xl font-bold text-red-600">{conflictAnalysis.coverageGap}%</div>
            <div className="text-sm text-muted-foreground">Abdeckungslücke</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg" data-testid="metric-affected-users">
            <div className="text-2xl font-bold text-orange-600">{conflictAnalysis.affectedUsers.length}</div>
            <div className="text-sm text-muted-foreground">Betroffene Mitarbeiter</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg" data-testid="metric-conflict-days">
            <div className="text-2xl font-bold text-blue-600">{conflictAnalysis.conflictDays}</div>
            <div className="text-sm text-muted-foreground">Konflikttage</div>
          </div>
        </div>

        {/* Impact Details */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Auswirkungen
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-muted-foreground mb-2">Betroffene Abteilungen</div>
              <div className="flex flex-wrap gap-1">
                {conflictAnalysis.impactMetrics.departmentsAffected.length > 0 ? (
                  conflictAnalysis.impactMetrics.departmentsAffected.map((dept) => (
                    <Badge key={dept} variant="secondary" className="text-xs" data-testid={`dept-${dept}`}>
                      {dept}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">Keine</span>
                )}
              </div>
            </div>
            
            <div>
              <div className="font-medium text-muted-foreground mb-2">Kritische Rollen</div>
              <div className="flex flex-wrap gap-1">
                {conflictAnalysis.impactMetrics.criticalRolesAffected.length > 0 ? (
                  conflictAnalysis.impactMetrics.criticalRolesAffected.map((role) => (
                    <Badge key={role} variant="destructive" className="text-xs" data-testid={`role-${role}`}>
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">Keine</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Coverage Suggestions */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Abdeckungsvorschläge ({conflictAnalysis.suggestions.length})
          </h4>
          
          {conflictAnalysis.suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine Abdeckungsvorschläge verfügbar. Alle Teammitglieder sind möglicherweise bereits belegt oder unverfügbar.
            </p>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {conflictAnalysis.suggestions.map((suggestion) => (
                  <div
                    key={suggestion.userId}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    data-testid={`coverage-suggestion-${suggestion.userId}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(suggestion.userName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{suggestion.userName}</div>
                          <div className="text-xs text-muted-foreground">{suggestion.reason}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getAvailabilityIcon(suggestion.availability)}
                          <div className="text-right">
                            <div className={`text-sm font-medium ${getScoreColor(suggestion.score)}`}>
                              {suggestion.score}%
                            </div>
                            <div className="text-xs text-muted-foreground">Score</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Skill Match</div>
                          <Progress value={suggestion.skillMatch} className="h-1" />
                        </div>
                        <div>
                          <div className="text-muted-foreground">Arbeitsbelastung</div>
                          <Progress 
                            value={suggestion.workloadImpact} 
                            className="h-1"
                            // @ts-ignore
                            style={{ "--progress-background": suggestion.workloadImpact > 80 ? "#ef4444" : "#22c55e" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" data-testid="recommendations-panel">
          <h5 className="font-medium text-blue-900 mb-2 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Empfehlungen
          </h5>
          <ul className="text-sm text-blue-800 space-y-1">
            {conflictAnalysis.severity === 'critical' && (
              <li>• Erwägen Sie eine Ablehnung oder Verschiebung des Antrags</li>
            )}
            {conflictAnalysis.coverageGap > 50 && (
              <li>• Planen Sie erweiterte Arbeitszeiten oder Überstunden für das Team</li>
            )}
            {conflictAnalysis.suggestions.length > 0 && (
              <li>• Kontaktieren Sie die vorgeschlagenen Mitarbeiter für Abdeckung</li>
            )}
            <li>• Dokumentieren Sie die Abdeckungslösung in den Antragkommentaren</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}