import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, ChevronDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const baseNavItems = [
    { href: "/", label: "Dashboard", path: "/" },
    { href: "/requests", label: "Meine Anträge", path: "/requests" },
    { href: "/team", label: "Team Übersicht", path: "/team" },
  ];

  const adminNavItems = [
    { href: "/analytics", label: "Analytics", path: "/analytics", icon: BarChart3 },
    { href: "/admin/users", label: "Benutzer verwalten", path: "/admin/users" },
  ];
  
  const tenantAdminNavItems = [
    { href: "/tenant-admin", label: "System Admin", path: "/tenant-admin" },
  ];

  // Build nav items based on role
  let navItems = [...baseNavItems];
  if (user?.role === "admin" || user?.role === "tenant_admin") {
    navItems = [...navItems, ...adminNavItems];
  }
  if (user?.role === "tenant_admin") {
    navItems = [...navItems, ...tenantAdminNavItems];
  }

  return (
    <nav className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Calendar className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-bold text-foreground">Team Urlaubsplaner</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium gap-1",
                      location === item.path
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground"
                    )}
                    data-testid={`nav-${item.path === "/analytics" ? "analytics" : item.path}`}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </a>
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user?.role === "tenant_admin" && (
              <Badge className="bg-purple-100 text-purple-800 mr-4">
                System Admin
              </Badge>
            )}
            {user?.role === "admin" && (
              <Badge className="bg-blue-100 text-blue-800 mr-4">
                Administrator
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href="/settings/user">
                  <DropdownMenuItem data-testid="link-user-settings">
                    Benutzereinstellungen
                  </DropdownMenuItem>
                </Link>
                {(user?.role === "admin" || user?.role === "tenant_admin") && (
                  <Link href="/settings/organization">
                    <DropdownMenuItem data-testid="link-org-settings">
                      Organisationseinstellungen
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuItem 
                  onClick={() => window.location.href = '/api/logout'}
                  data-testid="button-logout"
                >
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
