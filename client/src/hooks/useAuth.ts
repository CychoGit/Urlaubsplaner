import { useQuery } from "@tanstack/react-query";
import type { UserWithOrganization } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<UserWithOrganization>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
