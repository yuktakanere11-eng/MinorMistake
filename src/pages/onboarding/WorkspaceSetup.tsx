import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { User, Users, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";

export default function WorkspaceSelection() {
  const [type, setType] = useState<"solo" | "team">("solo");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    // Update the profile with workspace preference
    const { error } = await supabase
      .from("profiles")
      .update({ 
        workspace_type: type,
        onboarding_step: 3 // Mark step 2 as complete
      })
      .eq("id", user.id);

    if (error) {
      alert("Error saving workspace: " + error.message);
      setLoading(false);
      return;
    }

    // Redirect directly to the Teacher Dashboard
    navigate("/teacher/dashboard");
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 font-sans selection:bg-violet-100">
      {/* Background Decorative Blurs */}
      <div className="fixed -left-20 -top-20 h-96 w-96 rounded-full bg-violet-100/60 blur-3xl" />
      <div className="fixed -bottom-20 -right-20 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />

      <div className="relative z-10 w-full max-w-4xl px-6 py-12">
        
        {/* Header & Progress Indicator */}
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-[10px] font-bold tracking-widest text-violet-700 uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Step 2 of 3
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">How will you work?</h2>
          <p className="mt-3 text-lg text-slate-500">Select the workspace type that fits your teaching style.</p>
        </div>

        {/* Workspace Selection Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {/* Solo Teacher Card */}
          <button
            onClick={() => setType("solo")}
            className={`group relative flex flex-col items-start rounded-[2.5rem] border-2 p-8 text-left transition-all duration-300 ${
              type === "solo"
                ? "border-violet-600 bg-white shadow-2xl shadow-violet-100"
                : "border-slate-200 bg-white/50 hover:border-slate-300"
            }`}
          >
            <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
              type === "solo" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
            }`}>
              <User className="h-7 w-7" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900">Solo Teacher</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Perfect for independent educators managing their own classes, students, and curriculum without a larger team.
            </p>

            <ul className="mt-8 space-y-3">
              {['Personal class management', 'Individual student tracking', 'Private resource library'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>

            {/* Custom Checkbox UI */}
            <div className={`absolute right-8 top-8 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
              type === "solo" ? "border-violet-600 bg-violet-600" : "border-slate-200"
            }`}>
              {type === "solo" && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
          </button>

          {/* Team Workspace Card */}
          <button
            onClick={() => setType("team")}
            className={`group relative flex flex-col items-start rounded-[2.5rem] border-2 p-8 text-left transition-all duration-300 ${
              type === "team"
                ? "border-violet-600 bg-white shadow-2xl shadow-violet-100"
                : "border-slate-200 bg-white/50 hover:border-slate-300"
            }`}
          >
            <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
              type === "team" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
            }`}>
              <Users className="h-7 w-7" />
            </div>

            <h3 className="text-xl font-bold text-slate-900">Team Workspace</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Ideal for schools, departments, or co-teaching setups where resources and coordination are shared among staff.
            </p>

            <ul className="mt-8 space-y-3">
              {['Shared curriculum planning', 'Co-teacher assignments', 'Department-wide analytics'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>

            <div className={`absolute right-8 top-8 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
              type === "team" ? "border-violet-600 bg-violet-600" : "border-slate-200"
            }`}>
              {type === "team" && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
          </button>
        </div>

        {/* Navigation Actions */}
        <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-8">
          <button 
            onClick={() => navigate(-1)} 
            className="group flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> 
            Back
          </button>
          
          <button
            onClick={handleContinue}
            disabled={loading}
            className="rounded-2xl bg-violet-600 px-10 py-4 text-sm font-bold text-white shadow-xl shadow-violet-200 transition-all hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Finalizing...
              </span>
            ) : "Continue Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}