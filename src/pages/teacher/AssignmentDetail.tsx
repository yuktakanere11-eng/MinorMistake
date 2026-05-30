import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { 
  ChevronLeft, Edit3, Users, User, 
  ArrowRight, CheckCircle2, Clock, PlusCircle, AlertCircle, AlertTriangle
} from "lucide-react";

import TeamBuilderModal from "../../components/modals/TeamBuilderModal";

// Added explicit interfaces for better safety
interface AssignmentDetails {
  id: string;
  title: string;
  description: string;
  assignment_scope: string;
  class_id: string;
  points_possible: number;
  classes?: { name: string };
}

export default function AssignmentDetail() {
  // Check for both 'id' and 'assignmentId' depending on how App.tsx is routed
  const params = useParams();
  const resolvedId = params.id || params.assignmentId;
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [showTeamBuilder, setShowTeamBuilder] = useState(false);
  const [stats, setStats] = useState({ total: 0, submitted: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // 1. Prevent the silent infinite loop if the URL parameter is missing
    if (!resolvedId) {
      setDbError("Invalid URL configuration. Could not find the assignment ID.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setDbError(null); 
    
    try {
      // 2. Ensure user is authenticated before requesting (prevents silent RLS blocks)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Authentication missing. Please log in again.");

      // 3. Fetch assignment details
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .select(`*, classes(name)`)
        .eq("id", resolvedId)
        .single();

      if (assignmentError) throw new Error(`Assignment Fetch Error: ${assignmentError.message}`);
      if (!assignmentData) throw new Error("Assignment brief details have not been finalized or found.");
      
      const isGroup = assignmentData.assignment_scope === "team";
      const classId = assignmentData.class_id;

      // 4. Prepare parallel promises
      const queries = [];

      // Promise A: Target Metrics
      if (isGroup) {
        queries.push(
          supabase
            .from("assignment_groups")
            .select(`*, group_members(student_id)`)
            .eq("assignment_id", resolvedId)
        );
      } else {
        queries.push(
          supabase
            .from("enrollments") 
            .select("*", { count: "exact", head: true })
            .eq("class_id", classId)
        );
      }

      // Promise B: Submissions
      // UPDATED: Explicitly use the student_id foreign key and fetch both common name columns
      const subQuery = isGroup 
        ? `*, assignment_groups(name)` 
        : `*, profiles!student_id(name, full_name)`; 
        
      queries.push(
        supabase
          .from("submissions")
          .select(subQuery)
          .eq("assignment_id", resolvedId)
      );

      // Execute queries concurrently
      const [metricsResponse, submissionsResponse] = await Promise.all(queries);

      if (metricsResponse.error) throw new Error(`Metrics Data Error: ${metricsResponse.error.message}`);
      if (submissionsResponse.error) throw new Error(`Submissions Relation Error: ${submissionsResponse.error.message}`);

      // 5. Process the results
      let totalTarget = 0;
      
      if (isGroup) {
        const fetchedGroups = metricsResponse.data || [];
        setGroups(fetchedGroups);
        totalTarget = fetchedGroups.length;
      } else {
        totalTarget = metricsResponse.count || 0;
      }

      const fetchedSubmissions = submissionsResponse.data || [];

      // 6. Commit to State
      setAssignment(assignmentData);
      setSubmissions(fetchedSubmissions);
      setStats({
        total: totalTarget,
        submitted: fetchedSubmissions.length,
        pending: Math.max(0, totalTarget - fetchedSubmissions.length),
      });

    } catch (err: any) {
      console.error("Database query operation failed:", err);
      setDbError(err.message || "An unexpected error occurred while communicating with the database.");
    } finally {
      // Guarantees the spinner ALWAYS turns off, even if it fails
      setLoading(false);
    }
  }, [resolvedId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Loading Studio View</span>
      </div>
    </div>
  );

  const isGroup = assignment?.assignment_scope === "team";
  const needsTeams = isGroup && groups.length === 0;

  return (
    <div className="max-w-6xl mx-auto p-10 font-sans bg-slate-50 min-h-screen">
      
      {/* DATABASE DIAGNOSTICS ERROR BANNER */}
      {dbError && (
        <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-3xl flex items-start gap-4 shadow-sm">
          <AlertTriangle className="text-red-500 shrink-0 mt-1" size={24} />
          <div>
            <h3 className="text-red-800 font-bold text-sm mb-1">Database Query Failed</h3>
            <p className="text-red-600 text-xs font-mono">{dbError}</p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <header className="flex justify-between items-start mb-12">
        <div className="space-y-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft size={14} /> Back to Studio
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-black tracking-tighter text-slate-900">
              {assignment?.title || "Unknown Project"}
            </h1>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm border ${
              isGroup ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-indigo-600 border-indigo-100'
            }`}>
              {isGroup ? <Users size={12} /> : <User size={12} />}
              {isGroup ? 'Team Project' : 'Individual'}
            </span>
          </div>
          <p className="text-slate-500 max-w-xl text-sm font-medium leading-relaxed">
            {assignment?.description || "Project brief details have not been finalized."}
          </p>
        </div>

        <div className="flex gap-3">
          {isGroup && (
            <button
              onClick={() => setShowTeamBuilder(true)}
              className="px-6 py-4 bg-white text-purple-700 rounded-2xl shadow-sm border border-purple-100 hover:bg-purple-600 hover:text-white transition-all flex items-center gap-2 text-[11px] font-black uppercase tracking-widest"
            >
              <PlusCircle size={16} /> Manage Teams
            </button>
          )}
          <button
            onClick={() => navigate(`/teacher/assignments/${resolvedId}/edit`)}
            className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all flex items-center gap-2 text-xs font-bold"
          >
            <Edit3 size={16} /> Edit Brief
          </button>
        </div>
      </header>

      {/* ALERT FOR MISSING TEAM STRUCTURING */}
      {needsTeams && !dbError && (
        <div className="mb-10 p-8 bg-amber-50 border-2 border-dashed border-amber-200 rounded-[2.5rem] flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl">
              <AlertCircle size={28} />
            </div>
            <div>
              <p className="font-black text-amber-900 text-sm tracking-tight uppercase">Structure Missing</p>
              <p className="text-amber-700 text-xs font-medium">This project requires teams. No groups have been assembled yet.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowTeamBuilder(true)}
            className="px-8 py-4 bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 shadow-lg shadow-amber-100 transition-all"
          >
            Assemble Teams
          </button>
        </div>
      )}

      {/* METRICS DISPLAY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {[
          { label: `Total ${isGroup ? 'Teams' : 'Students'}`, value: stats.total, icon: <Users className="text-slate-200" /> },
          { label: "Submitted", value: stats.submitted, icon: <CheckCircle2 className="text-emerald-400" /> },
          { label: "Awaiting", value: stats.pending, icon: <Clock className="text-orange-300" /> }
        ].map((item, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{item.value}</h2>
            </div>
            {item.icon}
          </div>
        ))}
      </div>

      {/* ARCHIVE TRACKING LIST */}
      <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black tracking-tight text-slate-900">
            {isGroup ? "Team Submissions" : "Student Submissions"}
          </h3>
          <div className="h-px flex-1 bg-slate-50 mx-8" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Studio: {assignment?.classes?.name || "Unknown"}
          </span>
        </div>

        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="py-24 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
              <div className="mb-4 text-slate-200"><PlusCircle size={48} /></div>
              <p className="text-slate-400 font-bold text-sm">
                {dbError ? "Data fetching failed. Check metrics report." : "Waiting for jury pins..."}
              </p>
            </div>
          ) : (
            submissions.map((s) => {
              // UPDATED: Check for both name variants gracefully
              const resolvedStudentName = s.profiles?.name || s.profiles?.full_name || "Unknown Studio Member";
              const displayName = isGroup ? (s.assignment_groups?.name || "Unnamed Team") : resolvedStudentName;
              const initial = displayName.charAt(0).toUpperCase();
              
              const isGraded = s.status === 'graded';
              const pointsAwarded = s.points_awarded;
              const pointsPossible = assignment?.points_possible || 100;
              
              const dateRaw = s.updated_at || s.created_at || new Date().toISOString();
              const dateDisplay = new Date(dateRaw).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

              return (
                <div key={s.id} className="group flex items-center justify-between p-6 hover:bg-slate-50 rounded-[2.5rem] transition-all border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black transition-all ${
                      isGroup ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'
                    }`}>
                      {initial}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 tracking-tight text-lg flex items-center gap-3">
                        {displayName}
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                          isGraded ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {s.status || 'submitted'}
                        </span>
                      </p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        Logged: {dateDisplay}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Portfolio Grade</p>
                      <p className={`font-black tracking-tighter ${isGraded ? 'text-indigo-600 text-xl' : 'text-slate-300 italic text-sm'}`}>
                        {isGraded ? `${pointsAwarded} / ${pointsPossible}` : "Pending"}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate(`/teacher/review/${s.id}`)}
                      className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        isGroup ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-slate-900 text-white hover:bg-indigo-600'
                      }`}
                    >
                      {isGraded ? 'Review Feedback' : 'Grade Project'} <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* TEAM CREATION COMPONENT MODAL OVERLAY */}
      {showTeamBuilder && resolvedId && assignment?.class_id && (
        <TeamBuilderModal 
          assignmentId={resolvedId} 
          classId={assignment.class_id}
          onClose={() => setShowTeamBuilder(false)}
          onSuccess={fetchData} 
        />
      )}
    </div>
  );
}