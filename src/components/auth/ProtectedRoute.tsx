import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: "teacher" | "student";
}) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      try {
        // 1. SECURE AUTH CHECK
        // getUser() verifies the session with the Supabase server
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          if (isMounted) {
            setAuthenticated(false);
            setLoading(false);
          }
          return;
        }

        // 2. CHECK PROFILE ROLE
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (isMounted) {
          if (profileError || !profile) {
            setAuthenticated(false);
          } else {
            setAuthenticated(true);
            setUserRole(profile.role);
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setAuthenticated(false);
          setLoading(false);
        }
      }
    };

    checkUser();
    
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Verifying Identity
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect if role mismatch
  if (role && userRole !== role) {
    // If they are a student trying to access teacher pages, send to student dashboard, and vice versa
    const fallbackPath = userRole === "teacher" ? "/teacher/dashboard" : "/student/dashboard";
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}