import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { 
  User, Shield, Bell, Globe, 
  Camera, Loader2, CheckCircle2, Lock, Eye, EyeOff, 
  Smartphone, Mail, ChevronRight
} from "lucide-react";

type TabType = "Profile" | "Security" | "Notifications" | "Language";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("Profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Profile State
  const [formData, setFormData] = useState({ fullName: "", email: "", avatarUrl: "" });
  
  // Security State
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // Notifications State
  const [notifs, setNotifs] = useState({
    submissions: true,
    reports: false,
    messages: true
  });

  // Language State
  const [selectedLang, setSelectedLang] = useState("English (Metric)");

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setFormData({
        fullName: user.user_metadata?.full_name || "", 
        email: user.email || "", 
        avatarUrl: user.user_metadata?.avatar_url || "" 
      });
    }
    setLoading(false);
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });
      if (updateError) throw updateError;
      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Upload failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateName = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: formData.fullName }
    });
    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  const handleUpdatePassword = async () => {
    if (!password || password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: password });
    if (error) {
      alert(error.message);
    } else {
      setSuccess(true);
      setPassword("");
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-purple-600" size={32} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-10 font-sans min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Settings</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Personalize your teacher profile and studio settings.</p>
        </div>

        <nav className="flex bg-slate-200/50 p-1.5 rounded-[1.5rem] backdrop-blur-sm border border-slate-200/50">
          {(["Profile", "Security", "Notifications", "Language"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                activeTab === tab ? "bg-white text-purple-600 shadow-xl shadow-purple-500/10" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <div className="bg-white rounded-[3.5rem] p-8 md:p-16 border border-slate-100 shadow-2xl shadow-slate-200/50 min-h-[600px] relative overflow-hidden">
        
        {activeTab === "Profile" && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row items-center gap-10 pb-10 border-b border-slate-50">
              <div className="relative group">
                <div className="h-32 w-32 rounded-[2.5rem] bg-purple-50 overflow-hidden flex items-center justify-center border-8 border-white shadow-2xl transition-transform group-hover:scale-105 duration-500">
                  {formData.avatarUrl ? (
                    <img key={formData.avatarUrl} src={`${formData.avatarUrl}?t=${new Date().getTime()}`} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-purple-600 uppercase">{formData.fullName[0] || formData.email[0]}</span>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-purple-600 p-3 rounded-2xl shadow-xl border-4 border-white cursor-pointer hover:bg-purple-700 transition-all active:scale-90">
                  <Camera size={20} className="text-white" />
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                </label>
              </div>
              <div className="text-center md:text-left space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase">Profile Picture</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Industrial Design showcase avatar. Max 2MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-2">Full Name</label>
                <input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full p-5 bg-slate-50 rounded-[1.5rem] text-sm font-bold border-2 border-transparent focus:border-purple-100 focus:bg-white transition-all outline-none" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-2">Email Address</label>
                <input type="text" readOnly value={formData.email} className="w-full p-5 bg-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-400 cursor-not-allowed border-2 border-transparent" />
              </div>
            </div>

            <button onClick={handleUpdateName} disabled={saving} className={`w-full py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] transition-all flex items-center justify-center gap-3 shadow-2xl ${success ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
              {saving ? <Loader2 className="animate-spin" size={20} /> : success ? "Profile Updated" : "Update Settings"}
            </button>
          </div>
        )}

        {activeTab === "Security" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* PASSWORD UPDATE */}
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                <div className="flex items-center gap-4 text-purple-600">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><Lock size={20} /></div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900">Update Password</span>
                </div>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New Password" className="w-full p-5 bg-white rounded-2xl border border-slate-200 outline-none pr-14 font-bold text-sm" />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600">{showPass ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                </div>
                <button onClick={handleUpdatePassword} disabled={saving} className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-colors ${success ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-purple-600'}`}>
                  {saving ? "Updating..." : "Save Password"}
                </button>
              </div>

              {/* MFA SECTION */}
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-purple-600"><Smartphone size={24} /></div>
                  <h4 className="text-lg font-black text-slate-900 uppercase">Two-Factor Auth</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">Add verification for your feedback logs.</p>
                </div>
                <button 
                  onClick={() => setMfaEnabled(!mfaEnabled)} 
                  className={`mt-8 flex items-center justify-between w-full p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${mfaEnabled ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-100 text-slate-400'}`}
                >
                  {mfaEnabled ? "Enabled" : "Disabled"} <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Notifications" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {(Object.keys(notifs) as Array<keyof typeof notifs>).map((id) => (
              <div key={id} onClick={() => setNotifs({...notifs, [id]: !notifs[id]})} className="flex justify-between items-center p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 cursor-pointer group hover:border-purple-100 transition-all">
                <h4 className="font-black text-slate-900 text-xs tracking-widest uppercase">{id}</h4>
                <div className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors duration-300 ${notifs[id] ? 'bg-purple-600 shadow-inner shadow-purple-800' : 'bg-slate-300'}`}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${notifs[id] ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Language" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
            {["English (Metric)", "English (Imperial)", "French (EU)", "German"].map((lang) => (
              <button key={lang} onClick={() => setSelectedLang(lang)} className={`p-8 rounded-[2.5rem] border-2 text-left font-black transition-all flex justify-between items-center ${selectedLang === lang ? "border-purple-600 bg-purple-50/50 text-purple-900" : "border-slate-50 text-slate-300"}`}>
                <span className="text-sm">{lang}</span>
                {selectedLang === lang && <CheckCircle2 size={24} className="text-purple-600" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}