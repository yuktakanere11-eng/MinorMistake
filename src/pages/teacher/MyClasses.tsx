import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { 
  Plus, Users, X, ArrowRight, CheckCircle2, 
  LayoutGrid, Loader2, MoreHorizontal, Edit2, Trash2, Archive, RotateCcw, Copy, Check
} from "lucide-react";

// 1. Added TypeScript Interface for better type safety
interface StudioClass {
  id: string;
  name: string;
  description?: string;
  teacher_id: string;
  is_archived: boolean;
  is_group_project: boolean;
  class_code: string;
  created_at?: string;
}

export default function ClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<StudioClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewArchived, setViewArchived] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState({ name: "", description: "" });
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1); 
  const [isGroupProject, setIsGroupProject] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdClass, setCreatedClass] = useState<StudioClass | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [newClass, setNewClass] = useState({ title: "", description: "" });
  const [groupCount, setGroupCount] = useState(4);

  // 2. Wrapped in useCallback to safely use inside useEffect dependency array
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const filtered = data.filter(cls => 
          viewArchived ? cls.is_archived === true : (cls.is_archived === false || cls.is_archived === null)
        );
        setClasses(filtered);
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
    } finally {
      setLoading(false);
    }
  }, [viewArchived]);

  useEffect(() => { 
    fetchClasses(); 
  }, [fetchClasses]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Added a clean reset function for the modal state
  const closeAndResetModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setStep(1);
      setNewClass({ title: "", description: "" });
      setIsGroupProject(false);
      setGroupCount(4);
      setCreatedClass(null);
    }, 200); // Wait for closing animation
  };

  const handleClassDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Permanently delete this studio? This action cannot be undone.")) {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (!error) fetchClasses();
    }
    setActiveMenuId(null);
  };

  const handleArchiveToggle = async (e: React.MouseEvent, id: string, shouldArchive: boolean) => {
    e.stopPropagation();
    const { error } = await supabase.from("classes").update({ is_archived: shouldArchive }).eq("id", id);
    if (!error) fetchClasses();
    setActiveMenuId(null);
  };

  const saveEditedTitle = async (id: string) => {
    if (!editValue.name.trim()) return;
    const { error } = await supabase.from("classes").update({ name: editValue.name }).eq("id", id);
    if (!error) {
      setEditingId(null);
      fetchClasses();
    } else {
      console.error("Failed to update title:", error);
    }
  };

  const finalizeClassCreation = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: classData, error: classError } = await supabase
        .from("classes")
        .insert([{ 
          name: newClass.title, 
          description: newClass.description,
          teacher_id: user.id,
          is_archived: false,
          is_group_project: isGroupProject,
          class_code: generatedCode
        }])
        .select().single();

      if (classError) throw classError;
      setCreatedClass(classData);

      if (isGroupProject) {
        const groups = Array.from({ length: groupCount }).map((_, i) => ({
          class_id: classData.id,
          name: `Team ${String.fromCharCode(65 + i)}`,
          group_code: Math.random().toString(36).substring(2, 8).toUpperCase()
        }));
        await supabase.from("groups").insert(groups);
      }
      setStep(3); 
      fetchClasses(); 
    } catch (err) { 
      console.error("Error creating studio:", err); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-10 bg-slate-50 min-h-screen font-sans">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">
            {viewArchived ? "Archived Studios" : "My Studios"}
          </h1>
          <button 
            onClick={() => setViewArchived(!viewArchived)} 
            className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors"
          >
            {viewArchived ? "View Active" : "View Archive"}
          </button>
        </div>
        {!viewArchived && (
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={18} /> Create Studio
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-200" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
               <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No studios found</p>
            </div>
          ) : (
            classes.map((cls) => (
              <div 
                key={cls.id} 
                className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden" 
                onClick={() => editingId !== cls.id && navigate(`/teacher/classes/${cls.id}`)}
              >
                {/* --- ACTION MENU --- */}
                <div className="absolute top-8 right-8 z-30">
                  <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === cls.id ? null : cls.id); }}>
                    <MoreHorizontal size={20} className="text-slate-300 hover:text-slate-600" />
                  </button>
                  {activeMenuId === cls.id && (
                    <div ref={menuRef} className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 overflow-hidden">
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(cls.id); setEditValue({ name: cls.name, description: cls.description || "" }); setActiveMenuId(null); }} className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                        <Edit2 size={14} /> Edit Title
                      </button>
                      <button onClick={(e) => handleArchiveToggle(e, cls.id, !viewArchived)} className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                        {viewArchived ? <RotateCcw size={14} /> : <Archive size={14} />} {viewArchived ? "Restore Studio" : "Archive Studio"}
                      </button>
                      <div className="h-px bg-slate-50 my-1 mx-2" />
                      <button onClick={(e) => handleClassDelete(e, cls.id)} className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-red-500 hover:bg-red-50 flex items-center gap-2">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-8 cursor-pointer">
                  <div className={`w-12 h-12 mb-6 ${cls.is_group_project ? 'bg-purple-50 text-purple-600' : 'bg-indigo-50 text-indigo-600'} rounded-2xl flex items-center justify-center`}>
                    {cls.is_group_project ? <Users size={24} /> : <LayoutGrid size={24} />}
                  </div>

                  {editingId === cls.id ? (
                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                      <input 
                        autoFocus 
                        className="w-full p-2 border-b-2 border-indigo-600 outline-none font-black text-xl uppercase" 
                        value={editValue.name} 
                        onChange={(e) => setEditValue({...editValue, name: e.target.value})} 
                        onKeyDown={(e) => e.key === 'Enter' && saveEditedTitle(cls.id)}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveEditedTitle(cls.id)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[9px] font-black">SAVE</button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 px-4 py-2 text-[9px] font-black">CANCEL</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">{cls.name}</h3>
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100" onClick={(e) => { e.stopPropagation(); copyToClipboard(cls.class_code); }}>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter hover:text-indigo-600 transition-colors">
                            {copiedId === cls.class_code ? "Copied!" : "Code:"}
                          </span>
                          <span className="text-xs font-black text-slate-700 tabular-nums">{cls.class_code}</span>
                        </div>
                        {cls.is_group_project && (
                           <span className="text-[9px] font-black uppercase text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full">Group Project</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- CREATION MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-12 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={closeAndResetModal} className="absolute right-10 top-10 text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
            
            {step === 1 && (
              <div className="space-y-8">
                <header className="text-center">
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Setup Studio</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Basic Information</p>
                </header>
                <div className="space-y-4">
                   <input 
                    placeholder="STUDIO TITLE" 
                    className="w-full p-6 bg-slate-50 rounded-2xl outline-none font-black text-lg uppercase placeholder:text-slate-300 border-2 border-transparent focus:border-indigo-600 transition-all" 
                    value={newClass.title} 
                    onChange={(e) => setNewClass({...newClass, title: e.target.value})} 
                  />
                   
                   <button 
                    onClick={() => setIsGroupProject(!isGroupProject)}
                    className={`w-full p-6 rounded-2xl border-2 flex items-center justify-between transition-all ${isGroupProject ? 'border-purple-600 bg-purple-50' : 'border-slate-100 bg-white'}`}
                   >
                     <div className="flex items-center gap-4 text-left">
                        <Users className={isGroupProject ? 'text-purple-600' : 'text-slate-400'} />
                        <div>
                           <p className={`font-black text-xs uppercase tracking-widest ${isGroupProject ? 'text-purple-600' : 'text-slate-900'}`}>Group Project</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase">Automate team creation</p>
                        </div>
                     </div>
                     <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isGroupProject ? 'border-purple-600 bg-purple-600' : 'border-slate-200'}`}>
                        {isGroupProject && <Check size={14} className="text-white" />}
                     </div>
                   </button>
                </div>
                <button 
                  disabled={!newClass.title}
                  onClick={() => isGroupProject ? setStep(2) : finalizeClassCreation()} 
                  className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-indigo-600 disabled:opacity-50 disabled:bg-slate-200 transition-all"
                >
                   {submitting ? <Loader2 className="animate-spin" /> : "Continue"} <ArrowRight size={18} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                 <header className="text-center">
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Team Config</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">How many groups do you need?</p>
                </header>
                <div className="flex items-center justify-center gap-8 py-10">
                   <button onClick={() => setGroupCount(Math.max(2, groupCount - 1))} className="w-16 h-16 rounded-full border-2 border-slate-100 flex items-center justify-center font-black text-2xl text-slate-400 hover:border-purple-600 hover:text-purple-600">-</button>
                   <span className="text-6xl font-black text-slate-900">{groupCount}</span>
                   <button onClick={() => setGroupCount(groupCount + 1)} className="w-16 h-16 rounded-full border-2 border-slate-100 flex items-center justify-center font-black text-2xl text-slate-400 hover:border-purple-600 hover:text-purple-600">+</button>
                </div>
                <button 
                  onClick={finalizeClassCreation} 
                  className="w-full py-6 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors"
                >
                   {submitting ? <Loader2 className="animate-spin" /> : "Finalize Studio"} <CheckCircle2 size={18} />
                </button>
              </div>
            )}

            {step === 3 && createdClass && (
               <div className="space-y-8 text-center py-4">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                     <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Studio Ready</h2>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto">Share this code with your students so they can join the studio.</p>
                  
                  <div 
                    onClick={() => copyToClipboard(createdClass.class_code)}
                    className="group bg-slate-50 p-8 rounded-3xl border-2 border-dashed border-slate-200 cursor-pointer hover:border-indigo-600 transition-all relative"
                  >
                     <span className="text-6xl font-black tracking-widest text-slate-900 tabular-nums">{createdClass.class_code}</span>
                     <div className="absolute top-4 right-4 text-slate-300 group-hover:text-indigo-600">
                        {copiedId ? <Check size={20} /> : <Copy size={20} />}
                     </div>
                  </div>

                  <button 
                    onClick={closeAndResetModal} 
                    className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-indigo-600 transition-colors"
                  >
                     Go to Dashboard
                  </button>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}