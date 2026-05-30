import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { 
  Plus, MoreVertical, Calendar, 
  BookOpen, Sparkles, Users, 
  Edit3, Trash2, AlertCircle
} from "lucide-react";

// Explicitly define the shape of your data for better IntelliSense and safety
interface Assignment {
  id: string;
  title: string;
  assignment_scope: string;
  total_students: number;
  submissions_count: number;
  due_date: string;
  classes?: {
    name: string;
  };
}

export default function AssignmentsPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    try {
      setLoading(true);
      setError(null);

      // 1. Get the current logged-in teacher's session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("User not authenticated. Please log in again.");
      }

      // 2. Fetch only assignments belonging to THIS teacher_id
      const { data, error: fetchError } = await supabase
        .from("assignments")
        .select(`
          *,
          classes (
            name
          )
        `)
        .eq("teacher_id", user.id) // SECURE FILTER: Isolation logic
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setAssignments(data || []);

    } catch (err: any) {
      console.error("Error fetching assignments:", err);
      setError(err.message || "Failed to load the assignments. Please try again.");
    } finally {
      // 3. Guarantees the loading spinner turns off
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    const isConfirmed = window.confirm(
      "This will permanently delete this assignment brief from the database. This action cannot be undone. Continue?"
    );

    if (isConfirmed) {
      try {
        const { error } = await supabase
          .from("assignments")
          .delete()
          .eq("id", id);

        if (error) {
          alert("Could not delete. Check if students have already submitted work to this brief.");
          return;
        }

        // Remove from local state immediately for snappy UI
        setAssignments((prev) => prev.filter((a) => a.id !== id));
        setActiveMenuId(null);
      } catch (err) {
        console.error("Delete operation failed:", err);
        alert("An unexpected error occurred while deleting.");
      }
    }
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Sparkles className="h-8 w-8 animate-pulse text-indigo-600" />
          <span className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Syncing Data</span>
        </div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <div className="bg-white rounded-[3rem] border border-red-100 p-12 flex flex-col items-center text-center max-w-md shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Database Error</h2>
          <p className="text-sm font-medium text-red-500 mt-2">{error}</p>
          <button 
            onClick={fetchAssignments}
            className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN UI ---
  return (
    <div className="p-10 bg-slate-50 min-h-screen font-sans">
      {/* Header */}
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">Assignments</h1>
          <div className="h-6 w-[1px] bg-slate-200 mx-2" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100">
            {assignments.length} Total
          </span>
        </div>
        
        <button 
          onClick={() => navigate("/teacher/assignments/create")}
          className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95"
        >
          <Plus size={16} strokeWidth={3} /> Create Assignment
        </button>
      </header>

      {/* Grid */}
      <div className="space-y-4 mb-10">
        {assignments.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
              <BookOpen size={32} />
            </div>
            <p className="text-slate-400 font-black text-sm uppercase tracking-widest">No briefs created yet</p>
          </div>
        ) : (
          assignments.map((assignment) => {
            const isGroup = assignment.assignment_scope === 'team';
            const total = assignment.total_students || 0;
            const subs = assignment.submissions_count || 0;
            const progress = total > 0 ? (subs / total) * 100 : 0;
            
            return (
              <div 
                key={assignment.id} 
                className={`p-6 rounded-[2.5rem] border-2 flex items-center justify-between group transition-all bg-white shadow-sm hover:shadow-md ${
                  isGroup ? "border-purple-50 hover:border-purple-200" : "border-slate-50 hover:border-indigo-100"
                }`}
              >
                <div 
                  className="flex items-center gap-8 flex-grow cursor-pointer"
                  onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
                >
                  <div className={`h-16 w-16 rounded-3xl flex items-center justify-center font-black text-xl transition-all ${
                    isGroup ? "bg-purple-600 text-white" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
                  }`}>
                    {isGroup ? <Users size={24} /> : (assignment.title?.charAt(0) || "A")}
                  </div>
                  
                  <div className="min-w-[280px]">
                    <h3 className="font-black text-slate-900 text-lg tracking-tight">{assignment.title}</h3>
                    <div className="flex items-center gap-5 mt-1">
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <BookOpen size={12} /> {assignment.classes?.name || "Global"}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar size={12} /> {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "TBD"}
                      </span>
                    </div>
                  </div>

                  <div className="flex-grow max-w-[200px] px-4 hidden md:block">
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isGroup ? 'bg-purple-500' : 'bg-indigo-500'}`} 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
                    className="px-6 py-3 bg-slate-50 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                  >
                    Manage
                  </button>
                  
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === assignment.id ? null : assignment.id);
                      }}
                      className={`p-2 rounded-full transition-all ${
                        activeMenuId === assignment.id ? 'bg-slate-100 text-slate-900' : 'text-slate-200 hover:text-slate-500'
                      }`}
                    >
                      <MoreVertical size={20} />
                    </button>

                    {activeMenuId === assignment.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 py-2 overflow-hidden animate-in fade-in zoom-in duration-150">
                          <button
                            onClick={() => navigate(`/teacher/assignments/${assignment.id}/edit`)}
                            className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                          >
                            <Edit3 size={14} /> Edit Brief
                          </button>
                          <div className="h-[1px] bg-slate-50 mx-2" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(assignment.id);
                            }}
                            className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 flex items-center gap-3 transition-colors"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}