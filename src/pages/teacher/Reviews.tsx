import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { analyzeSubmission } from "../../lib/ai";
import { 
  ChevronLeft, Sparkles, Send, 
  AlertCircle, CheckCircle2, Users, User,
  FileText, Copy, Loader2
} from "lucide-react";

export default function Review() {
  const { id } = useParams(); // submission id
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<any>(null);
  const [aiFeedback, setAiFeedback] = useState<any>(null);
  const [teacherFeedback, setTeacherFeedback] = useState("");
  const [grade, setGrade] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    // We select both students and assignment_groups to handle hybrid scope
    const { data, error } = await supabase
      .from("submissions")
      .select(`
        *,
        students(name),
        assignment_groups(name, id),
        assignments(title, total_points, assignment_scope)
      `)
      .eq("id", id)
      .single();

    if (data) {
      setSubmission(data);
      setTeacherFeedback(data.feedback || "");
      setGrade(data.grade || "");
    }
    setLoading(false);
  };

  const isGroup = submission?.assignments?.assignment_scope === "team";

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      // Analyze based on extracted text content
      const result = await analyzeSubmission(submission.content || "");
      setAiFeedback(result);
    } catch (err) {
      console.error("AI Analysis failed", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const applyAI = () => {
    if (!aiFeedback) return;
    const formatted = `SUMMARY:\n${aiFeedback.summary}\n\nOBSERVATIONS:\n${aiFeedback.mistakes
      .map((m: any) => `• [${m.type}] ${m.comment}`)
      .join("\n")}`;
    setTeacherFeedback(prev => prev ? `${prev}\n\n${formatted}` : formatted);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("submissions")
      .update({
        feedback: teacherFeedback,
        grade: grade === "" ? null : Number(grade),
        status: "Graded",
      })
      .eq("id", id);

    if (!error) {
      navigate(-1);
    } else {
      alert("Error saving: " + error.message);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* LEFT PANEL: PDF VIEWER */}
      <div className="flex-grow relative bg-slate-200 border-r border-slate-100">
        <header className="absolute top-6 left-6 z-10 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white/90 backdrop-blur shadow-xl rounded-2xl hover:text-indigo-600 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="px-4 py-2 bg-white/90 backdrop-blur shadow-xl rounded-xl">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jury View</p>
             <p className="text-xs font-bold text-slate-900">{submission.assignments?.title}</p>
          </div>
        </header>
        
        <iframe
          src={`${submission.file_url}#toolbar=0`}
          className="w-full h-full border-none"
          title="Submission View"
        />
      </div>

      {/* RIGHT PANEL: REVIEW & AI */}
      <div className="w-[450px] bg-white h-screen flex flex-col shadow-2xl overflow-y-auto">
        
        {/* Entity Header */}
        <div className="p-8 border-b border-slate-50">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${isGroup ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {isGroup ? <Users size={16} /> : <User size={16} />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {isGroup ? 'Team Submission' : 'Individual Submission'}
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 leading-none mb-1">
            {isGroup ? submission.assignment_groups?.name : submission.students?.name}
          </h2>
        </div>

        <div className="p-8 space-y-10">
          
          {/* AI ANALYZER BOX */}
          <div className={`rounded-[2rem] p-6 transition-all ${aiFeedback ? 'bg-indigo-600 text-white' : 'bg-slate-50 border border-slate-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className={aiFeedback ? 'text-indigo-200' : 'text-indigo-600'} />
                <h3 className="text-xs font-black uppercase tracking-widest">AI Assistant</h3>
              </div>
              {!aiFeedback && (
                <button 
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50"
                >
                  {analyzing ? "Reading..." : "Run Analysis"}
                </button>
              )}
            </div>

            {aiFeedback ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-xs font-medium leading-relaxed text-indigo-50 italic">"{aiFeedback.summary}"</p>
                <button 
                  onClick={applyAI}
                  className="w-full py-3 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Copy size={14} /> Append to Feedback
                </button>
              </div>
            ) : (
              <p className="text-[10px] font-bold text-slate-400">Run AI to extract key insights and mistakes from this PDF.</p>
            )}
          </div>

          {/* GRADING SECTION */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assignment Score</label>
              <span className="text-[10px] font-black text-slate-300">Max: {submission.assignments?.total_points}</span>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="number"
                value={grade}
                onChange={(e) => setGrade(e.target.valueAsNumber || "")}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-xl font-black focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                placeholder="0"
              />
              <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </div>

          {/* TEACHER FEEDBACK BOX */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brief & Feedback</label>
            <textarea
              value={teacherFeedback}
              onChange={(e) => setTeacherFeedback(e.target.value)}
              className="w-full h-48 px-6 py-6 bg-slate-50 border-none rounded-[2rem] text-sm font-medium leading-relaxed focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all outline-none resize-none"
              placeholder="Write your observation for the student/team..."
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            {saving ? "Publishing..." : "Finalize Review"}
          </button>

        </div>
      </div>
    </div>
  );
}