import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Upload, 
  File as FileIcon, 
  X, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2,
  AlertCircle 
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useStore } from "../../store/useStore";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB Limit

export default function SubmitAssignment() {
  // 👈 CHANGED: Robust parameter checking to match your routing
  const params = useParams();
  const resolvedId = params.id || params.assignmentId;
  
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");

  const navigate = useNavigate();
  const { user, fetchUser } = useStore();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!user) fetchUser();
  }, [user, fetchUser]);

  // Handle drag events safely
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null); // Clear any previous errors on new selection
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    
    if (!resolvedId) {
      setError("Assignment ID missing from URL. Please return to the dashboard and try again.");
      return;
    }

    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      setError("Authentication sync required. Please refresh and try again.");
      return;
    }

    if (!file) {
      setError("Please select a file to submit.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Artifact too large. The limit for studio uploads is 50MB.");
      return;
    }

    setLoading(true);

    try {
      // 1. FETCH CLASS ID & ASSIGNMENT NAME
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .select("class_id, title")
        .eq("id", resolvedId) // 👈 Use resolvedId here
        .single();

      if (assignmentError || !assignmentData) {
        throw new Error("Could not verify the assignment details in the database.");
      }

      const classId = assignmentData.class_id;
      const assignmentName = assignmentData.title; 

      // 2. VERSION CONTROL LOGIC
      const { data: versions, error: vError } = await supabase
        .from("submissions")
        .select("version")
        .eq("assignment_id", resolvedId) // 👈 Use resolvedId here
        .eq("student_id", authUser.id)
        .order("version", { ascending: false })
        .limit(1);

      if (vError) throw vError;
      const nextVersion = (versions?.[0]?.version || 0) + 1;

      // 3. STORAGE UPLOAD WITH VERSION & TIMESTAMP
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, ''); // Sanitize filename
      const filePath = `${resolvedId}/${authUser.id}/v${nextVersion}_${Date.now()}_${safeName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("assignments")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw new Error(`Upload Failed: ${uploadError.message}`);

      // 4. GENERATE PUBLIC URL
      const { data: { publicUrl } } = supabase.storage
        .from("assignments")
        .getPublicUrl(filePath);

      // 5. DATABASE RECORD INSERT
      const { error: insertError } = await supabase
        .from("submissions")
        .insert({
          assignment_id: resolvedId, // 👈 Use resolvedId here
          assignment_name: assignmentName, 
          student_id: authUser.id,
          class_id: classId,
          version: nextVersion,
          file_url: publicUrl,
          status: "submitted",
          metadata: {
            original_name: file.name,
            size: file.size,
            type: file.type
          }
        });

      if (insertError) throw new Error(`Database Error: ${insertError.message}`);

      setIsSuccess(true);

    } catch (err: unknown) {
      console.error("Critical Submission Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Archive transmission failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS CONFIRMATION STATE VIEW
  if (isSuccess) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-32 flex flex-col items-center justify-center text-center space-y-10 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-emerald-100/40 border border-emerald-100">
          <CheckCircle2 size={44} strokeWidth={1.5} className="animate-in fade-in zoom-in duration-700 delay-200" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Artifact Logged<span className="text-indigo-600">.</span>
          </h1>
          <p className="text-slate-400 font-medium italic text-lg max-w-md mx-auto tracking-tight">
            Your project deliverable has been safely synchronized with the repository.
          </p>
        </div>

        <button
          onClick={() => navigate("/student/dashboard")}
          className="bg-slate-900 text-white px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200 active:scale-[0.98]"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // STANDARD UPLOAD FORM VIEW
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <header className="space-y-6 text-center md:text-left">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all mx-auto md:mx-0"
        >
          <ArrowLeft size={14} /> Back to Studio
        </button>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8]">
            {mode === "revision" ? "Archive Revision" : "Submit Work"}<span className="text-indigo-600">.</span>
          </h1>
          <p className="text-slate-400 font-medium italic text-lg tracking-tight">
            Upload your final module deliverables for review.
          </p>
        </div>
      </header>

      {/* UPLOAD ZONE */}
      <div className="space-y-8">
        <div 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative group min-h-[350px] rounded-[3rem] border-4 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-12 text-center
            ${file ? 'border-emerald-100 bg-emerald-50/20' : dragActive ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-100 bg-slate-50/50'}
          `}
        >
          {!file ? (
            <>
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-center text-slate-300 mb-6 group-hover:scale-110 transition-transform duration-500">
                <Upload size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Drop artifact here</h2>
              <p className="text-sm text-slate-400 mt-2 mb-8 max-w-xs">PDF, JPG, or ZIP preferred. Maximum file size 50MB.</p>
              
              <label className="cursor-pointer bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
                Choose File
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
            </>
          ) : (
            <div className="animate-in zoom-in duration-300 w-full max-w-sm">
              <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-100/20 flex items-center gap-6">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0">
                  <FileIcon size={24} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Ready to upload</p>
                  <p className="font-black text-slate-900 truncate tracking-tight">{file.name}</p>
                </div>
                <button 
                  onClick={() => setFile(null)} 
                  className="text-slate-300 hover:text-rose-500 transition-colors shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
            <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest text-left leading-normal">{error}</p>
          </div>
        )}

        {/* SUBMISSION ACTION */}
        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className={`w-full py-6 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl
            ${!file || loading 
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
              : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-emerald-100 active:scale-[0.98]'
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Processing Archives...
            </>
          ) : (
            <>
              Confirm Submission
              <CheckCircle2 size={20} />
            </>
          )}
        </button>
        
        <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2">
          <AlertCircle size={12} /> This will be logged as a Version Control Artifact
        </p>
      </div>
    </div>
  );
}