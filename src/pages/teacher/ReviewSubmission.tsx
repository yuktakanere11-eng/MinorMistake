import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { GoogleGenAI } from "@google/genai";
import { 
  ChevronLeft, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  User, 
  FileDown, 
  ExternalLink,
  FileText,
  Cpu,
  Edit3,
  Sliders,
  Plus,
  X,
  RefreshCw
} from "lucide-react";

interface MetricItem {
  id: string;
  label: string;
}

export default function ReviewSubmission() {
  const allParams = useParams(); 
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("ai-analysis");
  const [submission, setSubmission] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [assignmentMeta, setAssignmentMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualNotes, setManualNotes] = useState("");
  
  // ── STATEFUL REVIEW METRICS ──
  const [metrics, setMetrics] = useState<MetricItem[]>([
    { id: "layout", label: "Layout & Typography" },
    { id: "branding", label: "Branding & Identity" },
    { id: "business", label: "Business Model & Pitch" },
    { id: "technical", label: "Technical Execution" },
    { id: "sustainability", label: "Material & Sustainability" }
  ]);
  const [selectedFocus, setSelectedFocus] = useState<string[]>(["layout"]);
  
  // Custom execution status systems
  const [newMetricLabel, setNewMetricLabel] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);

  // Engine state pipelines
  const [analyzing, setAnalyzing] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState("");
  const [aiFeedback, setAiFeedback] = useState("");

  useEffect(() => {
    async function fetchSubmissionDetails() {
      try {
        setLoading(true);
        setError(null);

        const targetId = Object.values(allParams)[0];
        if (!targetId || targetId.trim() === "") {
          throw new Error("Could not extract a valid Submission UUID parameter from the browser URL path.");
        }

        const { data: subData, error: subError } = await supabase
          .from("submissions")
          .select("*")
          .eq("id", targetId)
          .maybeSingle();

        if (subError) throw subError;
        if (!subData) {
          throw new Error(`No record found matching ID: ${targetId}.`);
        }

        setSubmission(subData);
        if (subData.manual_notes) setManualNotes(subData.manual_notes);
        
        if (subData.ai_feedback || subData.ai_analysis) {
          setAiFeedback(subData.ai_feedback || subData.ai_analysis);
        }

        // Safely load existing feedback logs 
        try {
          const { data: existingFeedback } = await supabase
            .from("feedback")
            .select("*")
            .eq("submission_id", targetId)
            .maybeSingle();

          if (existingFeedback) {
            if (existingFeedback.summary) setAiFeedback(existingFeedback.summary);
            if (existingFeedback.action_items) setManualNotes(existingFeedback.action_items);
          }
        } catch (fbErr) {
          console.warn("Feedback table column tracking anomaly managed gracefully:", fbErr);
        }

        if (subData.student_id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, name, email")
            .eq("id", subData.student_id)
            .maybeSingle();

          if (profileData) setStudentProfile(profileData);
        }

        if (subData.assignment_id) {
          const { data: assignData } = await supabase
            .from("assignments")
            .select("title")
            .eq("id", subData.assignment_id)
            .maybeSingle();

          if (assignData) setAssignmentMeta(assignData);
        }

      } catch (err: any) {
        console.error("Supabase download bottleneck:", err);
        setError(err.message || "Failed to download asset metadata container.");
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissionDetails();
  }, [allParams]);

  const toggleFocusParameter = (id: string) => {
    setSelectedFocus(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCreateMetric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMetricLabel.trim()) return;

    const generatedId = newMetricLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, "-");
    
    if (metrics.some(m => m.id === generatedId)) {
      alert("This assignment metric already exists within your panel configuration.");
      return;
    }

    const newOption = { id: generatedId, label: newMetricLabel.trim() };
    setMetrics([...metrics, newOption]);
    setSelectedFocus([...selectedFocus, generatedId]);
    setNewMetricLabel("");
    setShowAddInput(false);
  };

  const handleDeleteMetric = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMetrics(metrics.filter(m => m.id !== id));
    setSelectedFocus(selectedFocus.filter(item => item !== id));
  };

  const runAiAnalysisPipeline = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert("Missing Gemini API Key! Please configure VITE_GEMINI_API_KEY inside your local .env file.");
      return;
    }

    if (selectedFocus.length === 0) {
      alert("Please select at least one evaluation parameter focus pill before running the analysis.");
      return;
    }

    try {
      setAnalyzing(true);
      setAiStatusMessage("Preparing artifact payload...");
      
      const ai = new GoogleGenAI({ apiKey });
      const assignmentContextTitle = assignmentMeta?.title || "Industrial Design";
      
      const activeRubrics = metrics
        .filter(opt => selectedFocus.includes(opt.id))
        .map(opt => opt.label)
        .join(", ");

      let contentsPayload: any[] = [];

      if (submission?.file_url) {
        try {
          const fileResponse = await fetch(submission.file_url);
          const blob = await fileResponse.blob();
          
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const isPdf = submission.file_url.toLowerCase().includes(".pdf");
          const mimeType = isPdf ? "application/pdf" : blob.type || "image/png";

          contentsPayload = [
            `Analyze this student layout submission file.`,
            { inlineData: { data: base64Data, mimeType } }
          ];
        } catch (fetchErr) {
          throw new Error("Unable to read the submission file binary framework.");
        }
      } else {
        const textToAnalyze = submission?.content || submission?.submission_text;
        if (!textToAnalyze) {
          throw new Error("No text or files found inside this student record to evaluate.");
        }
        contentsPayload = [`Review this text material:\n\n${textToAnalyze}`];
      }

      const maxRetries = 3;
      let baseDelay = 2000; 
      let responseText = "";

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          setAiStatusMessage(attempt > 0 ? `Retrying engine connection (Attempt ${attempt + 1})...` : "Evaluating via Gemini Engine...");
          
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            config: {
              systemInstruction: `You are an expert academic evaluator reviewing a student portfolio assignment titled "${assignmentContextTitle}". 
              
              CRITICAL ASSIGNMENT FOCUS CRITERIA:
              The teacher has explicitly requested you to evaluate this work based on the following target parameters: [ ${activeRubrics} ].
              Do not focus on parameters outside of this requested scope.
              
              FORMATTING INSTRUCTIONS:
              - Do NOT write long paragraphs or blocks of text.
              - Post in short, bite-sized bullet points.
              - Structure your output EXACTLY like this template:

              🎯 CORE STRENGTHS (Focusing on ${activeRubrics})
              • [Short 1-sentence strength point]
              • [Short 1-sentence strength point]

              🚀 GROWTH OPPORTUNITIES (Focusing on ${activeRubrics})
              • [Short 1-sentence actionable improvement point]
              • [Short 1-sentence actionable improvement point]

              Keep sentences brief so the teacher can easily add, edit, or delete items inside their workspace window.`
            },
            contents: contentsPayload
          });

          if (response && response.text) {
            responseText = response.text;
            break; 
          } else {
            throw new Error("Empty token sequence returned from interface.");
          }

        } catch (apiErr: any) {
          const errMsg = apiErr?.message?.toLowerCase() || "";
          const isTransientError = 
            errMsg.includes("503") || 
            errMsg.includes("overloaded") || 
            errMsg.includes("demand") || 
            errMsg.includes("unavailable");

          if (isTransientError && attempt < maxRetries - 1) {
            const delayTime = baseDelay * Math.pow(2, attempt);
            setAiStatusMessage(`Engine busy. Pausing for ${Math.round(delayTime / 1000)}s...`);
            await new Promise(res => setTimeout(res, delayTime));
          } else {
            throw apiErr; 
          }
        }
      }

      setAiFeedback(responseText);

    } catch (err: any) {
      console.error("Gemini Terminal Error:", err);
      alert(`AI Execution Error: ${err.message || "Service is heavily overloaded. Please try again in a few moments."}`);
    } finally {
      setAnalyzing(false);
      setAiStatusMessage("");
    }
  };

  const handleSaveAllFeedback = async () => {
    if (!submission?.id) return;
    try {
      // 1. Fetch current authenticated user to guarantee we have a valid teacher_id
      const { data: { user } } = await supabase.auth.getUser();

      // 2. Prepare payload matching your verified Supabase schema columns
      // CRITICAL FIX: Stamped submission.student_id onto the payload object
      const payload = {
        submission_id: submission.id,
        student_id: submission.student_id, 
        summary: aiFeedback || "No summary provided.",
        action_items: manualNotes || "",
        compiled_feedback_text: aiFeedback || "No feedback generated.", 
        teacher_id: user?.id || null 
      };

      // 3. Check for existence to elegantly navigate past Upsert Constraint locks
      const { data: existingRecord } = await supabase
        .from("feedback")
        .select("id")
        .eq("submission_id", submission.id)
        .maybeSingle();

      let dbError;

      if (existingRecord) {
        // Update operational mutation flow
        const { error } = await supabase
          .from("feedback")
          .update(payload)
          .eq("id", existingRecord.id);
        dbError = error;
      } else {
        // Insert operational creation flow
        const { error } = await supabase
          .from("feedback")
          .insert([payload]);
        dbError = error;
      }

      if (dbError) throw dbError;

      alert("Evaluation successfully updated and synced!");
      navigate(-1);
    } catch (err: any) {
      console.error("Failed saving framework evaluations:", err);
      alert(`Sync issue: ${err.message}`);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} strokeWidth={1} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
          Syncing Content Engine
        </span>
      </div>
    </div>
  );

  if (error || !submission) return (
    <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white border border-red-100 p-8 rounded-[2.5rem] shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Database Error</h3>
        <p className="text-xs leading-relaxed font-mono bg-slate-50 p-3 rounded-xl border border-red-100 text-left overflow-x-auto text-red-600">
          {error}
        </p>
        <button onClick={() => navigate(-1)} className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 block mx-auto">
          {`← Return to Dashboard`}
        </button>
      </div>
    </div>
  );

  const studentName = studentProfile?.name || "Student";
  const studentEmail = studentProfile?.email || "No email on file";
  const projectTitle = assignmentMeta?.title || "Project Context Missing";
  const isPdfFile = submission.file_url && submission.file_url.toLowerCase().includes(".pdf");

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* HEADER NAV */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <User size={14} className="text-indigo-600" /> Reviewing Student: {studentName}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Email Focus: {studentEmail}
            </p>
          </div>
        </div>
        <button onClick={handleSaveAllFeedback} className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all">
          Submit Feedback
        </button>
      </header>

      {/* SPLIT VIEWER MAIN PLATFORM */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* LEFT CANVAS PANEL */}
        <section className="flex-1 p-8 bg-slate-100/60 overflow-y-auto flex flex-col items-center">
          <div className="w-[850px] bg-white border border-slate-200/60 shadow-[0_30px_60px_rgba(0,0,0,0.02)] p-12 rounded-[2.5rem] min-h-[1150px] flex flex-col justify-between mb-20">
            <div className="space-y-6 flex flex-col h-full">
              <header className="border-b border-slate-100 pb-4">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  Verified Curriculum Submission
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-3">
                  {projectTitle}
                </h1>
              </header>

              <div className="flex-1 py-2">
                {isPdfFile ? (
                  <div className="w-full h-[850px] border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-slate-100">
                    <iframe 
                      src={`${submission.file_url}#toolbar=1&navpanes=0`}
                      className="w-full h-full border-none"
                      title="Student Portfolio PDF Viewer"
                    />
                  </div>
                ) : submission.content || submission.submission_text ? (
                  <article className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {submission.content || submission.submission_text}
                  </article>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center min-h-[300px]">
                    <FileText className="text-slate-300 mb-3 animate-pulse" size={32} />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Non-Viewable Attachment Payload</span>
                  </div>
                )}
              </div>
            </div>

            {submission.file_url && (
              <div className="mt-8 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400">
                    <FileDown size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Project Portfolio File</h5>
                    <p className="text-[10px] text-slate-400 font-medium">Attached storage pipeline asset</p>
                  </div>
                </div>
                <a href={submission.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                  Inspect Asset <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT CRITIQUE MEMO SIDEBAR */}
        <aside className="w-[450px] bg-white border-l border-slate-200 flex flex-col">
          <div className="flex border-b border-slate-100">
            {['AI Analysis', 'Manual'].map((tab) => {
              const tabKey = tab.toLowerCase().includes('ai') ? 'ai-analysis' : 'manual';
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tabKey)}
                  className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest relative ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                  {isActive && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 rounded-full" />}
                </button>
              );
            })}
          </div>
          
          <div className="p-8 overflow-y-auto flex-1 bg-white">
             {activeTab === 'ai-analysis' ? (
                <div className="space-y-6 h-full flex flex-col">
                  
                  {/* EDITABLE REVIEW METRICS PIPELINE */}
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl shrink-0 space-y-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                      <Sliders size={12} className="text-slate-500" /> Assignment Review Metrics
                    </span>
                    
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {metrics.map((option) => {
                        const isSelected = selectedFocus.includes(option.id);
                        return (
                          <div
                            key={option.id}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border select-none ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <span 
                              className="cursor-pointer" 
                              onClick={() => toggleFocusParameter(option.id)}
                            >
                              {option.label}
                            </span>
                            
                            <button
                              onClick={(e) => handleDeleteMetric(option.id, e)}
                              className={`ml-1 p-0.5 rounded transition-colors ${
                                isSelected 
                                  ? "text-indigo-200 hover:text-white hover:bg-indigo-700" 
                                  : "text-slate-400 hover:text-red-500 hover:bg-slate-100"
                              }`}
                            >
                              <X size={10} />
                            </button>
                          </div>
                        );
                      })}

                      {/* INLINE ADD CRITERIA SYSTEM */}
                      {showAddInput ? (
                        <form onSubmit={handleCreateMetric} className="flex items-center gap-1.5 bg-white border border-indigo-200 rounded-lg p-1 animate-in fade-in zoom-in-95 duration-150">
                          <input
                            autoFocus
                            type="text"
                            value={newMetricLabel}
                            onChange={(e) => setNewMetricLabel(e.target.value)}
                            placeholder="Metric name..."
                            className="px-1.5 py-0.5 text-[10px] font-bold bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 w-24"
                          />
                          <button 
                            type="submit" 
                            className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded"
                          >
                            <Plus size={10} strokeWidth={3} />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => { setShowAddInput(false); setNewMetricLabel(""); }} 
                            className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          >
                            <X size={10} />
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => setShowAddInput(true)}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-dashed border-slate-300 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all flex items-center gap-1"
                        >
                          <Plus size={10} /> Add Criteria
                        </button>
                      )}
                    </div>
                  </div>

                  {/* GENERATE ENGINE TRIGGER BUTTON */}
                  <button
                    onClick={runAiAnalysisPipeline}
                    disabled={analyzing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md disabled:opacity-50 shrink-0"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} /> 
                        <span className="truncate">{aiStatusMessage || "Calling Engine..."}</span>
                      </>
                    ) : (
                      <>
                        <Cpu size={14} /> Generate Custom Review
                      </>
                    )}
                  </button>

                  {/* LIVE EDITABLE TARGET WORKSPACE */}
                  {aiFeedback ? (
                    <div className="flex-1 flex flex-col space-y-2 min-h-[400px]">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-md">
                          <Edit3 size={10} /> Live Workspace Draft
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          Click block to refine metrics
                        </span>
                      </div>
                      
                      <textarea
                        value={aiFeedback}
                        onChange={(e) => setAiFeedback(e.target.value)}
                        className="w-full flex-1 p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-700 leading-relaxed font-medium font-sans focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white focus:border-indigo-200 transition-all resize-none min-h-[400px]"
                        placeholder="Refining structural critique models..."
                      />
                    </div>
                  ) : (
                    <div className="p-6 bg-indigo-50/40 border border-indigo-100/60 rounded-2xl text-center my-auto">
                       <Sparkles className="text-indigo-400 mx-auto mb-2" size={20} />
                       <h6 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Parameters Ready</h6>
                       <p className="text-[11px] text-slate-400 mt-1">
                         Select, add, or prune criteria labels above, then execute a clean structured generation.
                       </p>
                    </div>
                  )}
                </div>
             ) : (
                <div className="space-y-4 h-full flex flex-col">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Professor Review Memo
                  </label>
                  <textarea 
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="w-full flex-1 p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:bg-white focus:border-slate-200 transition-all resize-none min-h-[300px]" 
                    placeholder="Input evaluation notes..." 
                  />
                </div>
             )}
          </div>
        </aside>
      </main>
    </div>
  );
}