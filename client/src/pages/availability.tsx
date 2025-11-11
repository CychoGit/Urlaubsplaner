import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { User, VacationRequestWithUser, Holiday } from "@shared/schema";
import AnimatedNavbar from "@/components/animated-navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { de } from "date-fns/locale";

export default function Availability() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Nicht autorisiert",
        description: "Sie sind nicht angemeldet. Weiterleitung zum Login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Calculate month range (needed for queries below)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fetch team members
  const { data: teamMembers, isLoading: teamLoading } = useQuery<User[]>({
    queryKey: ['/api/team'],
    enabled: isAuthenticated,
  });

  // Fetch vacation requests for the entire organization (all team members)
  const { data: vacationRequests, isLoading: requestsLoading } = useQuery<VacationRequestWithUser[]>({
    queryKey: [
      '/api/calendar',
      format(monthStart, 'yyyy-MM-dd'),
      format(monthEnd, 'yyyy-MM-dd')
    ],
    queryFn: async () => {
      const response = await fetch(
        `/api/calendar?startDate=${format(monthStart, 'yyyy-MM-dd')}&endDate=${format(monthEnd, 'yyyy-MM-dd')}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch calendar data');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Fetch holidays for current year
  const currentYear = currentMonth.getFullYear();
  const { data: holidays } = useQuery<Holiday[]>({
    queryKey: [`/api/holidays?year=${currentYear}`],
    enabled: isAuthenticated,
  });

  // Helper to check if date is weekend
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Helper to check if date is holiday
  const isHoliday = (date: Date) => {
    if (!holidays) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidays.find(h => h.date === dateStr);
  };

  // Get vacation requests for a user on a specific date
  const getVacationForDate = (userId: string, date: Date) => {
    if (!vacationRequests) return null;
    
    // Don't show vacation on weekends - they don't count as vacation days
    if (isWeekend(date)) return null;
    
    // Format the check date as string to avoid timezone issues
    const checkDateStr = format(date, 'yyyy-MM-dd');
    
    return vacationRequests.find(request => {
      if (request.userId !== userId) return false;
      if (request.status !== 'approved' && request.status !== 'pending') return false;
      
      // Extract date strings from the request (they may include time components)
      // Format them as yyyy-MM-dd to ensure we're comparing dates only
      const startDateStr = request.startDate.split('T')[0]; // Handle ISO format
      const endDateStr = request.endDate.split('T')[0];
      
      // String comparison works for yyyy-MM-dd format
      return checkDateStr >= startDateStr && checkDateStr <= endDateStr;
    });
  };

  // Format name as "M. Manager"
  const formatName = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName || !lastName) return 'N/A';
    return `${firstName.charAt(0)}. ${lastName}`;
  };

  // Sort team members alphabetically
  const sortedMembers = teamMembers
    ?.filter(m => m.status === 'approved')
    .sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    }) || [];

  // Navigation handlers
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToCurrentMonth = () => setCurrentMonth(new Date());

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isLoading = teamLoading || requestsLoading;

  return (
    <div className="min-h-full bg-background">
      <AnimatedNavbar />
      
      <div className="max-w-[1600px] mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header with Month Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text">
              Verfügbarkeit
            </h1>
            <div className="flex items-center gap-2">
              <Button
                onClick={goToPreviousMonth}
                variant="outline"
                size="icon"
                data-testid="btn-previous-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={goToCurrentMonth}
                variant="outline"
                className="min-w-[180px]"
                data-testid="btn-current-month"
              >
                {format(currentMonth, 'MMMM yyyy', { locale: de })}
              </Button>
              <Button
                onClick={goToNextMonth}
                variant="outline"
                size="icon"
                data-testid="btn-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">
            Übersicht über die Verfügbarkeit aller Teammitglieder im aktuellen Monat
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="sticky left-0 z-10 bg-muted/50 px-2 py-2 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-tight w-[80px] max-w-[80px] border-r border-b border-border">
                        Name
                      </th>
                      {daysInMonth.map((date, idx) => {
                        const holiday = isHoliday(date);
                        const weekend = isWeekend(date);
                        const isToday = isSameDay(date, new Date());
                        
                        let bgClass = '';
                        if (weekend) {
                          bgClass = 'bg-gray-100 dark:bg-gray-800';
                        } else if (holiday) {
                          bgClass = 'bg-red-50 dark:bg-red-800/30';
                        } else {
                          bgClass = 'bg-muted/50';
                        }
                        
                        return (
                          <th
                            key={idx}
                            className={`px-1 py-2 text-center text-[10px] font-medium tracking-tight w-[34px] min-w-[34px] max-w-[34px] border-r border-b border-border ${bgClass} ${
                              isToday ? 'ring-2 ring-inset ring-blue-500 dark:ring-blue-400' : ''
                            }`}
                            title={holiday ? holiday.name : format(date, 'EEEE', { locale: de })}
                          >
                            <div className={`${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-muted-foreground'}`}>
                              {format(date, 'd')}
                            </div>
                            <div className={`text-[9px] ${isToday ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-muted-foreground/70'}`}>
                              {format(date, 'EEEEE', { locale: de })}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {sortedMembers.map((member) => (
                      <tr key={member.id} data-testid={`row-member-${member.id}`}>
                        <td className="sticky left-0 z-10 bg-background px-2 py-2 whitespace-nowrap text-[11px] font-medium w-[80px] max-w-[80px] overflow-hidden text-ellipsis border-r border-b border-border">
                          {formatName(member.firstName, member.lastName)}
                        </td>
                        {daysInMonth.map((date, idx) => {
                          const vacation = getVacationForDate(member.id, date);
                          const holiday = isHoliday(date);
                          const weekend = isWeekend(date);
                          const isToday = isSameDay(date, new Date());
                          
                          let cellClass = "px-1 py-2 text-center w-[34px] min-w-[34px] max-w-[34px] border-r border-b border-border ";
                          if (vacation) {
                            cellClass += vacation.status === 'approved' 
                              ? 'bg-green-500/80 dark:bg-green-400/70' 
                              : 'bg-orange-500/80 dark:bg-orange-400/70';
                          } else if (weekend) {
                            cellClass += 'bg-gray-100 dark:bg-gray-800';
                          } else if (holiday) {
                            cellClass += 'bg-red-50 dark:bg-red-800/30';
                          }
                          
                          if (isToday) {
                            cellClass += ' ring-2 ring-inset ring-blue-500 dark:ring-blue-400';
                          }
                          
                          return (
                            <td
                              key={idx}
                              className={cellClass}
                              title={vacation ? `${vacation.reason || 'Urlaub'} (${vacation.status === 'approved' ? 'Genehmigt' : 'Wartend'})` : ''}
                            >
                              {/* Empty cell - color shows status */}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legend */}
            <div className="border-t border-border px-4 py-4 bg-muted/30">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 bg-green-500/80 dark:bg-green-400/70 rounded"></div>
                  <span>Genehmigter Urlaub</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 bg-orange-500/80 dark:bg-orange-400/70 rounded"></div>
                  <span>Wartender Antrag</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600"></div>
                  <span>Wochenende</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 bg-red-50 dark:bg-red-800/30 rounded border border-red-200 dark:border-red-800"></div>
                  <span>Feiertag</span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
