import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AnimatedNavbar from "@/components/animated-navbar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "date-fns";
import { de } from "date-fns/locale";
import type { VacationRequestWithUser } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Calendar, Trash2, X, Download } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Requests() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<VacationRequestWithUser | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: requests, isLoading: requestsLoading } = useQuery<VacationRequestWithUser[]>({
    queryKey: ['/api/vacation-requests'],
    enabled: isAuthenticated,
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest('DELETE', `/api/vacation-requests/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
      toast({
        title: "Erfolgreich",
        description: "Urlaubsantrag wurde gelöscht",
      });
      setDeleteDialogOpen(false);
      setRequestToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Löschen des Antrags",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (request: VacationRequestWithUser) => {
    setRequestToDelete(request);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (requestToDelete) {
      deleteRequestMutation.mutate(requestToDelete.id);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'approved':
        return 'Genehmigt';
      case 'rejected':
        return 'Abgelehnt';
      case 'pending':
        return 'Wartend';
      default:
        return status || 'Unbekannt';
    }
  };

  const handleExportSingleRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/vacation-requests/${requestId}/export/ical`, { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
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
        if (response.status === 400) {
          toast({
            title: "Export nicht möglich",
            description: "Nur genehmigte Urlaubsanträge können exportiert werden.",
            variant: "destructive",
          });
          return;
        }
        throw new Error('iCal export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `urlaub-${requestId}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export erfolgreich",
        description: "Urlaubstermin wurde als iCal-Datei heruntergeladen.",
      });
    } catch (error) {
      toast({
        title: "Export fehlgeschlagen",
        description: "Fehler beim Exportieren des Urlaubstermins.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <AnimatedNavbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-requests-title">
                Meine Anträge
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Übersicht über alle Ihre Urlaubsanträge
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-0">
          {requestsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {requests.map((request) => (
                <Card key={request.id} data-testid={`card-request-${request.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {formatDate(new Date(request.startDate), 'dd.MM.yyyy', { locale: de })} - {' '}
                        {formatDate(new Date(request.endDate), 'dd.MM.yyyy', { locale: de })}
                      </CardTitle>
                      <Badge className={getStatusColor(request.status)} data-testid={`status-${request.id}`}>
                        {getStatusLabel(request.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {request.reason && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Grund:</strong> {request.reason}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          <strong>Erstellt am:</strong> {' '}
                          {request.createdAt ? formatDate(new Date(request.createdAt), 'dd.MM.yyyy HH:mm', { locale: de }) : 'N/A'}
                        </p>
                        {request.reviewedAt && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Bearbeitet am:</strong> {' '}
                            {request.reviewedAt ? formatDate(new Date(request.reviewedAt), 'dd.MM.yyyy HH:mm', { locale: de }) : 'N/A'}
                          </p>
                        )}
                      </div>
                      
                      {/* Export and Delete buttons */}
                      {(request.status === 'pending' || request.status === 'approved') && (
                        <div className="pt-2 border-t space-y-2">
                          {/* iCal Export button for approved requests only */}
                          {request.status === 'approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExportSingleRequest(request.id)}
                              data-testid={`button-export-ical-${request.id}`}
                              className="w-full"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              In Kalender importieren
                            </Button>
                          )}
                          
                          {/* Delete button */}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(request)}
                            data-testid={`button-delete-${request.id}`}
                            className="w-full"
                          >
                            {request.status === 'pending' ? (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Antrag abbrechen
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Antrag löschen
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Sie haben noch keine Urlaubsanträge gestellt.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {requestToDelete?.status === 'pending' ? 'Antrag abbrechen?' : 'Antrag löschen?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {requestToDelete?.status === 'pending' ? (
                <>
                  Möchten Sie diesen wartenden Urlaubsantrag wirklich abbrechen?
                  <br />
                  <strong>
                    {requestToDelete && formatDate(new Date(requestToDelete.startDate), 'dd.MM.yyyy', { locale: de })} - {' '}
                    {requestToDelete && formatDate(new Date(requestToDelete.endDate), 'dd.MM.yyyy', { locale: de })}
                  </strong>
                </>
              ) : (
                <>
                  Möchten Sie diesen genehmigten Urlaubsantrag wirklich löschen? Die Urlaubstage werden Ihrem Konto wieder gutgeschrieben.
                  <br />
                  <strong>
                    {requestToDelete && formatDate(new Date(requestToDelete.startDate), 'dd.MM.yyyy', { locale: de })} - {' '}
                    {requestToDelete && formatDate(new Date(requestToDelete.endDate), 'dd.MM.yyyy', { locale: de })}
                  </strong>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {requestToDelete?.status === 'pending' ? 'Abbrechen' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
