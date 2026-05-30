import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Loader2, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Filter
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

interface Submission {
  id: string;
  status: string;
  created_at: string;
  assignment_name?: string;
  student_id: string;
  assignments?: { title: string } | null;
  profiles?: { first_name: string; last_name: string; email: string } | null;
  students?: { name: string } | null;
}

export default function Submissions() {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filtered, setFiltered] = useState<Submission[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [search, statusFilter, submissions]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("submissions")
        .select(`
          id,
          status,
          created_at,
          assignment_name,
          student_id,
          assignments ( title ),
          profiles ( first_name, last_name, email ),
          students ( name )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // FIX: Map and normalize arrays down to single objects before updating state
      const normalizedData: Submission[] = (data || []).map((item: any) => ({
        id: item.id,
        status: item.status,
        created_at: item.created_at,
        assignment_name: item.assignment_name,
        student_id: item.student_id,
        assignments: Array.isArray(item.assignments) ? item.assignments[0] : item.assignments,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
        students: Array.isArray(item.students) ? item.students[0] : item.students,
      }));

      setSubmissions(normalizedData);
    } catch (err) {
      console.error("Error aggregating studio deliverables:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    let targetData = [...submissions];

    // 1. Filter by Status Tab Selection
    if (statusFilter !== "all") {
      targetData = targetData.filter((s) => s.status?.toLowerCase() === statusFilter);
    }

    // 2. Filter by Search Query
    if (search.trim() !== "") {
      const query = search.toLowerCase();
      targetData = targetData.filter((s) => {
        const studentName = s.students?.name || 
          (s.profiles ? `${s.profiles.first_name || ""} ${s.profiles.last_name || ""}` : "") || 
          `Member #${s.student_id.slice(0, 5)}`;
        
        const assignmentLabel = s.assignments?.title || s.assignment_name || "";

        return (
          studentName.toLowerCase().includes(query) ||
          assignmentLabel.toLowerCase().includes(query)
        );
      });
    }

    setFiltered(targetData);
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case "reviewed":
      case "graded":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "reviewing":
        return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "processing":
      case "submitted":
      default:
        return "bg-amber-50 text-amber-600 border-amber-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-indigo-600" size={36} />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Synchronizing Repository Ledger...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER ACTION WORKSPACE */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Submissions Log<span className="text-indigo-600">.</span>
          </h1>
          <p className="text-slate-400 font-medium italic text-md tracking-tight">
            Review and evaluate student artifacts across studio modules.
          </p>
        </div>

        {/* SEARCH FILTER CAPABILITY */}
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by designer or project title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium tracking-tight placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mr-2">
          <Filter size={12} /> Segment View:
        </span>
        {["all", "submitted", "reviewing", "reviewed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all
              ${statusFilter === tab 
                ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10" 
                : "bg-white text-slate-400 border-slate-100 hover:text-slate-900 hover:border-slate-300"
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ARCHIVE GRID-TABLE */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-100/40 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 bg-slate-50/70 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div className="col-span-3">Studio Designer</div>
          <div className="col-span-4">Assignment Deliverable</div>
          <div className="col-span-2">Logged Date</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                <FileText size={22} />
              </div>
              <p className="font-bold text-slate-800 text-sm">No matched logs discovered</p>
              <p className="text-xs text-slate-400 max-w-xs font-medium">Try modifying your search query filters or checking alternate operational views.</p>
            </div>
          ) : (
            filtered.map((s) => {
              const resolvedStudentName = s.students?.name || 
                (s.profiles ? `${s.profiles.first_name || ""} ${s.profiles.last_name || ""}`.trim() : "") || 
                `Studio Member (${s.student_id.slice(0, 5)})`;
              
              const resolvedEmail = s.profiles?.email || "Synced via directory";
              const resolvedAssignmentTitle = s.assignments?.title || s.assignment_name || "Untitled Artifact";

              return (
                <div key={s.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-8 py-5 hover:bg-slate-50/40 transition-colors">
                  
                  {/* DESIGNER NAME */}
                  <div className="col-span-1 md:col-span-3 flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-50 text-slate-700 rounded-xl flex items-center justify-center font-black text-xs uppercase shadow-inner shrink-0">
                      {resolvedStudentName.slice(0, 2)}
                    </div>
                    <div className="truncate text-left">
                      <p className="font-black text-slate-900 tracking-tight truncate">{resolvedStudentName}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">{resolvedEmail}</p>
                    </div>
                  </div>

                  {/* ASSIGNMENT TITLE */}
                  <div className="col-span-1 md:col-span-4 text-left min-w-0">
                    <span className="md:hidden text-[9px] font-black text-slate-300 uppercase tracking-wider block mb-0.5">Assignment</span>
                    <p className="font-bold text-slate-800 tracking-tight truncate">{resolvedAssignmentTitle}</p>
                  </div>

                  {/* TIMESTAMP */}
                  <div className="col-span-1 md:col-span-2 text-left">
                    <span className="md:hidden text-[9px] font-black text-slate-300 uppercase tracking-wider block mb-0.5">Submitted</span>
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-300" />
                      {new Date(s.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>

                  {/* STATUS PILL BADGE */}
                  <div className="col-span-1 md:col-span-2 md:text-center flex justify-start md:justify-center">
                    <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${getStatusBadgeStyles(s.status)}`}>
                      {s.status === "reviewed" ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                      {s.status}
                    </span>
                  </div>

                  {/* ACTIONS BUTTON */}
                  <div className="col-span-1 md:col-span-1 flex justify-end">
                    <button
                      onClick={() => navigate(`/teacher/review/${s.id}`)}
                      className={`w-full md:w-auto px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center justify-center gap-2 transition-all active:scale-[0.97]
                        ${s.status === "reviewed"
                          ? "bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-400"
                          : "bg-slate-900 border-slate-900 text-white hover:bg-indigo-600 hover:border-indigo-600 shadow-md shadow-indigo-100"
                        }
                      `}
                    >
                      <Eye size={12} />
                      {s.status === "reviewed" ? "View" : "Review"}
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}