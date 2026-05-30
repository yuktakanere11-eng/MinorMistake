import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, User, LogOut, Settings, ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

interface HeaderProps {
  user?: any; // Expecting the full profile object (id, role, full_name, etc.)
}

export default function Header({ user }: HeaderProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Derive base path safely
  const basePath = user?.role === 'teacher' ? '/teacher' : '/student';

  // Click Outside Handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setShowProfileMenu(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Notifications
  useEffect(() => {
    if (!user?.id) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setNotifications(data);
    };
    fetchNotifications();
  }, [user?.id]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setIsLoggingOut(false);
    }
  };

  const handleNotificationClick = (n: any) => {
    setShowNotifications(false);
    let path = `${basePath}/dashboard`;
    if (n.type === 'grade_posted') path = `${basePath}/feedback/${n.submission_id}`;
    else if (n.type === 'new_assignment') path = `${basePath}/assignments`;
    navigate(path);
  };

  return (
    <header className="h-20 px-8 flex items-center justify-between bg-white border-b border-gray-100 relative z-50">
      {/* Search */}
      <div className="relative w-96">
        <form onSubmit={(e) => { e.preventDefault(); navigate(`${basePath}/assignments?q=${query}`); }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assignments..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
            aria-label="Search"
          />
        </form>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl py-4 z-[100]">
              <h3 className="px-4 font-bold text-sm mb-2 text-slate-900">Notifications</h3>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 text-xs text-gray-400 italic">No new activity</p>
                ) : (
                  notifications.map(n => (
                    <button key={n.id} onClick={() => handleNotificationClick(n)} className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 text-xs">
                      {n.title}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)} 
            className="flex items-center gap-3 pl-2 pr-4 py-1 rounded-xl hover:bg-gray-50 transition-all"
            aria-label="Profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs uppercase">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[100px]">{user?.full_name || "User"}</p>
              <p className="text-[10px] text-gray-400 capitalize">{user?.role || "Account"}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-[100] animate-in fade-in zoom-in duration-200">
              <button className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-gray-50 flex items-center gap-2">
                <Settings size={14} /> Account Settings
              </button>
              <div className="h-px bg-gray-50 my-1" />
              <button 
                onClick={handleLogout} 
                disabled={isLoggingOut}
                className="w-full px-4 py-2.5 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
              >
                {isLoggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />} 
                {isLoggingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}