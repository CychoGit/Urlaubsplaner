import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface VacationBalance {
  annualAllowance: number;
  usedDays: number;
  remainingDays: number;
}

export default function VacationBalanceCard() {
  const { data: balance, isLoading, error } = useQuery<VacationBalance>({
    queryKey: ['/api/users/balance'],
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Urlaubssaldo</CardTitle>
          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-between text-sm">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Urlaubssaldo</CardTitle>
          <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground" data-testid="text-balance-error">
            Fehler beim Laden des Urlaubssaldos
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!balance) {
    return null;
  }

  const usagePercentage = (balance.usedDays / balance.annualAllowance) * 100;
  const isLowBalance = balance.remainingDays <= 5;
  const isOverUsed = balance.remainingDays < 0;

  return (
    <Card 
      className={`transition-all duration-200 ${
        isOverUsed 
          ? "bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50 border-red-200 dark:border-red-800" 
          : isLowBalance
          ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-200 dark:border-amber-800"
          : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800"
      }`}
      data-testid="card-vacation-balance"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Urlaubssaldo</CardTitle>
        <Calendar className={`h-4 w-4 ${
          isOverUsed 
            ? "text-red-600 dark:text-red-400" 
            : isLowBalance
            ? "text-amber-600 dark:text-amber-400"
            : "text-blue-600 dark:text-blue-400"
        }`} />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Main balance display */}
          <div className="text-2xl font-bold" data-testid="text-remaining-days">
            {balance.remainingDays} {balance.remainingDays === 1 ? 'Tag' : 'Tage'}
          </div>
          <p className="text-xs text-muted-foreground">
            verbleibend von {balance.annualAllowance} {balance.annualAllowance === 1 ? 'Tag' : 'Tagen'}
          </p>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress 
              value={Math.min(usagePercentage, 100)}
              className={`h-2 ${
                isOverUsed 
                  ? "bg-red-100 dark:bg-red-900/20" 
                  : isLowBalance
                  ? "bg-amber-100 dark:bg-amber-900/20"
                  : "bg-blue-100 dark:bg-blue-900/20"
              }`}
              data-testid="progress-balance-usage"
            />
            
            {/* Usage statistics */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span data-testid="text-used-days">
                  {balance.usedDays} verwendet
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span data-testid="text-annual-allowance">
                  {balance.annualAllowance} jährlich
                </span>
              </div>
            </div>
          </div>

          {/* Warning messages */}
          {isOverUsed && (
            <div className="text-xs text-red-700 dark:text-red-300 bg-red-100/50 dark:bg-red-900/20 px-2 py-1 rounded" data-testid="text-over-used-warning">
              ⚠️ Urlaubssaldo überzogen
            </div>
          )}
          {isLowBalance && !isOverUsed && (
            <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-900/20 px-2 py-1 rounded" data-testid="text-low-balance-warning">
              ⚠️ Niedriges Urlaubssaldo
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}