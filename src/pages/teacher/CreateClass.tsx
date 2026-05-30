import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient"; 
import { Plus, ArrowRight, Loader2, Copy, Check, Sparkles, Layout } from "lucide-react";

export default function CreateClass() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Session expired. Please log in again.");
        return;
      }

      // Generate a 6-character unique class code
      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // INSERT: Create the class with the code
      const { data, error } = await supabase
        .from("classes")
        .insert([{
          name: name.trim(),
          teacher_id: user.id,
          class_code: generatedCode
        }])
        .select()
        .single();

      if (error) {
        console.error("Supabase Error:", error);
        alert("Error creating class. Ensure 'class_code' column exists in your table.");
      } else {
        setCreatedCode(data.class_code);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-10 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
           <Layout size={24} />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Initialize Studio</h1>
      </div>
      
      {!createdCode ? (
        /* UI: CREATION FORM */
        <div className="space-y-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Studio Name</label>
            <input 
              className="w-full p-5 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-indigo-100 focus:bg-white font-bold text-slate-700 transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Industrial Design 101"
              autoFocus
            />
          </div>

          <button 
            onClick={handleCreate}
            disabled={loading || !name}
            className="group w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all disabled:opacity-20 shadow-xl shadow-slate-200"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>CREATE STUDIO <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </div>
      ) : (
        /* UI: CONNECTION CODE DISPLAY */
        <div className="space-y-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl text-center animate-in zoom-in-95 duration-300">
          <header>
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-emerald-500" size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase">Studio Ready</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Connection code for designers</p>
          </header>

          <div className="relative group">
            <div className="p-10 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <span className="text-6xl font-black text-slate-900 tracking-tighter tabular-nums">
                {createdCode}
              </span>
            </div>
            
            <button 
              onClick={copyToClipboard}
              className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-white border border-slate-100 shadow-xl px-8 py-3 rounded-full flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              {copied ? (
                <><Check size={14} className="text-emerald-500" /> <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Copied</span></>
              ) : (
                <><Copy size={14} className="text-slate-400" /> <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Copy Code</span></>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 font-medium px-8 leading-relaxed mt-6">
            Share this code. Once a student enters it, they will be linked to your studio roster automatically.
          </p>

          <button 
            onClick={() => navigate("/teacher/classes")}
            className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100"
          >
            Continue to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}