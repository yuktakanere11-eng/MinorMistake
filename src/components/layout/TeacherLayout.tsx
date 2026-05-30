import { Outlet, useNavigate } from "react-router-dom"; // 1. Added useNavigate
import { useEffect, useState } from "react";
import Sidebar from "./TeacherSidebar";
import Header from "./TeacherHeader";
import { supabase } from "../../lib/supabaseClient"; 

export default function TeacherLayout() {
  const navigate = useNavigate(); // 2. Initialize navigate
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        // 3. If no session, force login
        navigate("/login"); 
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
        navigate("/login"); // 4. If logged out, force login
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]); // Added navigate to dependency array

  if (loading) return null; // Or a spinner/loading screen

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header user={profile} />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1600px] mx-auto p-8 animate-in fade-in duration-500">
            <Outlet context={{ user: profile }} />
          </div>
        </main>
      </div>
    </div>
  );
}