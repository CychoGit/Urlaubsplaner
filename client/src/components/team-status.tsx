import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User, VacationRequestWithUser } from "@shared/schema";

export default function TeamStatus() {
  const { data: teamMembers } = useQuery<User[]>({
    queryKey: ['/api/team'],
  });

  const { data: allRequests } = useQuery<VacationRequestWithUser[]>({
    queryKey: ['/api/vacation-requests'],
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
    return status === 'Im Urlaub' ? 'bg-green-500' : 'bg-gray-400';
  };

  if (!teamMembers) {
    return (
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Team Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-200 rounded-full mr-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
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
        <CardTitle>Team Status</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          {teamMembers.map((member) => {
            const status = getEmployeeStatus(member.id);
            return (
              <div 
                key={member.id} 
                className="flex items-center justify-between py-2"
                data-testid={`team-member-${member.id}`}
              >
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(status)}`}></div>
                  <span className="text-sm text-foreground">
                    {member.firstName} {member.lastName}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground" data-testid={`status-${member.id}`}>
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
