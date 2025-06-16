import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabase/client";

/**
 * A hook to protect routes based on user roles
 * @param requiredRole The role required to access the route
 * @returns Session and user information if authorized
 */
export function useRequireRole(requiredRole: string) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace(`/auth`);
        setIsLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (error || !data || data.role !== requiredRole) {
        router.replace(`/auth`);
        setIsLoading(false);
        return;
      }
      setIsAuthorized(true);
      setIsLoading(false);
    };
    checkAuth();
  }, [requiredRole, router]);

  return {
    user,
    isAuthorized,
    isLoading,
  };
}

export default useRequireRole;
