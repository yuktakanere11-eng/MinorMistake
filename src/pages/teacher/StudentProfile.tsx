import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { 
  ArrowLeft, Mail, Hash, TrendingUp, 
  FileText 
} from "lucide-react";

type TabType = 'feedback' | 'assignments' | 'history';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [tabData, setTabData] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('feedback');

  useEffect(() => {
    fetchProfileAndTabData();
  }, [id, activeTab]);

  async function fetchProfileAndTabData() {
    try {
      setLoading(true);
      
      // 1. Try fetching from the main 'students' table first
      let { data: profile, error: profileError } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      // 2. FALLBACK: If missing from students, query the 'profiles' table where teacher entries often live
      if (!profile) {
        const { data: fallbackProfile, error: fallbackError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        
        if (fallbackProfile) {
          profile = fallbackProfile;
        }
      }

      if (profileError) {
        console.error("Supabase students table tracking error:", profileError);
      }

      setStudent(profile);

      // 3. Fetch related Tab Data only if a core record exists
      if (profile) {
        if (activeTab === 'feedback') {
          const { data } = await supabase
            .from("student_feedback")
            .select("*")
            .eq("student_id", id)
            .order('created_at', { ascending: false });
          setTabData(data || []);
        } else if (activeTab === 'assignments') {
          const { data } = await supabase
            .from("student_submissions")
            .select("*")
            .eq("student_id", id)
            .order('submitted_at', { ascending: false });
          setTabData(data || []);
        }
      }
      
    } catch (err) {
      console.error("Fetch execution error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !student) {
    return <div className="p-20 text-slate-400 font-black animate-pulse text-center">LOADING PROFILE...</div>;
  }

  return (
    <div className="p-10 bg-slate-50 min-h-screen font-sans">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all mb-8 group">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[11px] font-black uppercase tracking-widest">Back to Directory</span>
      </button>

      <div className="grid grid-cols-12 gap-8">
        {/* LEFT COLUMN */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-50 shadow-sm">
            {/* AVATAR SYSTEM (Can be modified or updated with an img tag by the student later) */}
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black mb-6 uppercase overflow-hidden">
              {student?.avatar_url ? (
                <img src={student.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                student?.name?.charAt(0) || student?.full_name?.charAt(0) || "?"
              )}
            </div>
            
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-1">
              {student?.name || student?.full_name || "Name Missing"}
            </h1>
            <p className="text-indigo-600 font-bold text-sm mb-8">
              {student?.class_name || "General Section"}
            </p>
            
            <div className="space-y-4 pt-6 border-t border-slate-50">
              <div className="flex items-center gap-4 text-slate-500">
                <div className="p-3 bg-slate-50 rounded-xl"><Mail size={16}/></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-300">Email</p>
                  <p className="text-sm font-bold">{student?.email || "No Email Found"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-500">
                <div className="p-3 bg-slate-50 rounded-xl"><Hash size={16}/></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-300">Student ID</p>
                  <p className="text-sm font-bold font-mono">{student?.student_id || "Not Assigned"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* PERFORMANCE ANALYTICS */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp size={20} className="text-indigo-400" />
              <h3 className="font-black uppercase tracking-widest text-[11px]">Performance Analytics</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Average Score</p>
                <p className="text-2xl font-black">{student?.average_score ?? 0}%</p>
              </div>
              <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Submissions</p>
                <p className="text-2xl font-black">{tabData.length}</p> 
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="flex gap-2 p-1.5 bg-slate-200/50 rounded-2xl w-fit">
            {(['feedback', 'assignments', 'history'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
                  activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-[3rem] border-2 border-slate-50 p-10 shadow-sm min-h-[500px]">
            {tabData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4"><FileText size={32} /></div>
                <p className="text-slate-400 font-medium text-sm italic">
                  No {activeTab} data found for {student?.name || student?.full_name || "this student"}.
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <h3 className="text-xl font-black tracking-tighter mb-6 capitalize">{activeTab} Details</h3>
                {tabData.map((item: any) => (
                  <div key={item.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{item.title || item.content}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">
                        {new Date(item.created_at || item.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    {item.grade && (
                      <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs">
                        {item.grade}/100
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}