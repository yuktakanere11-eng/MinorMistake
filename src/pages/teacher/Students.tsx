import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { 
  Search, Users, UserPlus, X, Loader2,
  ArrowRight, BookOpen, Trash2, Filter,
  CheckCircle2, AlertCircle, Clock
} from "lucide-react";

// Explicit Type Definitions
interface Student {
  id: string;
  full_name: string | null;
  email: string;
  class_name: string | null;
  role: string;
  teacher_id: string;
}

interface PendingStudent {
  id: string;
  student_email: string;
  class_name: string | null;
  teacher_id: string;
}

interface NewStudentForm {
  fullName: string;
  email: string;
  className: string;
}

export default function StudentsPage() {
  const navigate = useNavigate();
  
  // State Management
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [viewMode, setViewMode] = useState<"active" | "pending">("active");
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("All");
  
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  const [newStudent, setNewStudent] = useState<NewStudentForm>({ 
    fullName: "", 
    email: "", 
    className: "" 
  });

  useEffect(() => { 
    fetchAllData(); 
  }, []);

  const extractErrorMessage = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    return err.message || err.error || err.statusText || String(err);
  };

  // Fetch both Active profiles and Pending whitelisted emails
  async function fetchAllData() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Active Profiles
      const { data: activeData, error: activeErr } = await supabase
        .from("profiles")
        .select("id, full_name, email, class_name, role, teacher_id")
        .eq("teacher_id", user.id)
        .eq("role", "student") 
        .order("full_name", { ascending: true });

      if (activeErr) throw activeErr;
      setStudents((activeData as Student[]) || []);

      // 2. Fetch Pending Whitelisted Students
      const { data: pendingData, error: pendingErr } = await supabase
        .from("pre_registered_students")
        .select("id, student_email, class_name, teacher_id")
        .eq("teacher_id", user.id);

      if (pendingErr) throw pendingErr;
      setPendingStudents((pendingData as PendingStudent[]) || []);

    } catch (err: any) {
      console.error("Fetch Data Error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Memoized dynamic class list tabs based on current view selection
  const classList = useMemo(() => {
    const classes = viewMode === "active" 
      ? students.map(s => s.class_name)
      : pendingStudents.map(s => s.class_name);
    return ["All", ...Array.from(new Set(classes))].filter(Boolean) as string[];
  }, [students, pendingStudents, viewMode]);

  // Memoized calculations for filtering and search results
  const filteredActive = useMemo(() => {
    return students.filter(s => {
      const query = searchTerm.toLowerCase();
      const matchesSearch = (s.full_name || "").toLowerCase().includes(query) || (s.email || "").toLowerCase().includes(query);
      const matchesClass = selectedClass === "All" || s.class_name === selectedClass;
      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, selectedClass]);

  const filteredPending = useMemo(() => {
    return pendingStudents.filter(s => {
      const query = searchTerm.toLowerCase();
      const matchesSearch = (s.student_email || "").toLowerCase().includes(query);
      const matchesClass = selectedClass === "All" || s.class_name === selectedClass;
      return matchesSearch && matchesClass;
    });
  }, [pendingStudents, searchTerm, selectedClass]);

  // Handle single student registration whitelisting
  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const targetEmail = newStudent.email.toLowerCase().trim();
    const targetClassName = newStudent.className.trim() || "General";
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication session required.");

      const { error: regErr } = await supabase
        .from("pre_registered_students")
        .upsert({
          student_email: targetEmail,
          teacher_id: user.id,
          class_name: targetClassName
        });

      if (regErr) throw regErr;

      await fetchAllData(); 
      setIsAddModalOpen(false);
      setNewStudent({ fullName: "", email: "", className: "" });
      setViewMode("pending"); // Automatically switch to pending tab to show the success!
      alert(`Success: "${targetEmail}" is whitelisted. They will appear in Active Records once they sign up.`);

    } catch (err: any) {
      console.error("Registration Core Error Stack:", err);
      alert(`Registration Error: ${extractErrorMessage(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle removals
  const handleBulkDelete = async () => {
    if (!window.confirm(`Permanently remove ${selectedIds.length} selected items? This revokes access rights.`)) return;
    try {
      if (viewMode === "active") {
        const emailsToRemove = students.filter(s => selectedIds.includes(s.id)).map(s => s.email.toLowerCase());
        await supabase.from("profiles").delete().in("id", selectedIds);
        if (emailsToRemove.length > 0) {
          await supabase.from("pre_registered_students").delete().in("student_email", emailsToRemove);
        }
      } else {
        await supabase.from("pre_registered_students").delete().in("id", selectedIds);
      }
      
      await fetchAllData();
      setSelectedIds([]);
      setIsSelectionMode(false);
      alert("Selected records updated successfully.");
    } catch (err: any) {
      console.error("Batch Deletion Stack Error:", err);
      alert(`Delete Error: ${extractErrorMessage(err)}`);
    }
  };

  return (
    <div className="p-10 bg-slate-50 min-h-screen font-sans selection:bg-violet-100">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Student Directory</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
            <Users size={14} className="text-violet-600" /> 
            {viewMode === "active" ? `${filteredActive.length} Registered User(s)` : `${filteredPending.length} Pending Invites`}
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {isSelectionMode ? (
            <div className="flex gap-2 w-full">
              <button 
                onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }} 
                className="flex-1 px-6 py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkDelete} 
                disabled={selectedIds.length === 0} 
                className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Trash2 size={14} /> Revoke ({selectedIds.length})
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => { setIsSelectionMode(true); setSelectedIds([]); }} 
                className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-red-600 transition-colors"
              >
                <Filter size={14} /> Batch Actions
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)} 
                className="flex items-center gap-2 px-8 py-4 bg-violet-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-violet-700 transition-all"
              >
                <UserPlus size={14} /> Add Student
              </button>
            </>
          )}
        </div>
      </header>

      {/* Roster Status Subtabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-8">
        <button 
          onClick={() => { setViewMode("active"); setSelectedClass("All"); setSelectedIds([]); }}
          className={`pb-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${viewMode === "active" ? "text-violet-600 border-violet-600" : "text-slate-400 border-transparent hover:text-slate-600"}`}
        >
          Active Accounts ({students.length})
        </button>
        <button 
          onClick={() => { setViewMode("pending"); setSelectedClass("All"); setSelectedIds([]); }}
          className={`pb-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${viewMode === "pending" ? "text-violet-600 border-violet-600" : "text-slate-400 border-transparent hover:text-slate-600"}`}
        >
          Pending Whitelist ({pendingStudents.length})
        </button>
      </div>

      {/* Class Filtering Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
        {classList.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedClass(c)}
            className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
              selectedClass === c ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Search Input Field */}
      <div className="relative max-w-2xl mb-8 group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-violet-600 transition-colors" size={20} />
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={viewMode === "active" ? "Search signed up students..." : "Search whitelisted emails..."} 
          className="w-full pl-16 pr-8 py-6 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold outline-none shadow-sm focus:ring-8 focus:ring-violet-600/5 transition-all"
        />
      </div>

      {/* Directory Table Area */}
      <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[500px] gap-4">
            <Loader2 className="animate-spin text-violet-600" size={32} />
          </div>
        ) : (viewMode === "active" ? filteredActive.length : filteredPending.length) === 0 ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-center p-10">
            <AlertCircle size={48} className="text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-900 uppercase">List Empty</h3>
            <p className="text-slate-400 text-xs mt-1">No student records found in this category.</p>
          </div>
        ) : (
          <div className="p-4 md:p-8 overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-4 min-w-[600px]">
              <thead>
                <tr className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                  {isSelectionMode && <th className="w-12 text-center">Select</th>}
                  <th className="px-4 text-left">Student Information</th>
                  <th className="px-4 text-left">Class Assigned</th>
                  <th className="px-4 text-left">Status</th>
                  {viewMode === "active" && <th className="px-4 text-right">View</th>}
                </tr>
              </thead>
              <tbody>
                {/* Active Accounts Rendering */}
                {viewMode === "active" && filteredActive.map((student) => (
                  <tr key={student.id} className="group">
                    {isSelectionMode && (
                      <td className="px-4 text-center">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-lg accent-violet-600 cursor-pointer"
                          checked={selectedIds.includes(student.id)}
                          onChange={() => setSelectedIds(prev => prev.includes(student.id) ? prev.filter(i => i !== student.id) : [...prev, student.id])}
                        />
                      </td>
                    )}
                    <td className="bg-slate-50/50 py-4 px-6 rounded-l-[1.5rem]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border flex items-center justify-center font-black text-xs text-slate-700 shadow-sm uppercase">
                          {student.full_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-sm">{student.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="bg-slate-50/50 px-4">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 text-violet-600 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">
                         <BookOpen size={10}/> {student.class_name || "General"}
                       </span>
                    </td>
                    <td className="bg-slate-50/50 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 border border-green-100 rounded text-[9px] font-black uppercase tracking-wide">
                        Active
                      </span>
                    </td>
                    <td className="bg-slate-50/50 px-6 py-4 rounded-r-[1.5rem] text-right">
                      <button 
                        onClick={() => navigate(`/teacher/students/${student.id}`)} 
                        className="p-3 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-violet-600 hover:border-violet-200 shadow-sm transition-all"
                      >
                        <ArrowRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Pending Whitelist Rendering */}
                {viewMode === "pending" && filteredPending.map((student) => (
                  <tr key={student.id} className="group">
                    {isSelectionMode && (
                      <td className="px-4 text-center">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-lg accent-violet-600 cursor-pointer"
                          checked={selectedIds.includes(student.id)}
                          onChange={() => setSelectedIds(prev => prev.includes(student.id) ? prev.filter(i => i !== student.id) : [...prev, student.id])}
                        />
                      </td>
                    )}
                    <td className="bg-slate-50/50 py-4 px-6 rounded-l-[1.5rem]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border flex items-center justify-center font-black text-xs text-amber-600 shadow-sm">
                          @
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-sm">{student.student_email}</div>
                          <div className="text-[10px] text-slate-400 font-bold">Awaiting account creation</div>
                        </div>
                      </div>
                    </td>
                    <td className="bg-slate-50/50 px-4">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 text-violet-600 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">
                         <BookOpen size={10}/> {student.class_name || "General"}
                       </span>
                    </td>
                    <td className="bg-slate-50/50 px-4 rounded-r-[1.5rem]">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[9px] font-black uppercase tracking-wide">
                        <Clock size={10} /> Pending Signup
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Modal Overlays */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative border border-slate-100">
             <button 
               onClick={() => setIsAddModalOpen(false)} 
               className="absolute right-10 top-10 p-2 text-slate-300 hover:bg-slate-50 hover:text-slate-600 rounded-full transition-all"
             >
               <X size={24}/>
             </button>
             
             <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase mb-5">Whitelist<br/>Student</h2>
             <p className="text-slate-400 text-xs font-medium mb-10 leading-relaxed">Entering details here pre-authorizes this email. The student can then join your course dashboard via class entry codes.</p>
             
             <form onSubmit={handleManualAdd} className="space-y-4">
                <input 
                  required 
                  type="email" 
                  value={newStudent.email} 
                  onChange={(e) => setNewStudent({...newStudent, email: e.target.value})} 
                  placeholder="Email Address" 
                  className="w-full px-6 py-5 bg-slate-50 border border-transparent focus:border-slate-200 rounded-2xl outline-none font-bold text-sm transition-all" 
                />
                <input 
                  type="text"
                  value={newStudent.className} 
                  onChange={(e) => setNewStudent({...newStudent, className: e.target.value})} 
                  placeholder="Class Name (e.g., Biology 101)" 
                  className="w-full px-6 py-5 bg-slate-50 border border-transparent focus:border-slate-200 rounded-2xl outline-none font-bold text-sm transition-all" 
                />
                
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full py-7 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-[2rem] mt-8 hover:bg-violet-600 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-xl"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={18}/>
                  ) : (
                    <><CheckCircle2 size={16}/> Authorize Student</>
                  )}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}