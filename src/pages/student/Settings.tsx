import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { 
  User, Settings, Bell, Lock, ShieldCheck, 
  Moon, Globe, Eye, Fingerprint, Mail, 
  Smartphone, Monitor, Key, LogOut 
} from "lucide-react";

export default function StudentSettings() {
  const [activeTab, setActiveTab] = useState("PROFILE");

  const tabs = [
    { id: "PROFILE", label: "Profile", icon: User },
    { id: "PREFERENCES", label: "Preferences", icon: Settings },
    { id: "NOTIFICATIONS", label: "Notifications", icon: Bell },
    { id: "PRIVACY", label: "Privacy", icon: ShieldCheck },
    { id: "ACCOUNT", label: "Account", icon: Lock },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 p-8">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Settings</h1>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mt-3 ml-1">
            System Configuration / Student v2.0
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Synced</p>
          <p className="text-xs font-bold text-slate-900 mt-1">May 23, 2026</p>
        </div>
      </div>

      {/* NAV TABS */}
      <div className="flex bg-slate-100/50 p-1.5 rounded-[2.5rem] border border-slate-200/50 w-fit">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-3 ${
                isActive 
                ? "bg-white text-slate-900 shadow-2xl shadow-slate-200 scale-[1.02]" 
                : "text-slate-400 hover:text-slate-600 hover:bg-white/40"
              }`}
            >
              <tab.icon size={14} strokeWidth={isActive ? 3 : 2} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTENT CANVAS */}
      <div className="bg-white border border-slate-100 rounded-[4rem] p-16 min-h-[650px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.02)]">
        {activeTab === "PROFILE" && <ProfileSection />}
        {activeTab === "PREFERENCES" && <PreferencesSection />}
        {activeTab === "NOTIFICATIONS" && <NotificationsSection />}
        {activeTab === "PRIVACY" && <PrivacySection />}
        {activeTab === "ACCOUNT" && <AccountSection />}
      </div>
    </div>
  );
}

// --- PROFILE SECTION ---
function ProfileSection() {
  const [profile, setProfile] = useState({
    full_name: "",
    student_id: "",
    department: "",
    cohort: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        setLoading(true);
        
        // 1. Get current authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) return;

        // 2. Fetch ONLY guaranteed core columns from 'profiles'
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name") 
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        // 3. Update state safely without querying non-existent columns
        if (profileData) {
          setProfile({
            full_name: profileData.full_name || "",
            student_id: "Click Sync to Link", 
            department: "Setup Pending", 
            cohort: "Unassigned" 
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "--";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between border-b border-slate-50 pb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Identity</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Public student credentials.</p>
        </div>
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black shadow-2xl">
            {loading ? "..." : getInitials(profile.full_name)}
          </div>
          <button className="px-8 py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Upload New</button>
        </div>
      </div>
      
      {loading ? (
        <div className="py-10 text-center animate-pulse">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Loading secure identity data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-10">
          <DataField label="Full Name" value={profile.full_name} onChange={(e: any) => setProfile({...profile, full_name: e.target.value})} />
          <DataField label="Student ID" value={profile.student_id} disabled placeholder="Pending Sync..." />
          <DataField label="Department" value={profile.department} disabled />
          <DataField label="Cohort" value={profile.cohort} disabled />
        </div>
      )}
    </div>
  );
}

// --- PREFERENCES ---
function PreferencesSection() {
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4">
      <SectionHead title="Environment" sub="Configure your visual workspace." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <OptionCard icon={Moon} title="Dark Mode" desc="Optimized for late-night sketching sessions." active />
        <OptionCard icon={Monitor} title="High Refresh" desc="Smoother animations for feedback transitions." />
        <OptionCard icon={Globe} title="Localization" desc="Current: English (Academic/Design Context)." />
      </div>
      <div className="p-8 bg-indigo-50/30 border border-indigo-100 rounded-[2.5rem] flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-white rounded-2xl text-indigo-600 shadow-sm"><Eye size={20} /></div>
          <div>
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Compact Interface</h4>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Minimize padding to see more sketch rolls at once.</p>
          </div>
        </div>
        <Toggle active={false} />
      </div>
    </div>
  );
}

// --- NOTIFICATIONS ---
function NotificationsSection() {
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4">
      <SectionHead title="Alert Hierarchy" sub="Manage how MinorMistake contacts you." />
      <div className="space-y-4">
        <NotifyRow icon={Mail} title="Email Digest" desc="Summary of instructor feedback and peer comments." />
        <NotifyRow icon={Smartphone} title="Mobile Push" desc="Immediate alerts for assignment deadlines." active />
        <NotifyRow icon={Bell} title="In-App Toast" desc="Live updates while you are in the workspace." active />
      </div>
    </div>
  );
}

// --- PRIVACY ---
function PrivacySection() {
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4">
      <SectionHead title="Security & Access" sub="Manage your data footprint and visibility." />
      <div className="grid grid-cols-2 gap-8">
        <div className="p-10 border-2 border-slate-50 rounded-[3rem] space-y-6">
          <Fingerprint size={32} className="text-slate-300" />
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Biometric Lock</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Require authentication before accessing private design feedback or draft sketch rolls.
          </p>
          <button className="px-6 py-3 bg-slate-50 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all">Enable TouchID</button>
        </div>
        <div className="p-10 border-2 border-indigo-600 bg-indigo-50/10 rounded-[3rem] space-y-6">
          <ShieldCheck size={32} className="text-indigo-600" />
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Portfolio Privacy</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Your sketch rolls are currently visible to all department members. Toggle to restrict access.
          </p>
          <div className="flex gap-3">
             <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Make Private</button>
             <button className="px-6 py-3 border border-indigo-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-600">Audit Logs</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- ACCOUNT ---
function AccountSection() {
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4">
      <SectionHead title="Credentials" sub="Update your primary login methods." />
      <div className="max-w-md space-y-8">
        <div className="space-y-6">
          <DataField label="Current Password" type="password" value="********" disabled />
          <DataField label="New Password" type="password" placeholder="MIN. 12 CHARACTERS" />
        </div>
        <div className="pt-6 border-t border-slate-50 flex items-center gap-4">
          <button className="flex-1 py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all">
            Update Credentials
          </button>
          <button className="p-5 border-2 border-red-50 text-red-400 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- UI COMPONENTS ---
function SectionHead({ title, sub }: any) {
  return (
    <div className="border-b border-slate-50 pb-8">
      <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">{title}</h2>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 leading-none">{sub}</p>
    </div>
  );
}

function DataField({ label, value, disabled, placeholder, type = "text", onChange }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
      <input 
        type={type}
        disabled={disabled} 
        value={value || ""} 
        onChange={onChange}
        readOnly={!onChange && !disabled}
        placeholder={placeholder}
        className={`w-full bg-slate-50 border-2 border-transparent rounded-3xl p-5 text-sm font-bold outline-none transition-all ${
          disabled || !onChange ? 'text-slate-400 cursor-not-allowed opacity-60' : 'text-slate-900 focus:bg-white focus:border-indigo-100 focus:shadow-xl focus:shadow-slate-100'
        }`} 
      />
    </div>
  );
}

function OptionCard({ icon: Icon, title, desc, active = false }: any) {
  return (
    <div className={`p-8 rounded-[3rem] border-2 transition-all cursor-pointer group ${active ? 'border-indigo-600 bg-indigo-50/20 shadow-xl shadow-indigo-50' : 'border-slate-50 hover:border-slate-200 bg-white'}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300 group-hover:text-slate-900 group-hover:bg-slate-100'}`}>
        <Icon size={24} />
      </div>
      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{title}</h4>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 leading-relaxed">{desc}</p>
    </div>
  );
}

function NotifyRow({ icon: Icon, title, desc, active = false }: any) {
  return (
    <div className="flex items-center justify-between p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:shadow-lg hover:shadow-slate-100/50 transition-all">
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><Icon size={20} /></div>
        <div>
          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{title}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{desc}</p>
        </div>
      </div>
      <Toggle active={active} />
    </div>
  );
}

// --- TOGGLE ---
function Toggle({ active }: { active: boolean }) {
  const [on, setOn] = useState(active);
  return (
    <button 
      type="button"
      onClick={() => setOn(!on)}
      className={`w-14 h-7 rounded-full relative transition-all duration-500 ${on ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-200'}`}
    >
      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-sm ${on ? 'left-8' : 'left-1'}`} />
    </button>
  );
}