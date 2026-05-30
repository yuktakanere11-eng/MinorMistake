import { useEffect, useState, useCallback } from "react";
import { 
  Clock, CheckCircle, BookOpen, MessageSquare, 
  Plus, Loader2 
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    average: "0%",
    feedback: 0
  });

  // ── SECURE & ROBUST DATA FETCHING ──
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      // SAFETY CHECK: If no user, reset stats and exit
      if (!user) {
        setStats({ pending: 0, completed: 0, average: "0%", feedback: 0 });
        setLoading(false);
        return;
      }

      // 1. FIRST, find out what classes this specific student is actually in.
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_enrollments') 
        .select('class_id')
        .eq('student_id', user.id);

      if (enrollError) console.error("Enrollment fetch error:", enrollError);

      // Create an array of just the class IDs
      const classIds = enrollments?.map(e => e.class_id) || [];

      // 2. NOW fetch assignments, but ONLY for those specific classes
      const [assignmentsRes, submissionsRes] = await Promise.all([
        classIds.length > 0 
          ? supabase.from('assignments').select('id').in('class_id', classIds)
          : { data: [], error: null }, // If not enrolled in anything, return 0 assignments
        supabase.from('submissions').select('assignment_id, status, score').eq('student_id', user.id)
      ]);

      const allAssignments = assignmentsRes.data || [];
      const submissions = submissionsRes.data || [];

      // 3. Calculate the stats
      const submittedIds = submissions.map(s => s.assignment_id);
      
      // Pending: Assignments in their classes that they haven't submitted yet
      const pendingCount = allAssignments.filter(a => !submittedIds.includes(a.id)).length;
      
      const graded = submissions.filter(s => s?.status?.toLowerCase() === 'graded');
      
      const avg = graded.length > 0 
        ? Math.round(graded.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / graded.length) 
        : 0;

      setStats({
        pending: pendingCount,
        completed: submissions.length,
        average: `${avg}%`,
        feedback: graded.length
      });

    } catch (error) {
      console.error("Dashboard Stats Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();

    // ── SESSION LISTENER: Purge data immediately on sign-out ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setStats({ pending: 0, completed: 0, average: "0%", feedback: 0 });
        navigate("/login", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchDashboardStats, navigate]);

  if (loading) return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-6">
      <Loader2 className="animate-spin text-indigo-600" size={48} strokeWidth={1} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
        Aggregating Metrics
      </p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000 px-6 py-16">
      
      {/* ── HEADER ── */}
      <div className="space-y-4">
        <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85]">
          Overview<span className="text-indigo-600">.</span>
        </h1>
        <p className="text-slate-400 font-medium italic text-xl tracking-tight max-w-sm border-l-2 border-slate-100 pl-6">
          Performance metrics & active studio tasks.
        </p>
      </div>

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { 
            label: "Pending", 
            value: stats.pending, 
            icon: Clock, 
            color: "text-amber-500", 
            bg: "bg-amber-50", 
            activeBg: "group-hover:bg-amber-500",
            link: '/student/assignments'
          },
          { 
            label: "Completed", 
            value: stats.completed, 
            icon: CheckCircle, 
            color: "text-emerald-500", 
            bg: "bg-emerald-50", 
            activeBg: "group-hover:bg-emerald-500",
            link: '/student/submissions'
          },
          { 
            label: "Avg Score", 
            value: stats.average, 
            icon: BookOpen, 
            color: "text-indigo-500", 
            bg: "bg-indigo-50", 
            activeBg: "group-hover:bg-indigo-500",
            link: '/student/analytics'
          },
          { 
            label: "Feedback", 
            value: stats.feedback, 
            icon: MessageSquare, 
            color: "text-rose-500", 
            bg: "bg-rose-50", 
            activeBg: "group-hover:bg-rose-500",
            link: '/student/feedback'
          },
        ].map((item, idx) => (
          <button 
            key={idx}
            onClick={() => navigate(item.link, { state: { filter: item.label === 'Pending' ? 'PENDING' : null } })}
            className="bg-white p-8 rounded-[3rem] border border-slate-100 flex items-center gap-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] group text-left w-full"
          >
            <div className={`h-16 w-16 shrink-0 rounded-[1.5rem] ${item.bg} flex items-center justify-center ${item.color} ${item.activeBg} group-hover:text-white transition-all duration-500 shadow-inner`}>
              <item.icon size={28} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1 leading-none">{item.label}</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{item.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── CTA SECTION ── */}
      <div className="space-y-6 pt-8">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-4">
          Quick Access Briefs
        </h3>
        <button 
          onClick={() => navigate('/student/assignments', { state: { filter: 'PENDING' } })}
          className="w-full bg-white border-2 border-dashed border-slate-100 rounded-[4rem] p-24 flex flex-col items-center justify-center text-center hover:border-indigo-200 transition-all duration-700 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-indigo-50/0 group-hover:bg-indigo-50/30 transition-colors pointer-events-none" />
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm border border-slate-100 group-hover:border-indigo-200">
            <Plus className="text-slate-300 group-hover:text-indigo-500 transition-colors" size={32} />
          </div>
          <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Initialize Pending Tasks
          </h4>
          <p className="text-slate-400 text-sm font-medium mt-2 max-w-sm mx-auto">
            Browse the vault for active architectural briefs and design parameters.
          </p>
        </button>
      </div>
    </div>
  );
}