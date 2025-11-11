import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';

type UserRole = 'tenant_admin' | 'admin' | 'employee';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ children, allowedRoles, redirectTo = '/' }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!allowedRoles.includes(user.role as UserRole)) {
    return <Redirect to={redirectTo} />;
  }

  return <>{children}</>;
}
