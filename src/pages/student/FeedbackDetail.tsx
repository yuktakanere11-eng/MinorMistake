import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Sparkles, MessageSquare, 
  Target, Zap, RotateCcw, FileText, ChevronRight 
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

// --- TYPES ---
interface AIFeedback {
  overall?: string;
  strengths?: string[];
  improvements?: string[];
  suggestions?: string[];
  rubric?: Record<string, number>;
}

export default function FeedbackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [ai, setAI] = useState<AIFeedback>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const { data: feedbackData, error } = await supabase
        .from("feedback")
        .select(`
          *,
          submissions (
            *,
            assignments ( title, id )
          )
        `)
        .eq("submission_id", id)
        .single();

      if (error) throw error;

      setData(feedbackData);

      // Safe Parse AI Feedback
      const rawFeedback = feedbackData.comment || "{}";
      try {
        const parsed = JSON.parse(rawFeedback) as AIFeedback;
        setAI(parsed);
      } catch {
        setAI({ overall: rawFeedback });
      }
    } catch (err) {
      console.error("Error fetching detail:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-slate-400 font-black uppercase text-xs tracking-widest">
      Analyzing Critique...
    </div>
  );

  if (!data) return <div className="p-20 text-center">Feedback record not found.</div>;

  const submission = data.submissions;
  const assignment = submission?.assignments;

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-10 animate-in fade-in duration-700">
      
      {/* NAVIGATION & HEADER */}
      <div className="flex flex-col gap-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors w-fit"
        >
          <ArrowLeft size={14} /> Back to Feedback
        </button>
        
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Evaluation Report</p>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            {assignment?.title || "Assignment Detail"}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: PRIMARY ANALYSIS */}
        <div className="lg:col-span-2 space-y-8">
          
          <section className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Executive Summary</h2>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium text-lg italic border-l-4 border-indigo-100 pl-6">
              “{ai.overall || "No summary provided."}”
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeedbackBox 
              title="Key Strengths" 
              items={ai.strengths} 
              icon={<Target className="text-emerald-500" size={18} />} 
              theme="emerald" 
            />
            <FeedbackBox 
              title="Refinement Areas" 
              items={ai.improvements} 
              icon={<Zap className="text-amber-500" size={18} />} 
              theme="amber" 
            />
          </div>

          {/* Corrected logic below - removed the stray 'section>' text */}
          {ai.suggestions && ai.suggestions.length > 0 && (
            <section className="bg-slate-900 text-white rounded-[2.5rem] p-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                <RotateCcw size={14} /> Actionable Next Steps
              </h3>
              <ul className="space-y-4">
                {ai.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-4 items-start text-slate-300 text-sm font-medium">
                    <span className="text-indigo-400 font-black">0{i+1}.</span> {s}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: METRICS & ACTIONS */}
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 text-center space-y-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Final Grade</p>
            <div className="text-7xl font-black text-slate-900 tracking-tighter">
              {submission?.grade || "-"}
            </div>
            <div className="pt-4 border-t border-slate-50">
              <p className="text-[10px] font-black text-emerald-500 uppercase">Assessment Complete</p>
            </div>
          </div>

          {ai.rubric && (
            <div className="bg-slate-50 rounded-[2rem] p-8 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Rubric Metrics</h3>
              <div className="space-y-4">
                {Object.entries(ai.rubric).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-slate-500">{key}</span>
                      <span className="text-slate-900">{value}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-900" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {submission?.files?.[0] && (
              <a 
                href={submission.files[0]} 
                target="_blank" 
                rel="noreferrer"
                className="w-full h-14 bg-white border border-slate-100 flex items-center justify-center gap-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                <FileText size={16} /> Source Materials
              </a>
            )}
            
            <button
              onClick={() => navigate(`/student/assignments/${submission?.assignment_id}/submit?mode=revision`)}
              className="w-full h-14 bg-slate-900 text-white flex items-center justify-center gap-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
            >
              <RotateCcw size={16} /> Submit New Version
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- SUBCOMPONENT ---

function FeedbackBox({ title, items, icon, theme }: any) {
  const bgMap: any = {
    emerald: "bg-emerald-50/50 border-emerald-100",
    amber: "bg-amber-50/50 border-amber-100",
  };

  return (
    <div className={`p-8 rounded-[2rem] border ${bgMap[theme] || "bg-slate-50"}`}>
      <div className="flex items-center gap-3 mb-6">
        {icon}
        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">{title}</h3>
      </div>
      <ul className="space-y-3">
        {(items || []).map((s: string, i: number) => (
          <li key={i} className="text-xs font-bold text-slate-600 leading-relaxed flex gap-2">
            <span className="text-slate-300">•</span> {s}
          </li>
        ))}
      </ul>
    </div>
  );
}