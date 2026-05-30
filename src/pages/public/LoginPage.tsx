import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { Mail, Lock, EyeOff, Eye, Github, Info, ArrowLeft, Sparkles } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();

  // --- STATE ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- LOGIC ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    // 1. Fetch user profile to check for role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id)
      .single();

    // 2. Redirect based on Profile Status
    if (!profile?.role) {
      // New user who hasn't picked a role yet
      navigate("/role-selection");
      return;
    }

    if (profile.role === "teacher") {
      navigate("/teacher/dashboard");
    } else {
      // 3. STUDENT LOGIC: Check for existing enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', user?.id);

      if (!enrollments || enrollments.length === 0) {
        // If student has no classes, funnel them to join one
        navigate("/student/classes");
      } else {
        navigate("/student/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* LEFT SIDE: BRANDING & VISUALS */}
      <div className="relative hidden w-1/2 flex-col justify-center overflow-hidden bg-slate-50 lg:flex">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />
        
        <div className="relative z-10 px-24">
          <div className="mb-10 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
               <span className="font-bold text-lg">M</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">MinorMistake</span>
          </div>

          <h1 className="text-7xl font-extrabold tracking-tighter text-slate-900 leading-[1.05]">
            Welcome <br /> Back
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-slate-500">
            MinorMistake helps teachers review student work faster with AI-powered feedback suggestions. Save time, provide better feedback, and focus on teaching.
          </p>

          <div className="mt-10 inline-flex items-center gap-2.5 rounded-full border border-indigo-200/50 bg-white/80 px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            Empowering the next generation of designers
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Log in to your account</h2>
            <p className="mt-2 text-sm text-slate-500">Welcome back! Please enter your details.</p>
          </div>

          <form className="mt-10 space-y-5" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-slate-900 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-600/10 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-11 text-slate-900 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-600/10 shadow-sm"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Social Logins */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-slate-400 font-medium tracking-tight">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97]">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97]">
              <Github className="h-4 w-4" />
              GitHub
            </button>
          </div>

          <div className="mt-8 flex gap-3 rounded-2xl bg-indigo-50/80 p-4 ring-1 ring-indigo-200/50">
            <Info className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
            <p className="text-xs leading-relaxed text-slate-500">
              <span className="font-bold text-slate-700">Are you a student?</span> Your access is usually managed by your faculty. Check your inbox for enrollment links from your instructor.
            </p>
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-8 text-sm">
            <p className="text-slate-500">
              No account?{' '}
              <Link to="/signup" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                Start Trial
              </Link>
            </p>
            <Link to="/" className="flex items-center gap-1.5 font-bold text-slate-400 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}