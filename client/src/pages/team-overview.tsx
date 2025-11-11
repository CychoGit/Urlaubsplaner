import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AnimatedNavbar from "@/components/animated-navbar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { User, VacationRequestWithUser } from "@shared/schema";
import { formatDate } from "date-fns";
import { de } from "date-fns/locale";
import { CheckCircle, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function TeamOverview() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Record<string, 'admin' | 'employee'>>({});

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

  const { data: teamMembers, isLoading: teamLoading } = useQuery<User[]>({
    queryKey: ['/api/team'],
    enabled: isAuthenticated,
  });

  const { data: allRequests, isLoading: requestsLoading } = useQuery<VacationRequestWithUser[]>({
    queryKey: ['/api/vacation-requests'],
    enabled: isAuthenticated,
  });

  const getEmployeeStatus = (userId: string) => {
    if (!allRequests) return 'Verfügbar';
    
    const today = new Date();
    const activeVacation = allRequests.find(request => 
      request.userId === userId &&
      request.status === 'approved' &&
      new Date(request.startDate) <= today &&
      new Date(request.endDate) >= today
    );
    
    return activeVacation ? 'Im Urlaub' : 'Verfügbar';
  };

  const getStatusColor = (status: string) => {
    if (status === 'Im Urlaub') return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400';
    if (status === 'Ausstehend') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  const approveMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'employee' }) => {
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Benutzer genehmigt",
        description: "Der Benutzer wurde erfolgreich freigeschaltet.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Genehmigen des Benutzers.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Benutzer gelöscht",
        description: "Der Benutzer wurde erfolgreich entfernt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Löschen des Benutzers.",
        variant: "destructive",
      });
    },
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getUpcomingVacation = (userId: string) => {
    if (!allRequests) return null;
    
    const today = new Date();
    const upcoming = allRequests
      .filter(request => 
        request.userId === userId &&
        request.status === 'approved' &&
        new Date(request.startDate) > today
      )
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
    
    return upcoming;
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
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-team-title">
                Team Übersicht
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Aktueller Status und geplante Urlaubszeiten aller Teammitglieder
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-0">
          {teamLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : teamMembers && teamMembers.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member) => {
                const isPending = member.status === 'pending';
                const status = isPending ? 'Ausstehend' : getEmployeeStatus(member.id);
                const upcomingVacation = !isPending ? getUpcomingVacation(member.id) : null;
                const isAdmin = user?.role === 'admin' || user?.role === 'tenant_admin';
                
                return (
                  <Card key={member.id} data-testid={`card-member-${member.id}`}>
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={member.profileImageUrl ?? undefined} />
                          <AvatarFallback className={isPending ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white" : ""}>
                            {getInitials(member.firstName, member.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {member.firstName} {member.lastName}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <Badge className={getStatusColor(status)} data-testid={`status-${member.id}`}>
                          {status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {!isPending ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Rolle:</span>
                              <Badge variant="outline">
                                {member.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
                              </Badge>
                            </div>
                            {upcomingVacation && (
                              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                  Nächster Urlaub:
                                </p>
                                <p className="text-sm text-blue-700 dark:text-blue-400">
                                  {formatDate(new Date(upcomingVacation.startDate), 'dd.MM.yyyy', { locale: de })} - {' '}
                                  {formatDate(new Date(upcomingVacation.endDate), 'dd.MM.yyyy', { locale: de })}
                                </p>
                                {upcomingVacation.reason && (
                                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                                    {upcomingVacation.reason}
                                  </p>
                                )}
                              </div>
                            )}
                            {isAdmin && user?.id !== member.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    className="w-full mt-4"
                                    data-testid={`button-delete-${member.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Benutzer löschen
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Benutzer wirklich löschen?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Möchten Sie {member.firstName} {member.lastName} ({member.email}) wirklich löschen? 
                                      Diese Aktion kann nicht rückgängig gemacht werden.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate(member.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Löschen
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </>
                        ) : isAdmin ? (
                          <div className="space-y-3">
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                                Dieser Benutzer wartet auf Freigabe
                              </p>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Rolle zuweisen:</label>
                              <Select
                                value={selectedRole[member.id] || 'employee'}
                                onValueChange={(value) => 
                                  setSelectedRole({ ...selectedRole, [member.id]: value as 'admin' | 'employee' })
                                }
                              >
                                <SelectTrigger data-testid={`select-role-${member.id}`}>
                                  <SelectValue placeholder="Rolle wählen" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="employee">Mitarbeiter</SelectItem>
                                  <SelectItem value="admin">Administrator</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                onClick={() => approveMutation.mutate({ 
                                  userId: member.id, 
                                  role: selectedRole[member.id] || 'employee' 
                                })}
                                disabled={approveMutation.isPending}
                                className="w-full"
                                data-testid={`button-approve-${member.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Genehmigen
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    className="w-full"
                                    data-testid={`button-delete-pending-${member.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Ablehnen
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Antrag ablehnen?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Möchten Sie den Antrag von {member.firstName} {member.lastName} ({member.email}) wirklich ablehnen? 
                                      Der Benutzer wird gelöscht und kann sich erneut registrieren.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate(member.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Ablehnen
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-400">
                              Dieser Benutzer wartet auf Freigabe durch einen Administrator
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Keine Teammitglieder gefunden.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
