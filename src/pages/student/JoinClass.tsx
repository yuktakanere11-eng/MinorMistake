import React, { useState, useCallback } from "react";
import { BookOpen, ArrowRight, LayoutGrid, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

interface JoinClassProps {
  onJoinSuccess?: () => void;
}

export default function JoinClass({ onJoinSuccess }: JoinClassProps) {
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = classCode.toUpperCase().trim();
    if (!cleanCode) return;

    setLoading(true);
    setError(null);

    try {
      // 1. SESSION VALIDATION
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Authentication required.");
      const userEmail = user.email?.trim().toLowerCase();

      // 2. IDENTIFY THE MODULE VIA USER INPUT CODE
      const { data: classData, error: classErr } = await supabase
        .from('classes')
        .select('*')
        .or(`subject_code.eq.${cleanCode},class_code.eq.${cleanCode}`)
        .limit(1);

      if (classErr) throw new Error(`Database Error: ${classErr.message}`);
      if (!classData || classData.length === 0) throw new Error("Module code not recognized.");

      const targetClass = classData[0];
      const targetClassId = targetClass.id;

      // 3. THE ADAPTIVE GATEKEEPER (Bridges the gap between ID and Text Names like "IDD")
      const { data: prRecords, error: prErr } = await supabase
        .from('pre_registered_students')
        .select('*')
        .ilike('student_email', userEmail || ''); 

      if (prErr) {
        console.error("Gatekeeper DB Error:", prErr);
        throw new Error(`Authorization check failed: ${prErr.message}`);
      }

      if (!prRecords || prRecords.length === 0) {
        throw new Error(`Access Denied: ${userEmail} is not on the pre-registered student directory.`);
      }

      // Check if any whitelisted records match the targeted workspace class
      const isWhitelisted = prRecords.some(record => {
        // Direct ID validation
        if (record.class_id && record.class_id === targetClassId) return true;

        // Smart text fallback: Extract text strings (e.g., "IDD") to prevent schema mismatch errors
        const recordStrings = Object.entries(record)
          .filter(([key, val]) => typeof val === 'string' && key !== 'id' && key !== 'student_email')
          .map(([_, val]) => (val as string).toLowerCase().trim());

        const classStrings = Object.entries(targetClass)
          .filter(([key, val]) => typeof val === 'string' && key !== 'id')
          .map(([_, val]) => (val as string).toLowerCase().trim());

        // Returns true if "idd" exists in both the whitelist record and the class data row
        return recordStrings.some(str => classStrings.includes(str));
      });

      if (!isWhitelisted) {
        console.log("DEBUG DIAGNOSTICS - Target Class:", targetClass);
        console.log("DEBUG DIAGNOSTICS - Whitelist Found:", prRecords);
        throw new Error("Access Denied: You are whitelisted, but not for this specific module code.");
      }

      // 4. CHECK EXISTING ENROLLMENT
      const { data: existingEnroll } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('class_id', targetClassId)
        .limit(1);

      if (existingEnroll && existingEnroll.length > 0) {
        throw new Error("You are already enrolled in this module.");
      } else {
        const { error: insErr } = await supabase
          .from('enrollments')
          .insert([{ student_id: user.id, class_id: targetClassId, progress: 0 }]);
          
        if (insErr) throw new Error(`Enrollment Save Error: ${insErr.message}`);
      }

      return triggerSuccess();
      
    } catch (err: any) {
      console.error("Join Process Exception:", err);
      setError(err.message || "Connection failed."); 
    } finally {
      setLoading(false);
    }
  };

  const triggerSuccess = useCallback(() => {
    setSuccess(true);
    setTimeout(() => {
      if (onJoinSuccess) onJoinSuccess();
      setSuccess(false);
      setClassCode("");
    }, 1500);
  }, [onJoinSuccess]);

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-[3rem] p-2 text-center relative overflow-hidden">
        {success && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Sync Complete</h3>
          </div>
        )}

        <div className="p-10 space-y-10">
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-slate-200">
              <BookOpen size={32} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Join Module</h2>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <input 
                  type="text" 
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  placeholder="ENTER CLASS CODE" 
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-[2rem] py-6 pl-16 pr-8 text-xs font-black tracking-[0.3em] uppercase outline-none transition-all shadow-inner text-slate-900 placeholder:text-slate-200"
                  required
                />
              </div>
              
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100">
                  <AlertCircle size={16} className="text-rose-500 shrink-0" />
                  <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest text-left">{error}</p>
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={loading || success || !classCode.trim()}
              className="w-full bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-100 text-white font-black py-6 rounded-[2rem] transition-all flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.3em]"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Connect to Workspace"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}