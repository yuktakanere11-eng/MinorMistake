import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useStore } from "../../store";
import { 
  ArrowLeft, 
  History, 
  ExternalLink, 
  MessageSquare, 
  RefreshCcw, 
  FileText,
  Loader2,
  ChevronRight
} from "lucide-react";

export default function SubmissionHistory() {
  const { id } = useParams();
  const user = useStore((s) => s.user);
  const navigate = useNavigate();

  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id && id) {
      fetchHistory();
    }
  }, [id, user?.id]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          *,
          feedback (*),
          assignments ( title )
        `)
        .eq("assignment_id", id)
        .eq("student_id", user.id)
        .order("version", { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (err) {
      console.error("Archive fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="animate-spin text-slate-900" size={32} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-12 pb-32">
      
      {/* HEADER: Version Control UI */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all"
          >
            <ArrowLeft size={14} /> Back to Brief
          </button>
          <div className="space-y-2">
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85]">
              Timeline<span className="text-indigo-600">.</span>
            </h1>
            <p className="text-slate-400 font-medium italic text-lg">
              Iterative History: {versions[0]?.assignments?.title || "Project Archives"}
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate(`/student/assignments/${id}/submit?mode=revision`)}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group"
        >
          <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
          Deploy New Revision
        </button>
      </header>

      {/* VERSION LIST */}
      <div className="relative space-y-8 before:absolute before:left-[31px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
        {versions.length > 0 ? (
          versions.map((v, index) => (
            <div key={v.id} className="relative pl-20 group">
              {/* Timeline Node */}
              <div className={`absolute left-0 w-16 h-16 rounded-2xl border-4 border-white flex items-center justify-center shadow-sm transition-colors duration-500 z-10 ${
                index === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                <span className="text-xs font-black">V{v.version}</span>
              </div>

              <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] hover:border-indigo-100 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-500 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* File Info */}
                <div className="lg:col-span-1 space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Snapshot Date</p>
                    <p className="text-sm font-bold text-slate-900">{new Date(v.created_at).toLocaleDateString()}</p>
                  </div>
                  <a 
                    href={v.file_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group/link hover:bg-slate-900 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-slate-400 group-hover/link:text-white" />
                      <span className="text-[10px] font-black uppercase text-slate-600 group-hover/link:text-white">View Artifact</span>
                    </div>
                    <ExternalLink size={14} className="text-slate-300 group-hover/link:text-white" />
                  </a>
                </div>

                {/* Feedback Section */}
                <div className="lg:col-span-2 bg-slate-50/50 p-6 rounded-3xl border border-slate-100/50 space-y-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MessageSquare size={16} />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Faculty Critiques</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {v.feedback && v.feedback.length > 0 ? (
                      v.feedback.map((f: any) => (
                        <div key={f.id} className="text-xs font-medium text-slate-600 leading-relaxed border-l-2 border-indigo-200 pl-4 py-1">
                          {f.comment}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs italic text-slate-300">No critique logged for this version.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))
        ) : (
          <div className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[4rem] bg-slate-50/20">
            <History size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
              No previous iterations found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}