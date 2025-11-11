import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Availability from "@/pages/availability";
import AnimatedDashboard from "@/components/animated-dashboard";
import Settings from "@/pages/settings";
import Requests from "@/pages/requests";
import TeamOverview from "@/pages/team-overview";
import Analytics from "@/pages/analytics";
import AdminUsers from "@/pages/admin-users";
import TenantAdmin from "@/pages/tenant-admin";
import OrganizationSettings from "@/pages/organization-settings";
import UserSettings from "@/pages/user-settings";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
        </>
      ) : (
        <>
          <Route path="/" component={Availability} />
          <Route path="/availability" component={Availability} />
          <Route path="/dashboard" component={AnimatedDashboard} />
          <Route path="/app" component={AnimatedDashboard} />
          <Route path="/settings" component={Settings} />
          <Route path="/settings/user" component={UserSettings} />
          <Route path="/requests" component={Requests} />
          <Route path="/team" component={TeamOverview} />
          
          {/* Protected routes - Admin and Tenant Admin only */}
          <Route path="/settings/organization">
            <ProtectedRoute allowedRoles={['admin', 'tenant_admin']}>
              <OrganizationSettings />
            </ProtectedRoute>
          </Route>
          <Route path="/analytics">
            <ProtectedRoute allowedRoles={['admin', 'tenant_admin']}>
              <Analytics />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/users">
            <ProtectedRoute allowedRoles={['admin', 'tenant_admin']}>
              <AdminUsers />
            </ProtectedRoute>
          </Route>
          
          {/* Protected route - Tenant Admin only */}
          <Route path="/tenant-admin">
            <ProtectedRoute allowedRoles={['tenant_admin']}>
              <TenantAdmin />
            </ProtectedRoute>
          </Route>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
