import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { ChevronLeft, Save, Loader2, Info } from "lucide-react";

export default function EditAssignment() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignment_scope: "individual", // individual or team
    due_date: ""
  });

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      setFormData({
        title: data.title,
        description: data.description || "",
        assignment_scope: data.assignment_scope,
        due_date: data.due_date ? data.due_date.split('T')[0] : ""
      });
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("assignments")
      .update(formData)
      .eq("id", id);

    if (!error) {
      navigate(`/teacher/assignments/${id}`); // Go back to detail view
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-10 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div className="space-y-2">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all"
          >
            <ChevronLeft size={14} /> Cancel Changes
          </button>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">Edit Project Brief</h1>
        </div>
      </header>

      <form onSubmit={handleUpdate} className="space-y-8 bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
        
        {/* Title */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assignment Title</label>
          <input 
            required
            className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl text-lg font-bold focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        {/* Scope Selection */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData({...formData, assignment_scope: 'individual'})}
            className={`p-6 rounded-3xl border-2 transition-all flex flex-col gap-2 ${
              formData.assignment_scope === 'individual' 
              ? 'border-indigo-600 bg-indigo-50/50' 
              : 'border-slate-50 bg-slate-50 opacity-50'
            }`}
          >
            <span className="font-black text-xs uppercase tracking-widest">Individual</span>
            <span className="text-[10px] font-medium text-slate-500">Each student submits their own work.</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({...formData, assignment_scope: 'team'})}
            className={`p-6 rounded-3xl border-2 transition-all flex flex-col gap-2 ${
              formData.assignment_scope === 'team' 
              ? 'border-purple-600 bg-purple-50/50' 
              : 'border-slate-50 bg-slate-50 opacity-50'
            }`}
          >
            <span className="font-black text-xs uppercase tracking-widest">Team Project</span>
            <span className="text-[10px] font-medium text-slate-500">Cluster students into collaborative groups.</span>
          </button>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">The Brief (Description)</label>
          <textarea 
            rows={6}
            className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2rem] text-sm font-medium leading-relaxed focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        {/* Info Box */}
        <div className="p-6 bg-blue-50 rounded-[2rem] flex gap-4 items-start border border-blue-100">
            <Info className="text-blue-500 mt-1" size={20} />
            <p className="text-xs font-medium text-blue-700 leading-relaxed">
                Updating the project scope (Individual vs Team) will not delete existing teams, but it will change how the jury board displays submissions.
            </p>
        </div>

        <button 
          type="submit"
          disabled={saving}
          className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Update Assignment Details
        </button>

      </form>
    </div>
  );
}