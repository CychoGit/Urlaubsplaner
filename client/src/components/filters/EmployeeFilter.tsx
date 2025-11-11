import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  department?: string;
  profileImageUrl?: string;
}

interface EmployeeFilterProps {
  value: string[];
  onChange: (employeeIds: string[]) => void;
  className?: string;
  departmentFilter?: string[]; // Filter employees by selected departments
}

export default function EmployeeFilter({ 
  value, 
  onChange, 
  className, 
  departmentFilter = [] 
}: EmployeeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch team members
  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ['/api/team'],
    enabled: true
  });

  // Filter employees based on department filter and search term
  const filteredEmployees = teamMembers.filter((employee: Employee) => {
    // Apply department filter if specified
    if (departmentFilter.length > 0) {
      const employeeDept = employee.department || 'operations';
      if (!departmentFilter.includes(employeeDept)) {
        return false;
      }
    }

    // Apply search filter
    if (searchTerm) {
      const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.toLowerCase();
      const email = employee.email.toLowerCase();
      const search = searchTerm.toLowerCase();
      
      return fullName.includes(search) || email.includes(search);
    }

    return true;
  });

  const handleEmployeeToggle = (employeeId: string) => {
    const newValue = value.includes(employeeId)
      ? value.filter(id => id !== employeeId)
      : [...value, employeeId];
    onChange(newValue);
  };

  const handleSelectAll = () => {
    if (value.length === filteredEmployees.length) {
      onChange([]);
    } else {
      onChange(filteredEmployees.map((emp: Employee) => emp.id));
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getEmployeeName = (employee: Employee) => {
    const name = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
    return name || employee.email;
  };

  const getSelectedText = () => {
    if (value.length === 0) return "Alle Mitarbeiter";
    if (value.length === 1) {
      const employee = teamMembers.find((emp: Employee) => emp.id === value[0]);
      return employee ? getEmployeeName(employee) : "1 Mitarbeiter";
    }
    return `${value.length} Mitarbeiter`;
  };

  const getInitials = (employee: Employee) => {
    const first = employee.firstName?.charAt(0) || '';
    const last = employee.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || employee.email.charAt(0).toUpperCase();
  };

  const getDepartmentLabel = (department?: string) => {
    const departmentLabels: Record<string, string> = {
      operations: "Operations",
      development: "Entwicklung", 
      marketing: "Marketing",
      sales: "Vertrieb",
      hr: "Personal",
      finance: "Finanzen",
      support: "Support",
      management: "Management"
    };
    return departmentLabels[department || 'operations'] || department || 'Operations';
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start min-w-48"
            data-testid="button-employee-filter"
          >
            <Users className="h-4 w-4 mr-2" />
            {getSelectedText()}
            {value.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {value.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="start">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Mitarbeiter</h4>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  data-testid="button-select-all-employees"
                >
                  {value.length === filteredEmployees.length ? "Keine" : "Alle"}
                </Button>
                {value.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    data-testid="button-clear-employees"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Mitarbeiter suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-employee-search"
              />
            </div>

            {/* Employee List */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Lade Mitarbeiter...
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {searchTerm ? "Keine Mitarbeiter gefunden" : "Keine Mitarbeiter verfügbar"}
                </div>
              ) : (
                filteredEmployees.map((employee: Employee) => {
                  const isSelected = value.includes(employee.id);

                  return (
                    <div
                      key={employee.id}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 p-2 rounded"
                      onClick={() => handleEmployeeToggle(employee.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleEmployeeToggle(employee.id)}
                        data-testid={`checkbox-employee-${employee.id}`}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={employee.profileImageUrl} />
                        <AvatarFallback className="text-xs">
                          {getInitials(employee)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {getEmployeeName(employee)}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {getDepartmentLabel(employee.department)} • {employee.email}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {departmentFilter.length > 0 && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Gefiltert nach: {departmentFilter.length} Abteilung(en)
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected employee badges */}
      {value.length > 0 && value.length <= 3 && (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 3).map((employeeId) => {
            const employee = teamMembers.find((emp: Employee) => emp.id === employeeId);
            if (!employee) return null;

            return (
              <Badge
                key={employeeId}
                variant="secondary"
                className="text-xs max-w-32 truncate"
              >
                {getEmployeeName(employee)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => handleEmployeeToggle(employeeId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
          {value.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{value.length - 3} weitere
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}