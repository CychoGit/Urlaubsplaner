import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import AnimatedNavbar from "@/components/animated-navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays, BarChart3, Users, TrendingUp, Download, Filter, Calendar, Clock, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfYear, endOfYear } from "date-fns";

// Import chart components
import VacationUsageBarChart from "@/components/charts/VacationUsageBarChart";
import BalancePieChart from "@/components/charts/BalancePieChart";
import VacationTrendLineChart from "@/components/charts/VacationTrendLineChart";
import DepartmentComparisonChart from "@/components/charts/DepartmentComparisonChart";
import CoverageHeatmap from "@/components/charts/CoverageHeatmap";

// Import filter components
import DateRangeFilter from "@/components/filters/DateRangeFilter";
import DepartmentFilter from "@/components/filters/DepartmentFilter";
import EmployeeFilter from "@/components/filters/EmployeeFilter";

// Import export utilities
import { exportAnalyticsData } from "@/utils/exportUtils";

interface DateRange {
  startDate: string;
  endDate: string;
}

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Filter states
  const currentYear = new Date().getFullYear();
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: format(startOfYear(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfYear(new Date()), 'yyyy-MM-dd')
  });
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

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

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== "admin") {
      toast({
        title: "Zugriff verweigert",
        description: "Sie benötigen Admin-Berechtigung für die Analytics.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Analytics API queries
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/analytics/overview', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      const res = await fetch(`/api/analytics/overview?${params}`);
      if (!res.ok) throw new Error('Failed to fetch overview data');
      return res.json();
    },
    enabled: isAuthenticated && user?.role === "admin"
  });

  const { data: teamUsageData, isLoading: teamUsageLoading } = useQuery({
    queryKey: ['/api/analytics/team-usage', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      const res = await fetch(`/api/analytics/team-usage?${params}`);
      if (!res.ok) throw new Error('Failed to fetch team usage data');
      return res.json();
    },
    enabled: isAuthenticated && user?.role === "admin"
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['/api/analytics/trends', { period: 'monthly' }],
    queryFn: async () => {
      const params = new URLSearchParams({ period: 'monthly' });
      const res = await fetch(`/api/analytics/trends?${params}`);
      if (!res.ok) throw new Error('Failed to fetch trends data');
      return res.json();
    },
    enabled: isAuthenticated && user?.role === "admin"
  });

  const { data: departmentData, isLoading: departmentLoading } = useQuery({
    queryKey: ['/api/analytics/department-comparison', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      const res = await fetch(`/api/analytics/department-comparison?${params}`);
      if (!res.ok) throw new Error('Failed to fetch department data');
      return res.json();
    },
    enabled: isAuthenticated && user?.role === "admin"
  });

  const { data: utilizationData, isLoading: utilizationLoading } = useQuery({
    queryKey: ['/api/analytics/utilization', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      const res = await fetch(`/api/analytics/utilization?${params}`);
      if (!res.ok) throw new Error('Failed to fetch utilization data');
      return res.json();
    },
    enabled: isAuthenticated && user?.role === "admin"
  });

  // Transform data for charts
  const transformUsageData = () => {
    if (!teamUsageData?.usageByEmployee) return [];
    return teamUsageData.usageByEmployee.map((emp: any) => ({
      name: emp.name.length > 15 ? emp.name.substring(0, 15) + '...' : emp.name,
      usedDays: emp.usedDays,
      totalDays: emp.totalDays,
      remainingDays: emp.remainingDays,
      utilizationRate: emp.utilizationRate
    }));
  };

  const transformBalanceData = () => {
    if (!overviewData) return [];
    
    const used = overviewData.totalVacationDays || 0;
    const total = overviewData.totalEmployees * 25; // Assuming 25 days average
    const remaining = total - used;
    
    return [
      {
        name: "Genutzte Tage",
        value: used,
        color: "#3b82f6",
        percentage: total > 0 ? (used / total) * 100 : 0
      },
      {
        name: "Verbleibende Tage", 
        value: remaining,
        color: "#10b981",
        percentage: total > 0 ? (remaining / total) * 100 : 0
      }
    ];
  };

  const transformCoverageData = () => {
    if (!utilizationData?.byMonth) return [];
    
    // Generate sample coverage data for demonstration
    const days = [];
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const totalEmployees = overviewData?.totalEmployees || 10;
      const randomOnVacation = Math.floor(Math.random() * (totalEmployees * 0.3));
      const available = totalEmployees - randomOnVacation;
      const coveragePercentage = (available / totalEmployees) * 100;
      
      let level: 'high' | 'medium' | 'low' | 'critical';
      if (coveragePercentage >= 80) level = 'high';
      else if (coveragePercentage >= 60) level = 'medium';
      else if (coveragePercentage >= 40) level = 'low';
      else level = 'critical';
      
      days.push({
        date: format(d, 'yyyy-MM-dd'),
        totalEmployees,
        onVacation: randomOnVacation,
        available,
        coveragePercentage,
        level
      });
    }
    
    return days;
  };

  // Export handlers
  const handleExport = (type: 'current-tab' | 'all-data') => {
    try {
      let success = false;
      
      if (type === 'current-tab') {
        // Export data based on current active tab
        switch (activeTab) {
          case 'overview':
            success = exportAnalyticsData('overview', overviewData, dateRange);
            break;
          case 'team-usage':
            success = exportAnalyticsData('team-usage', transformUsageData(), dateRange);
            break;
          case 'coverage':
            success = exportAnalyticsData('coverage', transformCoverageData(), dateRange);
            break;
          case 'trends':
            success = exportAnalyticsData('trends', trendsData?.trends || [], dateRange);
            break;
          case 'departments':
            success = exportAnalyticsData('departments', departmentData?.departments || [], dateRange);
            break;
          default:
            success = exportAnalyticsData('overview', overviewData, dateRange);
        }
      } else {
        // Export all available data
        const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
        
        // Export overview data
        exportAnalyticsData('overview', overviewData, dateRange);
        
        // Export team usage data
        if (teamUsageData?.usageByEmployee?.length > 0) {
          exportAnalyticsData('team-usage', transformUsageData(), dateRange);
        }
        
        // Export department data
        if (departmentData?.departments?.length > 0) {
          exportAnalyticsData('departments', departmentData.departments, dateRange);
        }
        
        // Export trends data
        if (trendsData?.trends?.length > 0) {
          exportAnalyticsData('trends', trendsData.trends, dateRange);
        }
        
        // Export seasonal data
        if (trendsData?.seasonalPatterns?.length > 0) {
          exportAnalyticsData('seasonal', trendsData.seasonalPatterns, dateRange);
        }
        
        success = true;
      }

      if (success) {
        toast({
          title: "Export erfolgreich",
          description: type === 'current-tab' 
            ? `Daten für ${activeTab} wurden exportiert.`
            : "Alle verfügbaren Daten wurden exportiert.",
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        title: "Export fehlgeschlagen",
        description: "Beim Exportieren der Daten ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || !user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AnimatedNavbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  Urlaubs-Analytics
                </h1>
                <p className="text-muted-foreground mt-2">
                  Umfassende Einblicke in Urlaubsmuster, Team-Abdeckung und organisatorische Kennzahlen
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-export">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="end">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Daten exportieren</h4>
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleExport('current-tab')}
                          data-testid="button-export-current"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Aktuelle Ansicht
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleExport('all-data')}
                          data-testid="button-export-all"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Alle Daten
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        CSV-Format • UTF-8 Kodierung
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 p-4 bg-muted/30 rounded-lg">
              <DateRangeFilter
                value={dateRange}
                onChange={setDateRange}
              />
              <Separator orientation="vertical" className="hidden lg:block h-8" />
              <DepartmentFilter
                value={selectedDepartments}
                onChange={setSelectedDepartments}
              />
              <Separator orientation="vertical" className="hidden lg:block h-8" />
              <EmployeeFilter
                value={selectedEmployees}
                onChange={setSelectedEmployees}
                departmentFilter={selectedDepartments}
              />
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gesamt-Auslastung</p>
                  <div className="flex items-center gap-2">
                    {overviewLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold" data-testid="kpi-utilization">
                        {overviewData?.utilizationRate?.toFixed(1) || 0}%
                      </p>
                    )}
                    <Badge variant={
                      (overviewData?.utilizationRate || 0) > 70 ? "default" : 
                      (overviewData?.utilizationRate || 0) > 50 ? "secondary" : "destructive"
                    }>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {(overviewData?.utilizationRate || 0) > 50 ? "Hoch" : "Niedrig"}
                    </Badge>
                  </div>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Team-Mitglieder</p>
                  <div className="flex items-center gap-2">
                    {overviewLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold" data-testid="kpi-employees">
                        {overviewData?.totalEmployees || 0}
                      </p>
                    )}
                    <Badge variant="outline">Aktiv</Badge>
                  </div>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Genehmigungsrate</p>
                  <div className="flex items-center gap-2">
                    {overviewLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold" data-testid="kpi-approval-rate">
                        {overviewData?.approvalRate?.toFixed(1) || 0}%
                      </p>
                    )}
                    <Badge variant={
                      (overviewData?.approvalRate || 0) > 90 ? "default" : 
                      (overviewData?.approvalRate || 0) > 70 ? "secondary" : "destructive"
                    }>
                      <Clock className="h-3 w-3 mr-1" />
                      {(overviewData?.approvalRate || 0) > 90 ? "Schnell" : "Langsam"}
                    </Badge>
                  </div>
                </div>
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CalendarDays className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Konfliktrate</p>
                  <div className="flex items-center gap-2">
                    {overviewLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold" data-testid="kpi-conflict-rate">
                        {overviewData?.conflictRate?.toFixed(1) || 0}%
                      </p>
                    )}
                    <Badge variant={
                      (overviewData?.conflictRate || 0) < 5 ? "default" : 
                      (overviewData?.conflictRate || 0) < 10 ? "secondary" : "destructive"
                    }>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {(overviewData?.conflictRate || 0) < 5 ? "Niedrig" : "Hoch"}
                    </Badge>
                  </div>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="team-usage" data-testid="tab-team-usage">
              Team-Nutzung
            </TabsTrigger>
            <TabsTrigger value="coverage" data-testid="tab-coverage">
              Abdeckung
            </TabsTrigger>
            <TabsTrigger value="trends" data-testid="tab-trends">
              Trends
            </TabsTrigger>
            <TabsTrigger value="departments" data-testid="tab-departments">
              Abteilungen
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VacationUsageBarChart 
                data={transformUsageData()}
                isLoading={teamUsageLoading}
                title="Urlaubsnutzung nach Mitarbeiter"
              />

              <BalancePieChart 
                data={transformBalanceData()}
                isLoading={overviewLoading}
                title="Gesamte Urlaubsbalance"
              />

              <DepartmentComparisonChart 
                data={departmentData?.departments || []}
                isLoading={departmentLoading}
                title="Abteilungsvergleich - Auslastung"
                metric="utilization"
              />

              <VacationTrendLineChart 
                data={trendsData?.trends || []}
                isLoading={trendsLoading}
                title="Urlaubstrends (Monatlich)"
                height={320}
              />
            </div>
          </TabsContent>

          {/* Team Usage Tab */}
          <TabsContent value="team-usage" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <VacationUsageBarChart 
                  data={transformUsageData()}
                  isLoading={teamUsageLoading}
                  title="Detaillierte Mitarbeiter Urlaubsnutzung"
                  height={480}
                />
              </div>

              <BalancePieChart 
                data={transformBalanceData()}
                isLoading={overviewLoading}
                title="Team Balance Übersicht"
                height={480}
              />

              <div className="xl:col-span-3">
                <DepartmentComparisonChart 
                  data={departmentData?.departments || []}
                  isLoading={departmentLoading}
                  title="Abteilungsvergleich - Durchschnittliche Tage"
                  metric="days"
                  height={320}
                />
              </div>
            </div>
          </TabsContent>

          {/* Coverage Tab */}
          <TabsContent value="coverage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <CoverageHeatmap 
                  data={transformCoverageData()}
                  isLoading={utilizationLoading}
                  title="Team-Abdeckung Heatmap"
                  weeks={12}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Kritische Perioden</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {utilizationLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                          <div>
                            <p className="font-medium text-red-800 dark:text-red-200">Kritische Auslastung</p>
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {utilizationData?.riskMetrics?.conflictProne || 0} überlappende Anfragen
                            </p>
                          </div>
                          <Badge variant="destructive">Hoch</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                          <div>
                            <p className="font-medium text-yellow-800 dark:text-yellow-200">Unterausgelastet</p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                              {utilizationData?.riskMetrics?.underutilizers || 0} Mitarbeiter unter 50%
                            </p>
                          </div>
                          <Badge variant="secondary">Mittel</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                          <div>
                            <p className="font-medium text-orange-800 dark:text-orange-200">Kurzfristig</p>
                            <p className="text-sm text-orange-600 dark:text-orange-400">
                              {utilizationData?.riskMetrics?.lastMinuteBookings || 0} Last-Minute Buchungen
                            </p>
                          </div>
                          <Badge variant="outline">Niedrig</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Abdeckungsempfehlungen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <p className="font-medium text-green-800 dark:text-green-200">✓ Optimaler Zeitraum</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Februar - April zeigt beste Verfügbarkeit
                        </p>
                      </div>
                      
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <p className="font-medium text-blue-800 dark:text-blue-200">📊 Balance Empfehlung</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          3-4 Mitarbeiter gleichzeitig ist optimal
                        </p>
                      </div>
                      
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <p className="font-medium text-purple-800 dark:text-purple-200">⚡ Planungsvorschlag</p>
                        <p className="text-sm text-purple-600 dark:text-purple-400">
                          Mindestens 2 Wochen Vorlauf empfohlen
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <VacationTrendLineChart 
                  data={trendsData?.trends || []}
                  isLoading={trendsLoading}
                  title="Historische Urlaubstrends"
                  height={400}
                  showApprovalRate={true}
                  showProcessingTime={true}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Saisonale Muster</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trendsLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {trendsData?.seasonalPatterns?.slice(0, 6).map((pattern: any, index: number) => {
                          const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 
                                             'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
                          const intensity = pattern.popularityScore > 75 ? 'high' : 
                                           pattern.popularityScore > 50 ? 'medium' : 'low';
                          
                          return (
                            <div key={index} className="flex items-center justify-between p-2 rounded">
                              <span className="font-medium">{monthNames[pattern.month - 1]}</span>
                              <div className="flex items-center gap-2">
                                <div className={`w-16 h-2 rounded-full bg-gradient-to-r ${
                                  intensity === 'high' ? 'from-red-400 to-red-600' :
                                  intensity === 'medium' ? 'from-yellow-400 to-yellow-600' :
                                  'from-green-400 to-green-600'
                                }`} style={{ width: `${Math.max(pattern.popularityScore * 0.6, 10)}px` }} />
                                <span className="text-sm text-muted-foreground">
                                  {pattern.requestCount} Anträge
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Jahr-zu-Jahr Vergleich</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trendsLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {trendsData?.yearOverYear?.slice(-3).map((year: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                              <p className="font-medium">{year.year}</p>
                              <p className="text-sm text-muted-foreground">
                                {year.totalRequests} Anträge • {year.totalDays} Tage
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{year.utilizationRate.toFixed(1)}%</p>
                              <p className="text-sm text-muted-foreground">Auslastung</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DepartmentComparisonChart 
                data={departmentData?.departments || []}
                isLoading={departmentLoading}
                title="Abteilungsvergleich - Anträge"
                metric="requests"
                height={400}
              />

              <DepartmentComparisonChart 
                data={departmentData?.departments || []}
                isLoading={departmentLoading}
                title="Abteilungsvergleich - Genehmigungsrate"
                metric="approval"
                height={400}
              />

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Abteilungs-KPIs Übersicht</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {departmentLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <Skeleton className="h-4 w-20 mb-2" />
                          <Skeleton className="h-8 w-16 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      ))
                    ) : (
                      departmentData?.departments?.slice(0, 4).map((dept: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            {dept.department}
                          </p>
                          <p className="text-2xl font-bold mb-1">
                            {dept.totalEmployees}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {dept.utilizationRate.toFixed(1)}% Auslastung
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {departmentData?.metrics && (
                    <div className="mt-6 grid grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Aktivste Abteilung</p>
                        <p className="font-bold text-primary">{departmentData.metrics.mostActiveDepart}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Höchste Auslastung</p>
                        <p className="font-bold text-primary">{departmentData.metrics.highestUtilization}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Schnellste Genehmigung</p>
                        <p className="font-bold text-primary">{departmentData.metrics.fastestApproval}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}