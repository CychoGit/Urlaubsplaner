import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Check, X, AlertTriangle, ChevronDown, ChevronRight, Eye, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import type { VacationRequestWithUser } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import ConflictAnalysisPanel from "./conflict-analysis-panel";
import TeamCoverageTimeline from "./team-coverage-timeline";

export default function PendingRequests() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const { data: pendingRequests, isLoading } = useQuery<VacationRequestWithUser[]>({
    queryKey: ['/api/vacation-requests/pending'],
    enabled: user?.role === 'admin' || user?.role === 'tenant_admin',
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      await apiRequest('PATCH', `/api/vacation-requests/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-requests/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
      toast({
        title: "Status aktualisiert",
        description: "Der Antragsstatus wurde erfolgreich geändert.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const checkForConflicts = (request: VacationRequestWithUser) => {
    if (!pendingRequests) return false;
    
    return pendingRequests.some(other => 
      other.id !== request.id &&
      other.userId !== request.userId &&
      new Date(other.startDate) <= new Date(request.endDate) &&
      new Date(other.endDate) >= new Date(request.startDate)
    );
  };

  const toggleRequestExpansion = (requestId: string) => {
    setExpandedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  const getConflictSeverity = (request: VacationRequestWithUser) => {
    if (!pendingRequests) return 'low';
    
    const conflicts = pendingRequests.filter(other => 
      other.id !== request.id &&
      other.userId !== request.userId &&
      new Date(other.startDate) <= new Date(request.endDate) &&
      new Date(other.endDate) >= new Date(request.startDate)
    );

    if (conflicts.length >= 3) return 'critical';
    if (conflicts.length === 2) return 'high';
    if (conflicts.length === 1) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Don't render for non-admins and non-tenant-admins
  if (user?.role !== 'admin' && user?.role !== 'tenant_admin') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Genehmigungsworkflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>Genehmigungsworkflow</CardTitle>
        <p className="text-sm text-muted-foreground">Anträge zur Bearbeitung</p>
      </CardHeader>
      <CardContent className="p-0">
        {pendingRequests && pendingRequests.length > 0 ? (
          <div className="divide-y divide-border">
            {pendingRequests.map((request) => {
              const hasConflict = checkForConflicts(request);
              const severity = getConflictSeverity(request);
              const isExpanded = expandedRequests.has(request.id);
              const conflictingRequest = hasConflict 
                ? pendingRequests.find(other => 
                    other.id !== request.id &&
                    other.userId !== request.userId &&
                    new Date(other.startDate) <= new Date(request.endDate) &&
                    new Date(other.endDate) >= new Date(request.startDate)
                  )
                : null;

              const displayName = request.user 
                ? `${request.user.firstName} ${request.user.lastName}`
                : 'Gelöschter Benutzer';

              return (
                <div 
                  key={request.id} 
                  className={`px-4 py-4 hover:bg-secondary/50 ${hasConflict ? 'border-l-4 border-l-orange-400' : ''}`}
                  data-testid={`pending-request-${request.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.user?.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {getInitials(request.user?.firstName, request.user?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(request.startDate), 'dd.', { locale: de })}-
                          {format(new Date(request.endDate), 'dd. MMM yyyy', { locale: de })}
                        </p>
                        {request.reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {request.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasConflict && (
                        <Badge className={getSeverityColor(severity)} data-testid={`conflict-badge-${request.id}`}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Konflikt
                        </Badge>
                      )}
                      <Badge className="bg-amber-100 text-amber-800">
                        Wartend
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-700 border-green-200 hover:bg-green-50"
                      onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'approved' })}
                      disabled={updateStatusMutation.isPending}
                      data-testid={`button-approve-${request.id}`}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Genehmigen
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 border-red-200 hover:bg-red-50"
                      onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'rejected' })}
                      disabled={updateStatusMutation.isPending}
                      data-testid={`button-reject-${request.id}`}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Ablehnen
                    </Button>

                    {/* Enhanced Analysis Buttons */}
                    {hasConflict && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-700 border-blue-200 hover:bg-blue-50"
                        onClick={() => toggleRequestExpansion(request.id)}
                        data-testid={`button-analyze-${request.id}`}
                      >
                        {isExpanded ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                        Analyse
                      </Button>
                    )}

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-purple-700 border-purple-200 hover:bg-purple-50"
                          data-testid={`button-coverage-${request.id}`}
                        >
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Team-Abdeckung
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Team-Abdeckungsanalyse - {displayName}
                          </DialogTitle>
                        </DialogHeader>
                        <TeamCoverageTimeline 
                          startDate={request.startDate}
                          endDate={request.endDate}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Basic Conflict Info */}
                  {hasConflict && conflictingRequest && !isExpanded && (
                    <div className="mt-2 text-xs text-orange-600 flex items-center bg-orange-50 px-2 py-1 rounded">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Konflikt mit {conflictingRequest.user ? `${conflictingRequest.user.firstName} ${conflictingRequest.user.lastName}` : 'Gelöschter Benutzer'} - 
                      Klicken Sie auf "Analyse" für Details
                    </div>
                  )}

                  {/* Detailed Conflict Analysis Panel */}
                  <Collapsible open={isExpanded}>
                    <CollapsibleContent className="mt-3">
                      {hasConflict && (
                        <ConflictAnalysisPanel 
                          requestId={request.id}
                          className="border-t border-border pt-3"
                        />
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Alle Anträge bearbeitet ✓
          </div>
        )}
        {pendingRequests && pendingRequests.length > 0 && (
          <div className="px-4 py-3 border-t border-border">
            <Button variant="ghost" className="w-full text-center text-sm text-primary hover:text-primary/80">
              Alle Anträge anzeigen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
