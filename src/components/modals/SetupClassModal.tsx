import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { X, ArrowRight, Loader2, Copy, Check, Sparkles } from "lucide-react";

interface SetupClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newClassId: string) => void;
}

export default function SetupClassModal({ isOpen, onClose, onSuccess }: SetupClassModalProps) {
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const handleCreateClass = async () => {
    if (!formData.title.trim()) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      // Generate a 6-character code locally as a backup 
      // or rely on a DB trigger if you have one.
      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data, error } = await supabase
        .from('classes')
        .insert([
          { 
            name: formData.title.trim(), 
            description: formData.description.trim(),
            teacher_id: user.id,
            class_code: generatedCode // Ensuring we explicitly send a code
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Switch the modal state to show the success view
      setCreatedCode(data.class_code);
      
      // Trigger the success callback (updates parent list)
      onSuccess(data.id); 
    } catch (error: any) {
      console.error("Error creating class:", error.message);
      alert("Failed to create class. Check if 'class_code' exists in your SQL table.");
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Reset state when closing so the next open starts at the form
  const handleClose = () => {
    setCreatedCode(null);
    setFormData({ title: "", description: "" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative overflow-hidden transition-all animate-in zoom-in-95 duration-300">
        
        <button 
          onClick={handleClose} 
          className="absolute right-8 top-8 text-slate-300 hover:text-slate-600 transition-colors z-20"
        >
          <X size={24} />
        </button>

        {!createdCode ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <header>
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="text-indigo-600" size={24} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Setup Class</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                Initialize your studio space
              </p>
            </header>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Class Title
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Industrial Design 2026"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-5 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-100 transition-all outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Studio Brief
                </label>
                <textarea 
                  placeholder="Provide a short objective for this studio..."
                  rows={3}
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-5 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-100 transition-all outline-none resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <button 
              disabled={loading || !formData.title}
              onClick={handleCreateClass}
              className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all disabled:opacity-30 shadow-xl shadow-slate-200"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <>Generate Studio <ArrowRight size={18} /></>}
            </button>
          </div>
        ) : (
          <div className="space-y-8 py-4 text-center animate-in fade-in zoom-in duration-500">
            <header>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Studio Ready</h2>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-2">
                Class code generated successfully
              </p>
            </header>

            <div className="relative group">
              <div className="p-10 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-indigo-100 flex flex-col items-center justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Entry Code</p>
                <span className="text-6xl font-black text-indigo-600 tracking-tighter tabular-nums mb-2">
                  {createdCode}
                </span>
              </div>
              
              <button 
                onClick={copyToClipboard}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white border border-slate-100 shadow-xl px-6 py-3 rounded-full flex items-center gap-2 hover:scale-105 transition-all active:scale-95"
              >
                {copied ? (
                  <><Check size={14} className="text-emerald-500" /> <span className="text-[10px] font-black uppercase">Copied</span></>
                ) : (
                  <><Copy size={14} className="text-slate-400" /> <span className="text-[10px] font-black uppercase">Copy Code</span></>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 font-medium px-6 leading-relaxed">
              Designer students will enter this code on their dashboard to join this studio.
            </p>

            <button 
              onClick={handleClose}
              className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] mt-4 shadow-xl hover:bg-indigo-600 transition-all"
            >
              Finish Setup
            </button>
          </div>
        )}
        
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10" />
      </div>
    </div>
  );
}