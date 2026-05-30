import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, LogOut, Settings, ChevronDown } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function StudentHeader() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Riya");
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 1. Fetch User Profile & Handle Outside Clicks
  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (data?.full_name) setUserName(data.full_name);
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    getProfile();
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 2. Functional Search Redirect
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/student/assignments`, { state: { search: searchQuery } });
    }
  };

  // 3. Activated Sign Out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <header className="h-20 bg-white border-b border-slate-50 flex items-center justify-between px-8 shrink-0 sticky top-0 z-[100]">
      
      {/* SEARCH ACTIVATION */}
      <form onSubmit={handleSearch} className="relative w-96 group">
        <Search 
          className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
            searchQuery ? 'text-indigo-600' : 'text-slate-300 group-focus-within:text-indigo-400'
          }`} 
          size={18} 
        />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for tasks or feedback..." 
          className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-50 transition-all placeholder:text-slate-400"
        />
      </form>

      <div className="flex items-center gap-8">
        
        {/* NOTIFICATIONS LINK */}
        <button 
          onClick={() => navigate('/student/feedback')} 
          className="relative p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group active:scale-95"
        >
          <Bell size={22} />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse group-hover:scale-110"></span>
        </button>

        {/* PROFILE DROPDOWN SECTION */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)} 
            className={`flex items-center gap-4 p-1.5 pr-4 rounded-2xl transition-all ${
              showProfileMenu ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'hover:bg-slate-50'
            }`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs shadow-inner transition-colors ${
              showProfileMenu ? 'bg-indigo-500 text-white' : 'bg-indigo-600 text-white'
            }`}>
              {userName.substring(0, 2).toUpperCase()}
            </div>
            
            <div className="text-left hidden lg:block">
              <p className={`text-[11px] font-black uppercase tracking-tight leading-none ${showProfileMenu ? 'text-white' : 'text-slate-900'}`}>
                {userName}
              </p>
              <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${showProfileMenu ? 'text-indigo-300' : 'text-slate-400'}`}>
                Batch of 2026
              </p>
            </div>

            <ChevronDown size={14} className={`transition-transform duration-300 ${showProfileMenu ? 'rotate-180 text-white' : 'text-slate-300'}`} />
          </button>

          {/* DROPDOWN MENU */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-4 w-60 bg-white border border-slate-100 rounded-[2rem] shadow-2xl py-3 px-2 z-[110] animate-in fade-in zoom-in-95 duration-200">
              <div className="px-5 py-3 mb-2 border-b border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</p>
                <p className="text-xs font-bold text-emerald-500 uppercase mt-0.5">Active Student</p>
              </div>

              <button 
                onClick={() => { navigate('/student/settings'); setShowProfileMenu(false); }} 
                className="w-full flex items-center gap-3 px-5 py-4 text-slate-600 hover:bg-slate-50 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-colors"
              >
                <Settings size={16} className="text-slate-400" /> Settings
              </button>

              <button 
                onClick={handleSignOut} 
                className="w-full flex items-center gap-3 px-5 py-4 text-rose-500 hover:bg-rose-50 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-colors mt-1"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}