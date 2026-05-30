import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { 
  ChevronLeft, Loader2,
  Calendar, Clock, Check, Users, User, Info
} from "lucide-react";

export default function CreateAssignment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedClassId = searchParams.get("classId");

  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    class_id: preSelectedClassId || "",
    total_points: 100,
    due_date: "",
    due_time: "23:59",
    assignment_scope: "individual" // Defaulting to individual
  });

  useEffect(() => {
    async function getClasses() {
      const { data } = await supabase.from("classes").select("id, name").order("name");
      if (data) setClasses(data);
    }
    getClasses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in again.");

      const payload = {
        title: formData.title,
        description: formData.description,
        class_id: formData.class_id,
        teacher_id: user.id,
        total_points: Number(formData.total_points),
        due_date: `${formData.due_date}T${formData.due_time}:00`,
        assignment_scope: formData.assignment_scope, // Sending scope to DB
        status: 'Active'
      };

      const { error } = await supabase.from("assignments").insert([payload]);
      if (error) throw error;
      
      navigate("/teacher/assignments");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-10 font-sans min-h-screen bg-slate-50">
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:text-indigo-600 transition-all">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Create New Assignment</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-sm space-y-10">
        {/* Title Input */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Assignment Title</label>
          <input 
            required name="title" value={formData.title} onChange={handleChange}
            className="w-full px-8 py-6 bg-slate-50/50 border-none rounded-[2rem] text-xl font-bold outline-none focus:bg-white transition-all placeholder:text-slate-200"
            placeholder="e.g. Industrial Design Jury Preparation"
          />
        </div>

        {/* Scope Selection (Moved from Class Level to Assignment Level) */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Submission Scope</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, assignment_scope: "individual" })}
              className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all ${
                formData.assignment_scope === "individual" ? "border-indigo-600 bg-indigo-50/30" : "border-slate-50 bg-white"
              }`}
            >
              <div className={`p-3 rounded-xl ${formData.assignment_scope === "individual" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                <User size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-slate-900">Individual</p>
                <p className="text-[10px] font-medium text-slate-400">Standard single-person submission</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, assignment_scope: "team" })}
              className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all ${
                formData.assignment_scope === "team" ? "border-purple-600 bg-purple-50/30" : "border-slate-50 bg-white"
              }`}
            >
              <div className={`p-3 rounded-xl ${formData.assignment_scope === "team" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                <Users size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-slate-900">Team-Based</p>
                <p className="text-[10px] font-medium text-slate-400">Collaborative group project</p>
              </div>
            </button>
          </div>
        </div>

        {/* Class and Points */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Select Studio Class</label>
            <select 
              required name="class_id" value={formData.class_id} onChange={handleChange}
              className="w-full px-8 py-5 bg-slate-50/50 border-none rounded-[1.5rem] text-sm font-bold outline-none cursor-pointer"
            >
              <option value="" disabled>Choose a studio class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Total Points</label>
            <input 
              type="number" name="total_points" value={formData.total_points} onChange={handleChange}
              className="w-full px-8 py-5 bg-slate-50/50 border-none rounded-[1.5rem] text-sm font-bold outline-none"
            />
          </div>
        </div>

        {/* Description / Brief */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Assignment Brief</label>
          <div className="relative">
            <Info className="absolute right-6 top-5 text-slate-200" size={20} />
            <textarea 
              name="description" value={formData.description} onChange={handleChange}
              rows={4}
              className="w-full px-8 py-6 bg-slate-50/50 border-none rounded-[1.5rem] text-sm font-medium outline-none focus:bg-white transition-all resize-none"
              placeholder="Detail the jury expectations or submission requirements..."
            />
          </div>
        </div>

        {/* Dates and Times */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Due Date</label>
            <div className="relative">
              <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                required type="date" name="due_date" value={formData.due_date} onChange={handleChange}
                className="w-full pl-16 pr-8 py-5 bg-slate-50/50 border-none rounded-[1.5rem] text-sm font-bold outline-none"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Due Time</label>
            <div className="relative">
              <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="time" name="due_time" value={formData.due_time} onChange={handleChange}
                className="w-full pl-16 pr-8 py-5 bg-slate-50/50 border-none rounded-[1.5rem] text-sm font-bold outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-6 pt-6">
          <button type="button" onClick={() => navigate(-1)} className="text-xs font-black uppercase tracking-widest text-slate-400">Cancel</button>
          <button 
            type="submit" disabled={loading}
            className={`px-12 py-5 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all disabled:opacity-50 ${
              formData.assignment_scope === 'team' ? 'bg-purple-600 shadow-purple-100 hover:bg-purple-700' : 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700'
            } hover:-translate-y-1`}
          >
            {loading ? <Loader2 className="animate-spin inline mr-2" size={16} /> : <Check className="inline mr-2" size={16} />}
            {loading ? "Creating..." : "Create Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
}