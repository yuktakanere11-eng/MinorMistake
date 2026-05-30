import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient"; // Updated to match your previous lib path
import { GraduationCap, Presentation, ArrowRight, Sparkles } from "lucide-react";

export default function RoleSelection() {
  const [role, setRole] = useState<"teacher" | "student" | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!role) return;

    setLoading(true);
    
    // 1. Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      alert("Session expired. Please log in again.");
      return;
    }

    // 2. Save the role selection to the 'profiles' table
    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: user.id,
      role: role,
      updated_at: new Date().toISOString(),
    });

    if (upsertError) {
      setLoading(false);
      alert("Error saving role: " + upsertError.message);
      return;
    }

    // 3. Branching Logic based on role
    if (role === "teacher") {
      // Teachers always need to set up or select a workspace/school
      navigate("/onboarding/workspace");
    } else {
      /* SCENARIO A: Initial Student Onboarding
         Check if this student already has any class enrollments
      */
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id);

      if (enrollError) {
        console.error("Enrollment check failed:", enrollError);
        // Fallback to dashboard if the check fails
        navigate("/student/dashboard");
      } else if (enrollments && enrollments.length > 0) {
        // Existing student -> Go to Dashboard
        navigate("/student/dashboard");
      } else {
        // New student with no classes -> Redirect to the 'Join a Class' screen
        navigate("/student/classes");
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background blurs to match your modern design aesthetic */}
      <div className="fixed -left-20 -top-20 h-96 w-96 rounded-full bg-indigo-100/60 blur-3xl" />
      <div className="fixed -bottom-20 -right-20 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />

      <div className="relative z-10 w-full max-w-xl px-6 py-12">
        {/* Header Section */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 transition-transform hover:scale-105">
            <span className="text-xl font-bold">M</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/50 bg-white/80 px-4 py-1.5 text-[10px] font-bold tracking-widest text-indigo-700 shadow-sm backdrop-blur-md uppercase">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            Step 1 of 3
          </div>
          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900">Choose Your Role</h2>
          <p className="mt-3 text-slate-500">Tell us how you'll be using the MinorMistake platform.</p>
        </div>

        {/* Selection Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Teacher Card */}
          <button
            onClick={() => setRole("teacher")}
            className={`group relative flex flex-col items-start rounded-[2.5rem] border-2 p-7 text-left transition-all duration-300 ${
              role === "teacher"
                ? "border-indigo-600 bg-white shadow-2xl shadow-indigo-100"
                : "border-slate-200 bg-white/50 hover:border-slate-300 hover:bg-white"
            }`}
          >
            <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
              role === "teacher" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
            }`}>
              <Presentation className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 leading-none">Teacher</h3>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
              Review student work, provide AI-assisted feedback, and manage your classroom.
            </p>
            {role === "teacher" && (
              <div className="absolute right-6 top-6 h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            )}
          </button>

          {/* Student Card */}
          <button
            onClick={() => setRole("student")}
            className={`group relative flex flex-col items-start rounded-[2.5rem] border-2 p-7 text-left transition-all duration-300 ${
              role === "student"
                ? "border-indigo-600 bg-white shadow-2xl shadow-indigo-100"
                : "border-slate-200 bg-white/50 hover:border-slate-300 hover:bg-white"
            }`}
          >
            <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
              role === "student" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
            }`}>
              <GraduationCap className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 leading-none">Student</h3>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
              Access coursework, view your feedback, and track your learning progress.
            </p>
            {role === "student" && (
              <div className="absolute right-6 top-6 h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            )}
          </button>
        </div>

        {/* Primary Action */}
        <div className="mt-12 flex flex-col items-center">
          <button
            onClick={handleContinue}
            disabled={!role || loading}
            className="group flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing Profile...
              </div>
            ) : (
              <>
                Continue Setup
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
          
          <button 
            onClick={() => navigate(-1)} 
            className="mt-6 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}