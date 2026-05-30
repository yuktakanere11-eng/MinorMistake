import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import { 
  Search, 
  Download, 
  MessageSquare, 
  Loader2, 
  Calendar, 
  Star, 
  Filter, 
  ArrowUpRight,
  AlertCircle
} from "lucide-react";

// UPDATED: Added relational type mapping for profiles table
interface FeedbackEntry {
  id: string;
  compiled_feedback_text?: string; 
  score?: string | number;
  created_at: string;
  teacher_id: string; 
  student_id?: string;
  profiles?: {
    name?: string;
    full_name?: string;
  } | null;
}

type FilterOption = "Recent" | "Highest Score" | "Lowest Score";

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterOption>("Recent");

  useEffect(() => {
    fetchFeedback();
  }, []); 

  async function fetchFeedback() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("No authenticated user found.");

      // UPDATED: Fetching details relationally from profiles table using student_id foreign key
      const { data, error: fetchError } = await supabase
        .from("feedback") 
        .select(`
          *,
          profiles!student_id (
            name,
            full_name
          )
        `)
        .eq("teacher_id", user.id) 
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      
      setFeedback(data || []);
    } catch (err: any) {
      console.error("Error fetching feedback:", err);
      setError(err.message || "Failed to load feedback records.");
    } finally {
      setLoading(false);
    }
  }

  const filteredFeedback = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();
    
    let result = feedback.filter(entry => {
      if (!searchLower) return true;
      
      // UPDATED: Safely search using relational name items
      const studentName = entry.profiles?.name || entry.profiles?.full_name || "";
      const safeName = studentName.toLowerCase();
      const safeText = (entry.compiled_feedback_text || "").toLowerCase();
      
      return safeName.includes(searchLower) || safeText.includes(searchLower);
    });

    return result.sort((a, b) => {
      if (filter === "Highest Score") {
        const scoreA = parseFloat(a.score as string) || 0;
        const scoreB = parseFloat(b.score as string) || 0;
        return scoreB - scoreA;
      }
      if (filter === "Lowest Score") {
        const scoreA = parseFloat(a.score as string) || 0;
        const scoreB = parseFloat(b.score as string) || 0;
        return scoreA - scoreB;
      }
      
      const timeA = new Date(a.created_at).getTime() || 0;
      const timeB = new Date(b.created_at).getTime() || 0;
      return timeB - timeA;
    });
  }, [feedback, searchQuery, filter]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown Date";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      
      return new Intl.DateTimeFormat("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric" 
      }).format(date);
    } catch {
      return "Invalid Date";
    }
  };

  const exportData = () => {
    if (feedback.length === 0) return;

    const headers = "Date,Student,Score,Feedback\n";
    const csvContent = feedback.map(f => {
      const date = formatDate(f.created_at);
      // UPDATED: Export name from profile object properties
      const student = f.profiles?.name || f.profiles?.full_name || "Unknown Student";
      const score = f.score || "N/A";
      const rawText = f.compiled_feedback_text || ""; 
      const safeText = rawText.replace(/"/g, '""').replace(/\n/g, " "); 
      
      return `"${date}","${student}","${score}","${safeText}"`;
    }).join("\n");
    
    const blob = new Blob([headers + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.setAttribute("download", `studio_feedback_archive_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filterOptions: FilterOption[] = ["Recent", "Highest Score", "Lowest Score"];

  return (
    <div className="p-10 bg-slate-50 min-h-screen font-sans overflow-y-auto w-full">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Archive</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
            <MessageSquare size={14} className="text-purple-600" /> 
            {feedback.length} Records Logged
          </p>
        </div>

        <button 
          onClick={exportData}
          disabled={feedback.length === 0 || loading}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-purple-600 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:bg-slate-900 disabled:hover:translate-y-0"
        >
          <Download size={16} /> Export Archive
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-grow group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="SEARCH RECORDS BY NAME OR CONTENT..." 
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] text-[11px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-purple-600/5 focus:border-purple-600 transition-all shadow-sm placeholder:text-slate-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {filterOptions.map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                filter === f 
                  ? "bg-purple-50 text-purple-700 border-purple-100" 
                  : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-purple-600" size={40} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Retrieving Archive</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-[3rem] border border-red-100 p-12 flex flex-col items-center justify-center text-center min-h-[400px] shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Connection Error</h2>
          <p className="text-sm font-medium text-red-500 mt-2 max-w-md">{error}</p>
        </div>
      ) : filteredFeedback.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-slate-100 p-24 flex flex-col items-center justify-center text-center min-h-[400px] shadow-sm relative overflow-hidden">
          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6 z-10">
            <Filter size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter z-10">No records found</h2>
          <p className="text-sm font-bold text-slate-400 mt-2 z-10">Adjust your search or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredFeedback.map((entry) => {
            // UPDATED: Dynamically extract name out of relation entries fallback chain
            const studentName = entry.profiles?.name || entry.profiles?.full_name || "Unknown Student";
            const initial = studentName.charAt(0).toUpperCase();

            return (
              <div 
                key={entry.id} 
                className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center font-black text-sm uppercase">
                      {initial}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">
                        {studentName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                        <Calendar size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">
                          {formatDate(entry.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {entry.score && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg">
                      <Star size={12} className="fill-purple-700" />
                      <span className="text-[11px] font-black">{entry.score}</span>
                    </div>
                  )}
                </div>

                <div className="flex-grow">
                  <p className="text-sm font-medium text-slate-600 leading-relaxed line-clamp-4">
                    {entry.compiled_feedback_text 
                      ? `"${entry.compiled_feedback_text}"` 
                      : "No feedback text provided."}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50">
                  <button className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-purple-600 transition-colors flex items-center gap-2 group/btn">
                    View Full Report 
                    <ArrowUpRight size={14} className="group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}