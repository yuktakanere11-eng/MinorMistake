import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { 
  ChevronLeft, Plus, Search, GraduationCap, Loader2, UserPlus, Users, LayoutGrid, Copy, Check 
} from "lucide-react";

export default function TeacherClassDetails() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchStudioData() {
      if (!classId) return;
      setLoading(true);
      try {
        // 1. Fetch Class Basic Info
        const { data: classData } = await supabase
          .from('classes')
          .select('*')
          .eq('id', classId)
          .single();
        setClassInfo(classData);

        // 2. Fetch Teams if applicable
        if (classData?.is_group_project) {
          const { data: groupData } = await supabase
            .from('groups')
            .select('*')
            .eq('class_id', classId)
            .order('name');
          setGroups(groupData || []);
        }

        // 3. Fetch Designers + Group Mapping
        const { data: enrollData } = await supabase
          .from('class_enrollments')
          .select(`
            profiles:student_id ( id, full_name, avatar_url ),
            groups:group_id ( id, name )
          `)
          .eq('class_id', classId);
        
        const formattedStudents = enrollData?.map((e: any) => ({
          ...e.profiles,
          group_id: e.groups?.id || null,
          group_name: e.groups?.name || "Unassigned"
        })) || [];
        setStudents(formattedStudents);

        // 4. Fetch Statistics (Submission count)
        const { count: pendingCount } = await supabase
          .from('assignments_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', classId)
          .eq('status', 'pending');
        
        setStats({
          total: formattedStudents.length,
          pending: pendingCount || 0
        });

      } catch (error) {
        console.error("Studio Management Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStudioData();
  }, [classId]);

  const copyCode = () => {
    if (classInfo?.class_code) {
      navigator.clipboard.writeText(classInfo.class_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.group_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  return (
    <div className="p-10 bg-slate-50 min-h-screen font-sans">
      
      {/* --- HEADER SECTION --- */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/teacher/classes')} 
            className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                {classInfo?.name}
              </h1>
              <button 
                onClick={copyCode}
                className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-all"
              >
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">Entry Code:</span>
                <span className="text-xs font-black text-indigo-600 tabular-nums">{classInfo?.class_code || "---"}</span>
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-indigo-300" />}
              </button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              MinorMistake / Studio Management
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {classInfo?.is_group_project && (
            <button className="px-5 py-3 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-100">
              <Users size={14} /> Create Team
            </button>
          )}
          <button 
            onClick={() => navigate(`/teacher/assignments/create?classId=${classId}`)}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Plus size={14} /> New Assignment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- MAIN ROSTER CONTENT --- */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm min-h-[500px]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                {classInfo?.is_group_project ? "Project Teams" : "Designer Roster"} ({students.length})
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="text"
                  placeholder="Search designers..."
                  className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none w-64 focus:ring-2 focus:ring-indigo-500/10"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-6">
              {classInfo?.is_group_project ? (
                // GROUP PROJECT LAYOUT
                groups.map((group) => (
                  <div key={group.id} className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100">
                    <div className="flex justify-between items-center mb-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Users size={14} className="text-purple-600" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">{group.name}</h4>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {students.filter(s => s.group_id === group.id).map(student => (
                        <div 
                          key={student.id} 
                          className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
                          onClick={() => navigate(`/teacher/assignments/review/${student.id}`)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-black text-indigo-600 overflow-hidden">
                              {student.avatar_url ? <img src={student.avatar_url} className="w-full h-full object-cover" /> : student.full_name?.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-800 text-sm">{student.full_name}</span>
                          </div>
                          <GraduationCap size={18} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                // STANDARD INDIVIDUAL LAYOUT
                <div className="grid grid-cols-1 gap-3">
                  {filteredStudents.map((s) => (
                    <div 
                      key={s.id} 
                      className="flex items-center justify-between p-5 hover:bg-slate-50 rounded-2xl group border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                      onClick={() => navigate(`/teacher/assignments/review/${s.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center font-black text-indigo-600 text-lg overflow-hidden">
                          {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" /> : s.full_name?.charAt(0)}
                        </div>
                        <div>
                          <span className="font-black text-slate-800 text-base block">{s.full_name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Active Track</span>
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                        Review Portfolio
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- SIDEBAR METRICS --- */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-10">Live Analytics</h4>
              <div className="space-y-10">
                <div>
                  <p className="text-6xl font-black text-indigo-400 leading-none tabular-nums">{stats.total}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mt-3">Designers Enrolled</p>
                </div>
                <div className="h-px bg-white/10 w-12" />
                <div>
                  <p className="text-6xl font-black text-emerald-400 leading-none tabular-nums">{stats.pending}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mt-3">Awaiting Feedback</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-indigo-600 rounded-full blur-[80px] opacity-30" />
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Studio Description</h4>
             <p className="text-slate-600 text-sm font-medium leading-relaxed">
               {classInfo?.description || "No description provided for this studio."}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}