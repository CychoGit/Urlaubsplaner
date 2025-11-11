import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Users, AlertTriangle, Info, BarChart3 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, startOfYear, endOfYear, eachMonthOfInterval, getDaysInMonth, getDay, isWeekend } from "date-fns";
import { de } from "date-fns/locale";
import type { VacationRequestWithUser, TeamCoverageAnalysis, Holiday } from "@shared/schema";
import TeamCoverageTimeline from "./team-coverage-timeline";

interface YearViewProps {
  currentDate: Date;
  onMonthClick: (date: Date) => void;
}

function YearView({ currentDate, onMonthClick }: YearViewProps) {
  const yearStart = startOfYear(currentDate);
  const yearEnd = endOfYear(currentDate);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  
  return (
    <div className="grid grid-cols-3 gap-4" data-testid="year-view">
      {months.map((month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const daysInMonth = getDaysInMonth(month);
        const firstDayOfWeek = getDay(monthStart);
        const startDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday = 0
        
        return (
          <div 
            key={month.toISOString()} 
            className="p-3 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-card"
            onClick={() => onMonthClick(month)}
            data-testid={`year-month-${format(month, 'yyyy-MM')}`}
          >
            <div className="text-sm font-semibold mb-2 text-center">
              {format(month, 'MMMM', { locale: de })}
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['M', 'D', 'M', 'D', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-center text-muted-foreground font-medium">
                  {day}
                </div>
              ))}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(month.getFullYear(), month.getMonth(), day);
                const isCurrent = isToday(date);
                return (
                  <div 
                    key={day} 
                    className={`
                      text-center p-1 rounded
                      ${isCurrent ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-accent'}
                    `}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Extend range to include previous/next month days for full calendar grid
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay() + 1); // Start from Monday
  
  const calendarEnd = new Date(monthEnd);
  const daysToAdd = 7 - monthEnd.getDay();
  if (daysToAdd < 7) {
    calendarEnd.setDate(calendarEnd.getDate() + daysToAdd);
  }

  const { data: vacationRequests } = useQuery<VacationRequestWithUser[]>({
    queryKey: [
      '/api/calendar',
      format(calendarStart, 'yyyy-MM-dd'),
      format(calendarEnd, 'yyyy-MM-dd')
    ],
    queryFn: async () => {
      const response = await fetch(
        `/api/calendar?startDate=${format(calendarStart, 'yyyy-MM-dd')}&endDate=${format(calendarEnd, 'yyyy-MM-dd')}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch calendar data');
      return response.json();
    },
  });

  // Fetch holidays for current year
  const { data: holidays } = useQuery<Holiday[]>({
    queryKey: ['/api/holidays', currentDate.getFullYear()],
    queryFn: async () => {
      const response = await fetch(
        `/api/holidays?startYear=${currentDate.getFullYear()}&endYear=${currentDate.getFullYear()}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch holidays');
      return response.json();
    },
  });

  // Fetch team coverage analysis for the current month
  const { data: teamCoverage } = useQuery<TeamCoverageAnalysis>({
    queryKey: [
      '/api/team-coverage-analysis',
      format(calendarStart, 'yyyy-MM-dd'),
      format(calendarEnd, 'yyyy-MM-dd')
    ],
    queryFn: async () => {
      const response = await fetch(
        `/api/team-coverage-analysis?startDate=${format(calendarStart, 'yyyy-MM-dd')}&endDate=${format(calendarEnd, 'yyyy-MM-dd')}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch team coverage data');
      return response.json();
    },
  });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Check if a day is a public holiday
  const isPublicHoliday = (day: Date) => {
    if (!holidays) return null;
    const dayStr = format(day, 'yyyy-MM-dd');
    return holidays.find(holiday => holiday.date === dayStr);
  };

  const getVacationsForDay = (day: Date) => {
    if (!vacationRequests) return [];
    
    const dayStr = format(day, 'yyyy-MM-dd');
    return vacationRequests.filter(request => 
      dayStr >= request.startDate && 
      dayStr <= request.endDate &&
      request.status !== 'rejected' && // Abgelehnte Anträge nicht anzeigen
      request.user !== null // Gelöschte Benutzer nicht anzeigen
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'pending':
        return 'bg-amber-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const hasConflict = (day: Date) => {
    const vacations = getVacationsForDay(day);
    const pendingVacations = vacations.filter(v => v.status === 'pending');
    return pendingVacations.length > 1;
  };

  // Get coverage data for a specific day
  const getCoverageForDay = (day: Date) => {
    if (!teamCoverage) return null;
    
    const dayStr = format(day, 'yyyy-MM-dd');
    return teamCoverage.dailyCoverage.find(coverage => coverage.date === dayStr);
  };

  // Determine coverage level and color
  const getCoverageLevel = (percentage: number) => {
    if (percentage >= 80) return { level: 'Gut', color: 'bg-green-100 border-green-300 text-green-800' };
    if (percentage >= 60) return { level: 'Begrenzt', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' };
    return { level: 'Kritisch', color: 'bg-red-100 border-red-300 text-red-800' };
  };

  // Get coverage indicator color for day backgrounds
  const getCoverageBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';  
    return 'bg-red-50 border-red-200';
  };

  // Check if day has coverage gaps in specific skills/departments
  const hasSkillGaps = (day: Date) => {
    const coverage = getCoverageForDay(day);
    return coverage && coverage.gaps.length > 0;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (viewMode === 'year') {
      // Navigate years in year view
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setFullYear(prev.getFullYear() + (direction === 'prev' ? -1 : 1));
        return newDate;
      });
    } else {
      // Navigate months in month view
      setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-lg leading-6 font-medium text-foreground">
              Kalender - {format(currentDate, 'MMMM yyyy', { locale: de })}
            </CardTitle>
            {teamCoverage && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs" data-testid="overall-coverage-badge">
                  <Users className="h-3 w-3 mr-1" />
                  {teamCoverage.overallCoverage}% Abdeckung
                </Badge>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      data-testid="button-detailed-coverage"
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        Detaillierte Team-Abdeckungsanalyse - {format(currentDate, 'MMMM yyyy', { locale: de })}
                      </DialogTitle>
                    </DialogHeader>
                    <TeamCoverageTimeline 
                      startDate={format(calendarStart, 'yyyy-MM-dd')}
                      endDate={format(calendarEnd, 'yyyy-MM-dd')}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateMonth('prev')}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateMonth('next')}
              data-testid="button-next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="ml-4 flex space-x-2">
              <Button 
                size="sm" 
                variant={viewMode === 'month' ? 'default' : 'outline'} 
                onClick={() => setViewMode('month')}
                data-testid="button-month-view"
              >
                Monat
              </Button>
              <Button 
                size="sm" 
                variant={viewMode === 'year' ? 'default' : 'outline'}
                onClick={() => setViewMode('year')}
                data-testid="button-year-view"
              >
                Jahr
              </Button>
            </div>
          </div>
        </div>

        {/* Coverage Legend */}
        {teamCoverage && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" data-testid="coverage-legend">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                Team-Abdeckungslegende
              </h4>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-600 rounded"></div>
                <span>≥80% Gut</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-600 rounded"></div>
                <span>60-79% Begrenzt</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-600 rounded"></div>
                <span>&lt;60% Kritisch</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-3 w-3 text-orange-500 dark:text-orange-400" />
                <span>Skill-Lücken</span>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4">
        {viewMode === 'month' ? (
          <>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dayVacations = getVacationsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            const conflict = hasConflict(day);
            const holiday = isPublicHoliday(day);
            const weekend = isWeekend(day);
            
            return (
              <TooltipProvider key={day.toISOString()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`
                        h-16 border border-border rounded p-1 text-sm relative cursor-pointer
                        ${isCurrentDay ? 'border-primary bg-blue-50 dark:bg-blue-900/20' : ''}
                        ${!isCurrentDay && holiday ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : ''}
                        ${!isCurrentDay && !holiday && weekend ? 'bg-gray-100 dark:bg-gray-800' : ''}
                        ${!isCurrentMonth ? 'text-muted-foreground' : 'font-medium'}
                      `}
                      data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                    >
                      {/* Date and vacation count badge */}
                      <div className="flex items-start justify-between">
                        <div className={`${isCurrentDay ? 'text-blue-600 dark:text-blue-400' : ''} ${holiday ? 'text-red-600 dark:text-red-400' : ''}`}>
                          {format(day, 'd')}
                          {isCurrentDay && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Heute</div>
                          )}
                          {holiday && (
                            <div className="text-[10px] text-red-600 dark:text-red-400 mt-1 truncate" title={holiday.name}>
                              {holiday.name}
                            </div>
                          )}
                        </div>
                        {dayVacations.length > 2 && (
                          <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-semibold">
                            {dayVacations.length}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Vacation bars */}
                      {dayVacations.slice(0, 2).map((vacation, index) => {
                        const userName = vacation.user 
                          ? `${vacation.user.firstName || ''} ${vacation.user.lastName || ''}`.trim()
                          : 'Gelöschter Benutzer';
                        
                        return (
                          <div
                            key={`${vacation.id}-${index}`}
                            className={`
                              absolute left-0 right-0 h-4 rounded flex items-center px-1
                              ${getStatusColor(vacation.status || 'pending')}
                              ${conflict && vacation.status === 'pending' ? 'bg-red-500' : ''}
                              shadow-md text-white text-[10px] font-medium overflow-hidden
                            `}
                            style={{ 
                              bottom: `${index * 18}px` 
                            }}
                          >
                            <span className="truncate">{userName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </TooltipTrigger>
                  {(dayVacations.length > 0 || holiday || weekend) && (
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-1">
                        {holiday && (
                          <p className="font-semibold text-sm mb-2 text-red-600 dark:text-red-400">
                            🎉 {holiday.name}
                          </p>
                        )}
                        {weekend && !holiday && (
                          <p className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">
                            📅 Wochenende
                          </p>
                        )}
                        {dayVacations.length > 0 && (
                          <>
                            <p className="font-semibold text-sm mb-2">
                              {dayVacations.length} {dayVacations.length === 1 ? 'Person' : 'Personen'} im Urlaub
                            </p>
                            {dayVacations.map((vacation) => {
                              const userName = vacation.user 
                                ? `${vacation.user.firstName || ''} ${vacation.user.lastName || ''}`.trim()
                                : 'Gelöschter Benutzer';
                              const statusText = vacation.status === 'approved' ? 'Genehmigt' :
                                                vacation.status === 'pending' ? 'Wartend' : 'Abgelehnt';
                              return (
                                <div key={vacation.id} className="text-xs">
                                  <span className="font-medium">{userName}</span>
                                  <span className="text-gray-400 ml-1">({statusText})</span>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                <span className="text-muted-foreground">Genehmigt</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-500 rounded mr-2"></div>
                <span className="text-muted-foreground">Wartend</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                <span className="text-muted-foreground">Konflikt</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded mr-2"></div>
                <span className="text-muted-foreground">Feiertag</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 border border-border rounded mr-2"></div>
                <span className="text-muted-foreground">Wochenende</span>
              </div>
            </div>
          </>
        ) : (
          <YearView currentDate={currentDate} onMonthClick={(date) => { setCurrentDate(date); setViewMode('month'); }} />
        )}
      </CardContent>
    </Card>
  );
}
