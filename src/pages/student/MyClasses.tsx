import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  BookOpen, 
  ChevronRight, 
  Search, 
  Loader2, 
  Layers,
  Sparkles,
  X,
  AlertCircle
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import JoinClass from "./JoinClass";

// --- TYPES ---
interface ClassData {
  id: string;
  name: string;
  instructor?: string;     
  subject_code?: string;   
  total_assignments?: number; 
}

interface Enrollment {
  id: string;
  progress: number;
  classes: ClassData;
}

// Handles Supabase's specific join response shape safely
interface SupabaseEnrollmentResponse {
  id: string;
  progress: number | null;
  classes: {
    id: string;
    name: string;
  } | null;
}

export default function StudentClasses() {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);

  // ── SECURE DATA FETCHING ──
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) {
        setEnrollments([]);
        return;
      }

      // FIX: Changed 'classes!class_id' to use the explicit database constraint 'classes!enrollments_class_id_fkey'
      const { data, error: fetchError } = await supabase
        .from('enrollments')
        .select(`
          id,
          progress,
          classes!enrollments_class_id_fkey (
            id, 
            name
          )
        `)
        .eq('student_id', user.id)
        .returns<SupabaseEnrollmentResponse[]>();

      if (fetchError) throw fetchError;

      // Safely map and filter out any orphaned enrollments (where classes is null)
      const formatted: Enrollment[] = (data || [])
        .filter((item): item is SupabaseEnrollmentResponse & { classes: NonNullable<SupabaseEnrollmentResponse['classes']> } => 
          item.classes !== null
        )
        .map(item => ({
          id: item.id,
          progress: item.progress || 0,
          classes: {
            id: item.classes.id,
            name: item.classes.name,
          }
        }));

      setEnrollments(formatted);
    } catch (err: any) {
      console.error("Fetch Exception:", err);
      setError(err.message || "Failed to load your workspace. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();

    // ── SESSION LISTENER: Purge data immediately on sign-out ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setEnrollments([]); 
        navigate("/login", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchClasses, navigate]);

  // ── MEMOIZED FILTERING ──
  const filteredClasses = useMemo(() => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return enrollments;
    
    return enrollments.filter((item) => 
      item.classes.name.toLowerCase().includes(search) || 
      (item.classes.subject_code || `STUDIO-${item.classes.id.substring(0, 3)}`).toLowerCase().includes(search)
    );
  }, [enrollments, searchQuery]);

  // ── RENDER STATES ──
  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center space-y-6">
        <div className="relative">
          <Loader2 className="animate-spin text-slate-900" size={48} strokeWidth={1} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading Workspace</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-16 space-y-12 animate-in fade-in duration-1000">
      
      {/* ── MINIMALIST HEADER ── */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-full w-fit shadow-sm">
            <Sparkles size={12} className="text-indigo-400" />
            <span className="text-[9px] font-black uppercase tracking-widest">Active Studio</span>
          </div>
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85]">
            Studio<br />Workspace<span className="text-indigo-600">.</span>
          </h1>
          <p className="text-slate-400 font-medium italic text-xl tracking-tight max-w-sm border-l-2 border-slate-100 pl-6">
            Track your progress across architectural modules and creative challenges.
          </p>
        </div>

        {/* ── CONTROLS ── */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative group w-full sm:w-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="FILTER MODULES..."
              className="w-full sm:w-72 pl-14 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none shadow-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setShowJoinModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 hover:bg-indigo-600 shadow-xl shadow-slate-200/50"
          >
            <Plus size={16} /> Join Module
          </button>
        </div>
      </header>

      {/* ── ERROR STATE ── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-800 p-4 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* ── CONTENT GRID ── */}
      {enrollments.length === 0 && !error ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-200 p-12 text-center transition-all">
            <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center shadow-sm mb-8 text-slate-300">
              <Layers size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Workspace is Empty</h2>
            <p className="text-slate-500 text-sm max-w-xs mt-3 mb-10 leading-relaxed">
              Connect to a module using an instructor code to populate your studio workspace.
            </p>
            <button 
              onClick={() => setShowJoinModal(true)}
              className="bg-white border border-slate-200 px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
            >
              Enter Module Code
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredClasses.map((enrollment, index) => (
            <ClassCard 
              key={enrollment.id} 
              data={enrollment.classes} 
              progress={enrollment.progress} 
              index={index}
              onEnter={() => navigate(`/student/assignments?classId=${enrollment.classes.id}`)}
            />
          ))}
        </div>
      )}

      {/* ── JOIN MODAL ── */}
      {showJoinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6 animate-in fade-in duration-200">
           <div className="relative w-full max-w-xl bg-white rounded-[3.5rem] p-10 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setShowJoinModal(false)}
                className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center bg-slate-100/50 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
              <JoinClass 
                onJoinSuccess={() => { 
                  fetchClasses(); 
                  setShowJoinModal(false); 
                }} 
              />
           </div>
        </div>
      )}
    </div>
  );
}

// ── SUB-COMPONENTS ──
function ClassCard({ data, progress, index, onEnter }: { 
  data: ClassData; 
  progress: number; 
  index: number;
  onEnter: () => void;
}) {
  const colors = ["bg-slate-900", "bg-indigo-600", "bg-emerald-600", "bg-rose-600", "bg-amber-600"];
  const themeColor = colors[index % colors.length];

  // Derived fallbacks for missing schema columns
  const displaySubjectCode = data.subject_code || `STUDIO-${data.id.substring(0, 3).toUpperCase()}`;
  const displayInstructor = data.instructor || "Assigned Staff";
  const displayAssignments = data.total_assignments || 0;

  return (
    <div className="group bg-white rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden flex flex-col hover:-translate-y-2">
      <div className={`${themeColor} p-8 flex justify-between items-start h-28`}>
        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] bg-white/20 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
          {displaySubjectCode}
        </span>
        <BookOpen size={22} className="text-white/40 group-hover:rotate-12 transition-transform duration-500" />
      </div>

      <div className="p-8 space-y-8 flex-1 flex flex-col">
        <div className="space-y-3">
          <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tighter uppercase line-clamp-2">
            {data.name}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Instructor: {displayInstructor}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-6 mt-auto">
          <div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{displayAssignments}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Briefs</p>
          </div>
          <div className="pl-6 border-l border-slate-100">
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{progress}%</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Mastery</p>
          </div>
        </div>

        <button 
          onClick={onEnter}
          className="w-full py-5 bg-slate-50 group-hover:bg-slate-900 text-slate-500 group-hover:text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300 flex items-center justify-center gap-3"
        >
          ENTER STUDIO
          <ChevronRight size={16} className="group-hover:translate-x-1.5 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
}