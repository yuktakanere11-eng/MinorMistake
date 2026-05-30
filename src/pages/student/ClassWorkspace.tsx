import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ChevronRight, 
  FileText, 
  Loader2, 
  ArrowLeft, 
  Calendar, 
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

// --- TYPES ---
interface Assignment {
  id: string;
  title: string;
  due_date: string;
  type: string;
  status: string;
  grade?: string;
}

export default function StudentAssignments() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState("Module Workspace");

  const fetchClassData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch the Class Name for the header
      const { data: classInfo } = await supabase
        .from('classes')
        .select('name')
        .eq('id', classId)
        .single();
      
      if (classInfo) setClassName(classInfo.name);

      // 2. Fetch Assignments for this class
      // Joining with submissions to get the current student's status
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id, 
          title, 
          due_date, 
          type,
          submissions!left ( status, grade, student_id )
        `)
        .eq('class_id', classId);

      if (error) throw error;

      // 3. Format and Filter for this specific student
      const formatted: Assignment[] = (data as any[]).map(item => {
        const mySub = item.submissions?.find((s: any) => s.student_id === user.id);
        const isLate = !mySub && new Date(item.due_date) < new Date();

        return {
          id: item.id,
          title: item.title,
          due_date: item.due_date,
          type: item.type || "Studio Task",
          status: mySub?.status || (isLate ? "Late" : "Pending"),
          grade: mySub?.grade
        };
      });

      setAssignments(formatted);
    } catch (err) {
      console.error("Assignment Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  const getStatusUI = (status: string) => {
    switch (status.toLowerCase()) {
      case "submitted": return { style: "bg-blue-50 text-blue-600 border-blue-100", icon: <Clock size={12} />, label: "Reviewing" };
      case "graded": return { style: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: <CheckCircle2 size={12} />, label: "Graded" };
      case "late": return { style: "bg-rose-50 text-rose-600 border-rose-100", icon: <AlertCircle size={12} />, label: "Overdue" };
      default: return { style: "bg-slate-50 text-slate-400 border-slate-100", icon: <Calendar size={12} />, label: "Pending" };
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="animate-spin text-slate-900" size={32} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <header className="space-y-6">
        <button 
          onClick={() => navigate('/student/classes')} 
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all"
        >
          <ArrowLeft size={14} /> Back to Studio
        </button>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8]">
            {className}<span className="text-indigo-600">.</span>
          </h1>
          <p className="text-slate-400 font-medium italic text-lg">Active Studio Assignments</p>
        </div>
      </header>

      {/* ASSIGNMENT LIST */}
      <div className="grid gap-4">
        {assignments.length > 0 ? (
          assignments.map((task) => {
            const ui = getStatusUI(task.status);
            return (
              <div 
                key={task.id} 
                className="group bg-white border border-slate-100 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between hover:border-indigo-100 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-500"
              >
                <div className="flex items-center gap-8 flex-1">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-inner">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Due {new Date(task.due_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-6 md:mt-0 w-full md:w-auto justify-between">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${ui.style}`}>
                    {ui.icon} {ui.label}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => navigate(`/student/assignments/view/${task.id}`)}
                      className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => navigate(`/student/assignments/${task.id}/submit`)}
                      className="px-6 py-4 bg-white border border-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-slate-100 rounded-[4rem] bg-slate-50/20 text-center">
            <Inbox size={48} className="text-slate-200 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
              No assignments found for this module
            </p>
          </div>
        )}
      </div>
    </div>
  );
}