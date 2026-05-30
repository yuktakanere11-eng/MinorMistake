import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, NavigateFunction } from "react-router-dom";
import { PieChart, Pie, Cell } from "recharts";
import { 
  Sparkles, MessageSquareQuote, BookOpenText, 
  Loader2, ChevronRight, AlertCircle 
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

// --- TYPES & INTERFACES ---
interface FeedbackItem {
  id: string;
  submission_id: string;
  assignment_title: string;
  class_name: string;
  type: string;
  due_date: string;
  graded_date: string;
  score: number;
  grade: string;
  total_possible: number;
  feedback_text: string;
}

// --- MAIN COMPONENT ---
export default function StudentFeedback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState<string>("newest");
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);

  // ── DECOUPLED RELATIONAL PIPELINE ENGINE ──
  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFeedback([]);
        return;
      }

      // STEP 1: Fetch student submissions explicitly to secure data tenancy
      const { data: subsData, error: subsError } = await supabase
        .from("submissions")
        .select("id, score, created_at, assignment_id, student_id")
        .eq("student_id", user.id);

      if (subsError) throw subsError;
      if (!subsData || subsData.length === 0) {
        setFeedback([]);
        return;
      }

      // Map submissions for instant identifier lookups
      const submissionIds = subsData.map(s => s.id);
      const subsMap = subsData.reduce<Record<string, typeof subsData[0]>>((acc, sub) => {
        acc[sub.id] = sub;
        return acc;
      }, {});

      // STEP 2: Fetch feedback collections belonging to these specific submissions
      // SAFE QUERY: Only requesting columns verified to exist in the database
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("id, submission_id, summary, created_at")
        .in("submission_id", submissionIds);

      if (feedbackError) throw feedbackError;
      if (!feedbackData || feedbackData.length === 0) {
        setFeedback([]);
        return;
      }

      // STEP 3: Batch lookup assignments to resolve structural mapping definitions
      const assignmentIds = [...new Set(subsData.map(s => s.assignment_id).filter(Boolean))];
      const assignmentsMap: Record<string, any> = {};
      const classesMap: Record<string, any> = {};

      if (assignmentIds.length > 0) {
        // SAFE QUERY: Removed 'type' column to prevent 400 Bad Request / 42703 error
        const { data: assignmentsData, error: assignErr } = await supabase
          .from("assignments")
          .select("id, title, due_date, points_possible, class_id")
          .in("id", assignmentIds);

        if (assignErr) throw assignErr;

        if (assignmentsData) {
          assignmentsData.forEach(a => { assignmentsMap[a.id] = a; });
          
          // STEP 4: Resolve classroom entities from processed assignments
          const classIds = [...new Set(assignmentsData.map(a => a.class_id).filter(Boolean))];
          if (classIds.length > 0) {
            const { data: classesData, error: classErr } = await supabase
              .from("classes")
              .select("id, name")
              .in("id", classIds);
            
            if (!classErr && classesData) {
              classesData.forEach(c => { classesMap[c.id] = c; });
            }
          }
        }
      }

      // STEP 5: Stitch flat database models cleanly together without data mutations
      const formatted: FeedbackItem[] = feedbackData.map(item => {
        const sub = subsMap[item.submission_id];
        const assignment = sub?.assignment_id ? assignmentsMap[sub.assignment_id] : null;
        const cls = assignment?.class_id ? classesMap[assignment.class_id] : null;
        
        const points = assignment?.points_possible ?? 100;
        const score = sub?.score ?? 0;
        
        // Division-by-zero protection prevents application state corruptions
        const percentage = points > 0 ? Math.round((score / points) * 100) : 0;
        
        let grade = "D";
        if (percentage >= 90) grade = "A";
        else if (percentage >= 80) grade = "B";
        else if (percentage >= 70) grade = "C";

        return {
          id: item.id,
          submission_id: item.submission_id,
          assignment_title: assignment?.title || "Untitled Assignment",
          class_name: cls?.name || "Creative Studio",
          type: "Submission", // Hardcoded fallback since 'type' is not in the db table
          due_date: assignment?.due_date || item.created_at,
          graded_date: item.created_at || new Date().toISOString(),
          score: score,
          grade: grade,
          total_possible: points,
          feedback_text: item.summary || "No written assessment comments provided."
        };
      });

      setFeedback(formatted);
    } catch (err: any) {
      console.error("Critique Sync Pipeline Error:", err);
      setError(err.message || "An exception occurred while syncing relational data maps.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setFeedback([]); 
        navigate("/login", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchFeedback, navigate]);

  const sortedFeedback = useMemo(() => {
    return [...feedback].sort((a, b) => {
      const dateA = new Date(a.graded_date).getTime();
      const dateB = new Date(b.graded_date).getTime();
      return activeSort === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [feedback, activeSort]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} retryAction={fetchFeedback} />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-16 animate-in fade-in duration-500">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full w-fit">
            <Sparkles size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">Critique Archive</span>
          </div>
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85]">
            Faculty<br />Feedback<span className="text-indigo-600">.</span>
          </h1>
          <p className="text-slate-400 font-medium italic text-xl tracking-tight max-w-sm border-l-2 border-slate-100 pl-6">
            Review professional assessments and iterate on your creative modules.
          </p>
        </div>
        
        <div className="relative group w-full md:w-64">
          <select 
            value={activeSort} 
            onChange={(e) => setActiveSort(e.target.value)}
            className="w-full h-14 pl-8 pr-12 bg-white border border-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl appearance-none outline-none focus:ring-8 focus:ring-slate-50 transition-all shadow-sm cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
            <ChevronRight size={16} className="rotate-90" />
          </div>
        </div>
      </div>

      {/* ── FEEDBACK CARDS LIST ── */}
      <div className="space-y-8">
        {sortedFeedback.length > 0 ? (
          sortedFeedback.map((item) => (
            <FeedbackCard key={item.id} item={item} onNavigate={navigate} />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function FeedbackCard({ item, onNavigate }: { item: FeedbackItem; onNavigate: NavigateFunction }) {
  return (
    <div className="group relative bg-white border border-slate-50 rounded-[3.5rem] p-10 flex flex-col lg:flex-row items-center gap-12 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] transition-all duration-700">
      <GradeDonut grade={item.grade} percentage={(item.score / item.total_possible) * 100} />

      <div className="flex-1 space-y-8 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-md">
                {item.type}
              </span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                {item.class_name}
              </span>
            </div>
            <h3 className="font-black text-slate-900 text-3xl tracking-tighter uppercase leading-none group-hover:text-indigo-600 transition-colors">
              {item.assignment_title}
            </h3>
          </div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] tabular-nums pt-2">
            {new Date(item.graded_date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <div className="relative bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-50 group-hover:bg-white group-hover:border-indigo-100 transition-all duration-500">
          <MessageSquareQuote size={24} className="absolute -left-3 -top-3 text-white fill-indigo-500" />
          <p className="text-slate-600 text-lg font-medium leading-relaxed italic pr-4">
            {item.feedback_text}
          </p>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={() => onNavigate(`/student/feedback/${item.submission_id}`)}
            className="group/btn flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 hover:text-indigo-600 transition-colors"
          >
            View Analysis Report 
            <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover/btn:border-indigo-600 group-hover/btn:bg-indigo-600 group-hover/btn:text-white transition-all">
              <ChevronRight size={14} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function GradeDonut({ grade, percentage }: { grade: string; percentage: number }) {
  const safePercent = isNaN(percentage) || percentage < 0 ? 0 : Math.min(percentage, 100);
  
  const color = useMemo(() => {
    if (grade === "A") return "#10b981";
    if (grade === "B") return "#6366f1";
    if (grade === "C") return "#f59e0b";
    return "#ef4444";
  }, [grade]);

  const data = useMemo(() => [
    { value: safePercent }, 
    { value: 100 - safePercent }
  ], [safePercent]);

  return (
    <div className="relative w-40 h-40 shrink-0 group-hover:scale-105 transition-transform duration-700">
      <PieChart width={160} height={160}>
        <Pie 
          data={data} cx={80} cy={80} 
          innerRadius={55} outerRadius={70} 
          paddingAngle={0} stroke="none"
          startAngle={90} endAngle={450}
          dataKey="value"
        >
          <Cell fill={color} />
          <Cell fill="#f8fafc" />
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-6xl font-black text-slate-900 tracking-tighter leading-none">{grade}</p>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{Math.round(safePercent)}%</p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-6">
      <Loader2 className="animate-spin text-slate-900" size={48} strokeWidth={1} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Archiving Critiques</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-40 text-center border-2 border-dashed border-slate-100 rounded-[5rem] bg-slate-50/30">
      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
        <BookOpenText className="text-slate-200" size={32} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">No Critiques Found</h2>
      <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2 font-medium">
        Your archive is currently empty. Feedback will appear here once your submissions are graded.
      </p>
    </div>
  );
}

function ErrorState({ message, retryAction }: { message: string; retryAction: () => void }) {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-6 max-w-md mx-auto text-center px-4">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-sm">
        <AlertCircle size={28} />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Sync Pipeline Connection Interrupted</h2>
        <p className="text-slate-400 text-sm font-medium leading-relaxed">{message}</p>
      </div>
      <button 
        onClick={retryAction} 
        className="px-6 h-12 border border-slate-200 hover:border-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
      >
        Retry Fetch Connection
      </button>
    </div>
  );
}