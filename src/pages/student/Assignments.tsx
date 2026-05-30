import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { 
  Search, 
  FileText, 
  Loader2, 
  Inbox,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Link2
} from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  class_id: string;
  created_at: string;
  points_possible?: number;
  classes?: {
    name: string;
  };
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debugStatus, setDebugStatus] = useState<{
    profileFound: boolean;
    classIdsFound: string[];
    error: string | null;
  }>({ profileFound: false, classIdsFound: [], error: null });

  const navigate = useNavigate();

  // ── SECURE DISPATCH PIPELINE ──
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setDebugStatus({ profileFound: false, classIdsFound: [], error: null });

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setAssignments([]); 
        setLoading(false);
        navigate("/login", { replace: true });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, class_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      const hasProfile = !!profile;
      let targetClassIds: string[] = [];

      if (profile && profile.class_name) {
        const studentClassName = profile.class_name.trim().toUpperCase();
        
        const { data: classesByName, error: classMatchError } = await supabase
          .from("classes")
          .select("id")
          .ilike("name", studentClassName);

        if (!classMatchError && classesByName) {
          classesByName.forEach(c => targetClassIds.push(c.id));
        }
      }

      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("class_id")
        .eq("student_id", user.id);

      if (!enrollError && enrollments) {
        enrollments.forEach(e => targetClassIds.push(e.class_id));
      }

      const uniqueClassIds = Array.from(new Set(targetClassIds));
      setDebugStatus(prev => ({
        ...prev,
        profileFound: hasProfile,
        classIdsFound: uniqueClassIds
      }));

      // Explicitly targeted relationship constraint route via '!class_id'
      let assignmentsQuery = supabase
        .from("assignments")
        .select(`
          id, title, class_id, created_at, points_possible,
          classes!class_id ( name )
        `);

      const normalizedClassName = profile?.class_name?.trim().toUpperCase();
      
      if (normalizedClassName !== "GENERAL") {
        if (uniqueClassIds.length === 0) {
          setAssignments([]);
          setLoading(false);
          return;
        }
        assignmentsQuery = assignmentsQuery.in("class_id", uniqueClassIds);
      }

      const { data: assignmentsData, error: assignmentError } = await assignmentsQuery
        .order("created_at", { ascending: false });

      if (assignmentError) throw assignmentError;

      const formattedAssignments: Assignment[] = (assignmentsData || []).map((a: any) => {
        const singleClass = Array.isArray(a.classes) ? a.classes[0] : a.classes;
        return {
          id: a.id,
          title: a.title || "Untitled Brief",
          class_id: a.class_id,
          created_at: a.created_at,
          points_possible: a.points_possible,
          classes: singleClass ? { name: singleClass.name } : undefined
        };
      });

      setAssignments(formattedAssignments);

    } catch (err: any) {
      console.error("Critical block exception matching curriculum profiles:", err);
      const errString = err.message || err.details || err.hint || "Internal Context Breakdown";
      setDebugStatus(prev => ({ 
        ...prev, 
        error: err.code ? `[Postgres Code ${err.code}] ${errString}` : errString 
      }));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAssignments();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAssignments([]);
        navigate("/login", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAssignments, navigate]);

  const filteredData = useMemo(() => {
    return assignments.filter((a) =>
      a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.classes?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assignments, searchQuery]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} strokeWidth={1.5} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
          Accessing Vault
        </span>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-8 py-16 space-y-16 pb-40 animate-in fade-in duration-1000">
      
      {debugStatus.error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-[2rem] flex items-start gap-4 text-red-700 shadow-sm">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider">System Pipeline Blocked</h4>
            <p className="text-[11px] font-mono mt-1 opacity-90 leading-relaxed">{debugStatus.error}</p>
          </div>
          <button 
            onClick={fetchAssignments}
            className="ml-auto bg-red-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
          >
            Re-Sync
          </button>
        </div>
      )}

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-full shadow-sm">
            <ShieldCheck size={12} className="text-indigo-400" />
            <span className="text-[9px] font-black uppercase tracking-widest">Secure Archive</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-8xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8]">
              Vault<span className="text-indigo-600">.</span>
            </h1>
            <p className="text-slate-400 font-medium italic text-xl tracking-tight max-w-md">
              A curated repository of architectural briefs and academic challenges.
            </p>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="FILTER ARCHIVES..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-14 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-[11px] font-black uppercase tracking-widest focus:ring-8 focus:ring-slate-50 focus:border-slate-200 outline-none w-full md:w-80 shadow-sm transition-all"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {filteredData.length > 0 ? (
          filteredData.map((a) => (
            <div 
              key={a.id} 
              className="group relative bg-white border border-slate-100 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between hover:border-indigo-200 hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-700"
            >
              <div className="flex flex-col sm:flex-row items-center gap-8 flex-1 w-full text-center sm:text-left">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-700 shadow-inner shrink-0">
                  <FileText size={32} strokeWidth={1.5} />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      {a.classes?.name || "General Track"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest tabular-nums">
                      Ref: {a.id.split('-')[0]}
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                    {a.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-8 md:mt-0 relative z-10 w-full md:w-auto">
                <button 
                  onClick={() => navigate(`/student/assignments/${a.id}`)}
                  className="group/btn flex-1 md:flex-initial flex items-center justify-center gap-3 px-8 py-5 bg-slate-50 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all duration-500"
                >
                  View Brief
                  <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
                
                <button 
                  onClick={() => navigate(`/student/assignments/${a.id}/submit`)}
                  className="flex-1 md:flex-initial px-8 py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                >
                  Submit
                </button>
              </div>

              <span className="absolute right-12 bottom-4 text-[60px] font-black text-slate-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none italic">
                OPEN
              </span>
            </div>
          ))
        ) : !debugStatus.error && debugStatus.classIdsFound.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border-4 border-dashed border-slate-100 rounded-[5rem] bg-white animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mb-6 text-amber-500">
              <Link2 size={32} strokeWidth={1.5} />
            </div>
            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-800">
              Workspace Disconnected
            </p>
            <p className="text-slate-400 text-xs font-medium text-center max-w-sm mt-2 leading-relaxed px-6">
              Your profile is authenticated but isn't enrolled in an active studio class track. Use your workspace token to link modules.
            </p>
          </div>
        ) : !debugStatus.error && (
          <div className="flex flex-col items-center justify-center py-40 border-4 border-dashed border-slate-50 rounded-[5rem] bg-slate-50/30">
            <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-sm mb-6 text-slate-200">
              <Inbox size={32} strokeWidth={1.5} />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">
              The archive is silent
            </p>
          </div>
        )}
      </div>
    </div>
  );
}