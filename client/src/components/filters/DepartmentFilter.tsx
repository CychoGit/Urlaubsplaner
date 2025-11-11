import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DepartmentFilterProps {
  value: string[];
  onChange: (departments: string[]) => void;
  className?: string;
}

const DEPARTMENT_OPTIONS = [
  { value: "operations", label: "Operations" },
  { value: "development", label: "Entwicklung" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Vertrieb" },
  { value: "hr", label: "Personal" },
  { value: "finance", label: "Finanzen" },
  { value: "support", label: "Support" },
  { value: "management", label: "Management" }
];

export default function DepartmentFilter({ value, onChange, className }: DepartmentFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch team members to get actual departments in use
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['/api/team'],
    enabled: true
  });

  // Get departments that are actually in use
  const activeDepartments = new Set(
    teamMembers.map((member: any) => member.department || 'operations')
  );

  const availableDepartments = DEPARTMENT_OPTIONS.filter(dept => 
    activeDepartments.has(dept.value)
  );

  const handleDepartmentToggle = (departmentValue: string) => {
    const newValue = value.includes(departmentValue)
      ? value.filter(d => d !== departmentValue)
      : [...value, departmentValue];
    onChange(newValue);
  };

  const handleSelectAll = () => {
    if (value.length === availableDepartments.length) {
      onChange([]);
    } else {
      onChange(availableDepartments.map(d => d.value));
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getDepartmentLabel = (departmentValue: string) => {
    return DEPARTMENT_OPTIONS.find(d => d.value === departmentValue)?.label || departmentValue;
  };

  const getSelectedText = () => {
    if (value.length === 0) return "Alle Abteilungen";
    if (value.length === 1) return getDepartmentLabel(value[0]);
    if (value.length === availableDepartments.length) return "Alle Abteilungen";
    return `${value.length} Abteilungen`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start min-w-48"
            data-testid="button-department-filter"
          >
            <Building2 className="h-4 w-4 mr-2" />
            {getSelectedText()}
            {value.length > 0 && value.length < availableDepartments.length && (
              <Badge variant="secondary" className="ml-2">
                {value.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Abteilungen</h4>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  data-testid="button-select-all-departments"
                >
                  {value.length === availableDepartments.length ? "Keine" : "Alle"}
                </Button>
                {value.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    data-testid="button-clear-departments"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {availableDepartments.map((department) => {
                const isSelected = value.includes(department.value);
                const memberCount = teamMembers.filter(
                  (member: any) => (member.department || 'operations') === department.value
                ).length;

                return (
                  <div
                    key={department.value}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 p-2 rounded"
                    onClick={() => handleDepartmentToggle(department.value)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleDepartmentToggle(department.value)}
                      data-testid={`checkbox-department-${department.value}`}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{department.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {memberCount} Mitarbeiter
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {value.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-2">
                Alle Abteilungen werden angezeigt
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected department badges */}
      {value.length > 0 && value.length < 4 && (
        <div className="flex flex-wrap gap-1">
          {value.map((departmentValue) => (
            <Badge
              key={departmentValue}
              variant="secondary"
              className="text-xs"
            >
              {getDepartmentLabel(departmentValue)}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => handleDepartmentToggle(departmentValue)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}