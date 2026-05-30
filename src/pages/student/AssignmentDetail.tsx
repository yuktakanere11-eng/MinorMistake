import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, Loader2, FileText, MessageSquare } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

interface AssignmentData {
  id: string;
  title: string;
  class_id: string;
  description?: string;
  studio_name?: string;
}

interface UserSubmission {
  id: string;
  status: string;
  created_at: string;
  feedback?: string;
}

export default function StudentAssignmentDetail() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [submission, setSubmission] = useState<UserSubmission | null>(null);

  useEffect(() => {
    async function loadStudentWorkspace() {
      // 📝 Trace 1: Check if hook fires and what the ID is
      console.log("🔍 [TRACE 1] Hook triggered. assignmentId from URL:", assignmentId);
      
      try {
        setLoading(true);
        setError(null);

        // Moving this guard INSIDE the try/finally block so loading is guaranteed to turn off
        if (!assignmentId) {
          console.log("⚠️ [TRACE 2A] Parameter missing or undefined on initial frame render.");
          setError("Assignment identifier parameter is missing from the URL route.");
          return;
        }

        console.log("⚡ [TRACE 2B] ID verified. Requesting current user session...");
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        console.log("👤 [TRACE 3] Auth system responded.", { user: authData?.user?.id, error: authError });
        if (authError) throw authError;
        
        if (!authData?.user) {
          setError("Active session not found. Please log back into the workspace dashboard.");
          return;
        }

        const currentUserId = authData.user.id;
        console.log("📡 [TRACE 4] Launching parallel network queries for details & submissions...");

        const [assignmentResult, submissionResult] = await Promise.all([
          supabase
            .from("assignments")
            .select("*")
            .eq("id", assignmentId)
            .maybeSingle(),
          supabase
            .from("submissions")
            .select("id, status, created_at, feedback")
            .eq("assignment_id", assignmentId)
            .eq("student_id", currentUserId)
            .maybeSingle()
        ]);

        console.log("📦 [TRACE 5] Network promises settled completely.", { assignmentResult, submissionResult });

        if (assignmentResult.error) throw assignmentResult.error;
        if (submissionResult.error) throw submissionResult.error;

        if (!assignmentResult.data) {
          setError("This specific project assignment brief could not be located in the database.");
          return;
        }

        setAssignment(assignmentResult.data);
        setSubmission(submissionResult.data || null);
        console.log("🎉 [TRACE 6] Component state successfully hydrated.");

      } catch (err: any) {
        console.error("❌ [CRITICAL EXCEPTION] Workspace fetch crashed:", err);
        setError(err.message || "An unexpected configuration error occurred.");
      } finally {
        // 🛡️ UNBREAKABLE GUARDRAIL: Guarantees the loader switches off
        console.log("🏁 [TRACE 7] Finally block executed. Shutting off loading spinner.");
        setLoading(false);
      }
    }

    loadStudentWorkspace();
  }, [assignmentId]);

  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing Brief Details</p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="w-full min-h-screen bg-slate-50/50 flex items-center justify-center p-8">
        <div className="bg-white rounded-[3rem] border border-red-100 p-12 flex flex-col items-center justify-center text-center max-w-md shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Workspace Error</h2>
          <p className="text-sm font-medium text-red-500 mt-2">
            {error || "Project file identifier missing."}
          </p>
          <Link 
            to="/student/dashboard" 
            className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/50 p-8 space-y-10">
      {/* TOP HEADER CONTROLS */}
      <div className="flex items-center justify-between">
        <Link 
          to="/student/dashboard" 
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Dashboard
        </Link>
      </div>

      {/* CORE TITLE AND META */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            {assignment.title}
          </h1>
          <span className={`border font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full ${
            submission ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
          }`}>
            {submission ? "Submitted" : "Action Required"}
          </span>
        </div>
        <p className="text-slate-400 text-sm font-medium">
          {assignment.description || "The brief explanation for this target timeline has not been updated yet."}
        </p>
      </div>

      {/* METRIC STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Submission Status</p>
            <p className={`text-4xl font-black uppercase tracking-tight ${submission ? "text-emerald-500" : "text-amber-500"}`}>
              {submission?.status || "Pending"}
            </p>
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${submission ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-500"}`}>
            {submission ? <CheckCircle2 size={24} /> : <Clock size={24} />}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Studio Stream</p>
            <p className="text-4xl font-black text-slate-900 uppercase tracking-tight">
              {assignment.studio_name || "Core Studio"}
            </p>
          </div>
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
            <FileText size={24} />
          </div>
        </div>
      </div>

      {/* WORKSPACE SUBMISSION PANEL */}
      <div className="bg-white rounded-[3rem] border border-slate-100 p-10 space-y-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Your Working Deliverable</h2>
          {submission && (
            <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">
              Pinned on: {new Date(submission.created_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {!submission ? (
          <button 
            onClick={() => navigate(`/student/assignments/${assignmentId}/submit`)}
            className="w-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-[2rem] bg-slate-50/50 hover:bg-indigo-50/30 transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 bg-indigo-600 group-hover:bg-indigo-700 group-hover:scale-110 transition-all text-white rounded-full flex items-center justify-center mb-4 shadow-md text-lg font-black">
              +
            </div>
            <p className="text-slate-900 font-black text-sm uppercase tracking-wider group-hover:text-indigo-900 transition-colors">
              Upload Pinboard Work
            </p>
            <p className="text-slate-400 text-xs mt-1">Submit your image link or project brief tracking info.</p>
          </button>
        ) : (
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <MessageSquare size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Jury Review & Critique</h4>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  {submission.feedback || "Your submission has been cataloged. Waiting for continuous feedback from your studio lead."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}