import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { X, Users, UserPlus, Check, Search, Loader2 } from "lucide-react";

interface Props {
  assignmentId: string;
  classId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TeamBuilderModal({ assignmentId, classId, onClose, onSuccess }: Props) {
  const [teamName, setTeamName] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAvailableStudents();
  }, []);

  const fetchAvailableStudents = async () => {
    setLoading(true);
    // Fetch students in this class
    const { data } = await supabase
      .from("students")
      .select("id, name")
      .eq("class_id", classId);
    
    setStudents(data || []);
    setLoading(false);
  };

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!teamName || selectedIds.length === 0) return;
    setSaving(true);

    // 1. Create the Group
    const { data: group, error: gError } = await supabase
      .from("assignment_groups")
      .insert({ 
        name: teamName, 
        assignment_id: assignmentId,
        class_id: classId 
      })
      .select()
      .single();

    if (gError) {
      console.error(gError);
      setSaving(false);
      return;
    }

    // 2. Link Students to the Group
    const members = selectedIds.map(studentId => ({
      group_id: group.id,
      student_id: studentId
    }));

    const { error: mError } = await supabase
      .from("group_members")
      .insert(members);

    if (!mError) {
      onSuccess();
      onClose();
    }
    setSaving(false);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-100">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 leading-none">Assemble Team</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Assignment Cluster</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Team Name Input */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Team Designation</label>
            <input 
              autoFocus
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-600 transition-all outline-none"
              placeholder="e.g. Studio Group A / Team Folium"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </div>

          {/* Student Selector */}
          <div className="space-y-4">
            <div className="flex justify-between items-end ml-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Members</label>
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{selectedIds.length} Selected</span>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input 
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-medium outline-none"
                placeholder="Find student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {loading ? (
                <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-200" /></div>
              ) : filteredStudents.map(student => (
                <button
                  key={student.id}
                  onClick={() => toggleStudent(student.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    selectedIds.includes(student.id)
                      ? "bg-purple-50 border-purple-200 shadow-sm"
                      : "bg-white border-slate-50 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${
                      selectedIds.includes(student.id) ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-400"
                    }`}>
                      {student.name[0]}
                    </div>
                    <span className={`text-sm font-bold ${selectedIds.includes(student.id) ? "text-purple-900" : "text-slate-600"}`}>
                      {student.name}
                    </span>
                  </div>
                  {selectedIds.includes(student.id) && <Check size={16} className="text-purple-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-8 bg-slate-50 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-white text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:text-slate-900 transition-all border border-slate-200"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || !teamName || selectedIds.length === 0}
            className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-purple-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
            Confirm Team
          </button>
        </div>
      </div>
    </div>
  );
}