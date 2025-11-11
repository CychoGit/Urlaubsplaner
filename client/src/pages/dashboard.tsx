import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import AnimatedNavbar from "@/components/animated-navbar";
import StatsCards from "@/components/stats-cards";
import Calendar from "@/components/calendar";
import PendingRequests from "@/components/pending-requests";
import TeamStatus from "@/components/team-status";
import VacationRequestForm from "@/components/vacation-request-form";
import VacationBalanceCard from "@/components/vacation-balance-card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Organization } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Force organization query ONLY when user is loaded
  const orgId = user?.organizationId;
  const { data: organization } = useQuery<Organization>({
    queryKey: ['/api/organizations', orgId],
    enabled: !!orgId,
    staleTime: 0,
  });

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

  const handleTeamCsvExport = async () => {
    try {
      const response = await fetch('/api/export', { credentials: 'include' });
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
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'team-urlaube.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export erfolgreich",
        description: "Alle Urlaubsdaten wurden als CSV-Datei heruntergeladen.",
      });
    } catch (error) {
      toast({
        title: "Export fehlgeschlagen",
        description: "Fehler beim Exportieren der Daten.",
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
        {/* Dashboard Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">Dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Übersicht über alle Urlaubsanträge und Termine
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              {user?.role !== "tenant_admin" && (
                <Button 
                  onClick={() => setShowRequestForm(true)}
                  data-testid="button-new-request"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Urlaub beantragen
                </Button>
              )}
              {user?.role === "admin" && (
                <Button 
                  variant="outline" 
                  onClick={handleTeamCsvExport}
                  data-testid="button-export-team-csv"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Team CSV Export
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 sm:px-0">
          <StatsCards />
        </div>

        {/* Calendar and Requests Grid */}
        <div className="mt-8 px-4 sm:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Calendar Section */}
            <div className="lg:col-span-2">
              <Calendar />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {organization?.vacationTrackingEnabled === true && user?.vacationTrackingEnabled === true && (
                <VacationBalanceCard />
              )}
              <PendingRequests />
              <TeamStatus />
            </div>
          </div>
        </div>
      </div>

      {/* New Request Modal */}
      {showRequestForm && (
        <VacationRequestForm 
          open={showRequestForm} 
          onClose={() => setShowRequestForm(false)} 
        />
      )}
    </div>
  );
}
