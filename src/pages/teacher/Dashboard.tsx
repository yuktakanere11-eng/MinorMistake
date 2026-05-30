import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { 
  Plus, Calendar, Users, 
  Layout, Clock, CheckCircle, Sparkles, Loader2 
} from "lucide-react";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeClasses: 0,
    pendingReviews: 0,
    completionRate: 0 
  });

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Execute queries in parallel for better performance
      const [enrollmentRes, classRes, reviewRes, completionRes] = await Promise.all([
        // 1. Total Unique Students in this teacher's classes
        supabase
          .from("class_enrollments")
          .select("student_id, classes!inner(teacher_id)")
          .eq("classes.teacher_id", user.id),

        // 2. Active Classes count
        supabase
          .from("classes")
          .select("*", { count: 'exact', head: true })
          .eq("teacher_id", user.id)
          .eq("is_archived", false),

        // 3. Pending Reviews (Status: Submitted)
        supabase
          .from("submissions")
          .select("*, assignments!inner(teacher_id)", { count: 'exact', head: true })
          .eq("status", "Submitted")
          .eq("assignments.teacher_id", user.id),

        // 4. Completion Rate from Database View
        supabase
          .from('teacher_stats')
          .select('real_completion_rate')
          .eq('teacher_id', user.id)
          .maybeSingle()
      ]);

      const uniqueStudents = enrollmentRes.data 
        ? new Set(enrollmentRes.data.map(s => s.student_id)).size 
        : 0;

      setStats({
        totalStudents: uniqueStudents,
        activeClasses: classRes.count || 0,
        pendingReviews: reviewRes.count || 0,
        completionRate: Math.round(completionRes.data?.real_completion_rate || 0)
      });
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const statCards = [
    { label: "Total Students", val: stats.totalStudents, icon: Users, color: "text-purple-600", bg: "bg-purple-50", path: "/teacher/students" },
    { label: "Active Studios", val: stats.activeClasses, icon: Layout, color: "text-pink-600", bg: "bg-pink-50", path: "/teacher/classes" },
    { label: "Pending Reviews", val: stats.pendingReviews, icon: Clock, color: "text-orange-600", bg: "bg-orange-50", path: "/teacher/assignments" },
    { label: "Completion", val: `${stats.completionRate}%`, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", path: "/teacher/analytics" },
  ];

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-slate-200" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing Workspace</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 p-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <button 
            key={i} 
            onClick={() => navigate(stat.path)}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
               <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-4xl font-black ${stat.color} tracking-tighter`}>{stat.val}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed Area */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] p-8 border border-slate-100 min-h-[450px] flex flex-col items-center justify-center relative overflow-hidden">
          <div className="text-center z-10">
            <Sparkles className="mx-auto text-slate-200 mb-4" size={40} />
            <h2 className="text-slate-900 font-black uppercase tracking-tight text-xl">Clean Slate</h2>
            <p className="text-slate-400 font-bold text-sm italic mt-1">No recent submissions found</p>
          </div>
          {/* Subtle Aesthetic Elements */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-50" />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <button 
            onClick={() => navigate("/teacher/assignments/create")}
            className="group w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-indigo-600 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
          >
            <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
            Create Assignment
          </button>

          <button 
            onClick={() => navigate("/teacher/classes")}
            className="w-full py-8 bg-white text-slate-900 border border-slate-100 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-sm hover:bg-slate-50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
          >
            <Calendar size={18} strokeWidth={2} />
            Manage Studios
          </button>
        </div>
      </div>
    </div>
  );
}