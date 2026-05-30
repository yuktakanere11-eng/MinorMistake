import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
// Using Lucide icons for the clean, architectural SaaS look
import { Mail, Lock, EyeOff, Eye, Github, ArrowLeft, Sparkles, User } from "lucide-react";

export default function SignupPage() {
  const navigate = useNavigate();

  // --- STATE ---
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- LOGIC (STABILIZED & REWRITTEN) ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. FRONTEND VALIDATION
    // Supabase requires passwords to be at least 6 characters by default.
    // This catches the error early and prevents the 422 Unprocessable Content error.
    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return; 
    }

    setLoading(true);

    try {
      // 2. Sign up the user with Supabase Auth
      // We pass the full_name into the metadata. Your Postgres trigger will automatically 
      // catch this signup event and insert the user into the database securely.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName, 
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data?.user) {
        // 3. Move directly to role selection. 
        // We DO NOT do a manual supabase.from(...).insert() here anymore!
        navigate("/role-selection");
      }
    } catch (err: any) {
      // Catch-all for Auth or Database errors
      alert(err.message || "An unexpected error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans selection:bg-violet-100 selection:text-violet-900">
      
      {/* LEFT SIDE: BRANDING & PRODUCT VALUE */}
      <div className="relative hidden w-1/2 flex-col justify-center overflow-hidden bg-slate-50 lg:flex">
        {/* Background architectural elements */}
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-violet-100/60 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />
        
        <div className="relative z-10 px-24">
          <div className="mb-10 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200">
               <span className="font-bold text-lg">M</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">MinorMistake</span>
          </div>

          <h1 className="text-7xl font-extrabold tracking-tighter text-slate-900 leading-[1.05]">
            Start building <br /> better feedback.
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-slate-500">
            Join hundreds of educators using MinorMistake to streamline their review process and provide actionable insights to students instantly.
          </p>

          <div className="mt-10 inline-flex items-center gap-2.5 rounded-full border border-violet-200/50 bg-white/80 px-5 py-2.5 text-sm font-semibold text-violet-700 shadow-sm backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-violet-500" />
            Structured feedback powered by AI
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: SIGNUP FORM */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Create your account</h2>
            <p className="mt-2 text-sm text-slate-500">Get started with MinorMistake today.</p>
          </div>

          <form className="mt-10 space-y-4" onSubmit={handleSignup}>
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-violet-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-600/10 shadow-sm"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@institute.edu"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-violet-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-600/10 shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-11 text-slate-900 placeholder-slate-400 transition-all focus:border-violet-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-600/10 shadow-sm"
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
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? "Creating account..." : "Get Started"}
            </button>
          </form>

          {/* Social Logins */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-slate-400 font-medium tracking-tight">Or sign up with</span>
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

          {/* Footer Routing */}
          <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-8 text-sm">
            <p className="text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-violet-600 hover:text-violet-500 transition-colors">
                Sign In
              </Link>
            </p>
            <Link to="/" className="flex items-center gap-1.5 font-bold text-slate-400 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}