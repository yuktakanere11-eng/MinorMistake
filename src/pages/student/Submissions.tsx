import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { 
  TrendingUp, Search, MessageCircle, 
  Loader2, CheckCircle2, Clock, Inbox, AlertCircle
} from "lucide-react";

// --- TYPES ---
interface Submission {
  id: string;
  assignment_id: string;
  title: string;
  class_name: string;
  submitted_at: string;
  status: 'Graded' | 'Reviewing' | 'Processing';
  score?: number;
  total_points?: number;
}

export default function StudentSubmissions() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ avg: 0, count: 0 });

  // ── SECURE ARCHIVE FETCHING ──
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubmissions([]);
        return;
      }

      // FIX APPLIED HERE: Added '!submissions_assignment_id_fkey' to resolve the PGRST200 ambiguity error.
      const { data, error: supabaseError } = await supabase
        .from('submissions')
        .select(`
          id, 
          assignment_id, 
          status, 
          score, 
          submitted_at,
          assignments!submissions_assignment_id_fkey ( 
            title, 
            points_possible, 
            classes ( name ) 
          )
        `)
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      const formatted: Submission[] = (data || []).map((s: any) => {
        const rawStatus = (s.status || 'processing').toLowerCase();
        let displayStatus: 'Graded' | 'Reviewing' | 'Processing' = 'Processing';
        
        if (rawStatus === 'graded' || rawStatus === 'success') displayStatus = 'Graded';
        else if (rawStatus === 'reviewing' || rawStatus === 'review') displayStatus = 'Reviewing';

        // Safely extract nested relational data returned by Supabase
        const assignmentData = Array.isArray(s.assignments) ? s.assignments[0] : s.assignments;
        const classData = assignmentData?.classes 
          ? (Array.isArray(assignmentData.classes) ? assignmentData.classes[0] : assignmentData.classes) 
          : null;

        return {
          id: s.id,
          assignment_id: s.assignment_id,
          title: assignmentData?.title || "Untitled Task",
          class_name: classData?.name || "General Studio",
          submitted_at: s.submitted_at 
            ? new Date(s.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Pending Sync',
          status: displayStatus,
          score: s.score != null ? Number(s.score) : undefined,
          total_points: assignmentData?.points_possible || 100,
        };
      });

      const gradedItems = formatted.filter(s => s.status === 'Graded' && s.score !== undefined);
      const avgGpa = gradedItems.length > 0 
        ? Math.round(gradedItems.reduce((acc, s) => acc + ((s.score! / s.total_points!) * 100), 0) / gradedItems.length)
        : 0;

      setStats({ avg: avgGpa, count: formatted.length });
      setSubmissions(formatted);

    } catch (err: any) {
      console.error("Submission Sync Pipeline Exception:", err);
      setError(err.message || "Failed to establish connection to archive records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => {
      const matchesTab = activeTab === 'All' || s.status.toLowerCase() === activeTab.toLowerCase();
      const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.class_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [submissions, activeTab, searchQuery]);

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center bg-white">
      <Loader2 className="animate-spin text-indigo-600" size={40} strokeWidth={1.5} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-10 bg-white min-h-screen animate-in fade-in duration-700">
      
      {error && (
        <div className="mb-10 flex flex-col sm:flex-row items-center gap-4 p-6 bg-red-50 border border-red-200 rounded-[2rem] text-red-700 shadow-sm">
          <div className="flex items-center gap-3 w-full">
            <AlertCircle size={24} className="shrink-0 text-red-500" />
            <p className="text-xs font-bold uppercase tracking-wide leading-relaxed">{error}</p>
          </div>
          <button 
            onClick={fetchSubmissions}
            className="sm:ml-auto w-full sm:w-auto bg-red-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-md shadow-red-200"
          >
            Retry Sync
          </button>
        </div>
      )}

      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              Archives<span className="text-indigo-600">.</span>
            </h1>
            <span className="bg-slate-100 text-slate-500 px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
              {stats.count} Total
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatusChip label="Graded" color="bg-emerald-500" />
            <StatusChip label="Reviewing" color="bg-indigo-500" />
            <StatusChip label="Processing" color="bg-amber-500" />
          </div>
        </div>

        <button 
          onClick={() => navigate('/student/analytics')}
          className="group relative bg-slate-900 p-8 rounded-[3rem] text-white flex items-center gap-10 hover:scale-[1.01] transition-all duration-500 shadow-2xl shadow-slate-200 w-full lg:w-auto"
        >
          <div className="text-left">
            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-2">Performance Avg</p>
            <p className="text-5xl font-black tracking-tighter tabular-nums">
              {stats.avg}<span className="text-indigo-500 ml-1">%</span>
            </p>
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white group-hover:bg-indigo-600 transition-colors duration-500 shrink-0">
            <TrendingUp size={28} />
          </div>
        </button>
      </header>

      <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
        <div className="flex flex-wrap gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full md:w-auto">
          {['All', 'Graded', 'Reviewing', 'Processing'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-initial px-6 lg:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === tab 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input 
            type="text" 
            placeholder="FILTER BY TITLE OR MODULE..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-50/50 transition-all"
          />
        </div>
      </div>

      <div className="space-y-6">
        {!error && filteredSubmissions.length > 0 ? (
          filteredSubmissions.map((sub) => (
            <SubmissionCard key={sub.id} sub={sub} />
          ))
        ) : !error && (
          <div className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[4rem] bg-slate-50/30">
            <Inbox className="mx-auto text-slate-200 mb-6" size={64} strokeWidth={1} />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em]">
              No results found in {activeTab} directory
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SubmissionCard({ sub }: { sub: Submission }) {
  const navigate = useNavigate();
  const isGraded = sub.status === 'Graded';
  
  return (
    <div className="group bg-white border border-slate-100 p-8 rounded-[3rem] flex flex-col lg:flex-row items-center justify-between gap-10 hover:border-indigo-100 hover:shadow-[0_30px_65px_-10px_rgba(79,70,229,0.06)] transition-all duration-700">
      <div className="flex flex-col sm:flex-row items-center gap-8 w-full">
        <div className={`w-20 h-20 shrink-0 rounded-[2rem] flex items-center justify-center transition-transform duration-700 group-hover:scale-105 ${
          isGraded ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'
        }`}>
          {isGraded ? <CheckCircle2 size={30} strokeWidth={1.5} /> : <Clock size={30} strokeWidth={1.5} />}
        </div>

        <div className="space-y-2 text-center sm:text-left w-full">
          <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors">
            {sub.title}
          </h3>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span className="text-indigo-500 font-black">{sub.class_name}</span>
            <span className="w-1.5 h-1.5 bg-slate-200 rounded-full hidden sm:block" />
            <span>Logged: {sub.submitted_at}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between lg:justify-end w-full lg:w-auto gap-10 lg:gap-14 border-t lg:border-t-0 border-slate-50 pt-6 lg:pt-0">
        <div className="text-center sm:text-right min-w-[120px]">
          <span className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
            isGraded ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>
            {sub.status}
          </span>
          <div className="mt-4">
            {isGraded ? (
              <p className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">
                {sub.score}<span className="text-slate-300 text-xl font-bold ml-0.5">/{sub.total_points}</span>
              </p>
            ) : (
              <p className="text-[10px] font-black text-slate-300 uppercase italic tracking-[0.2em] py-2">In Evaluation</p>
            )}
          </div>
        </div>

        <div className="flex flex-row sm:flex-col gap-3 w-full sm:w-auto min-w-[180px]">
          <button 
            onClick={() => navigate(`/student/feedback/${sub.id}`)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all duration-300 shadow-xl shadow-slate-100"
          >
            <MessageCircle size={14} /> View Critique
          </button>
          <button className="flex-1 sm:flex-initial flex items-center justify-center gap-3 px-6 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-slate-800 transition-all">
            Source Canvas
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ label, color }: { label: string, color: string }) {
  return (
    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
      <div className={`w-1.5 h-1.5 rounded-full ${color} animate-pulse`} />
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</span>
    </div>
  );
}