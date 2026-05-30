import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Send,    
  MessageSquareQuote,
  BarChart3, 
  Settings, 
  LogOut 
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function StudentSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
    { name: "My Classes", path: "/student/classes", icon: BookOpen },
    { name: "Assignments", path: "/student/assignments", icon: FileText },
    { name: "Submissions", path: "/student/submissions", icon: Send }, 
    { name: "Feedback", path: "/student/feedback", icon: MessageSquareQuote },
    { name: "Analytics", path: "/student/analytics", icon: BarChart3 }, 
    { name: "Settings", path: "/student/settings", icon: Settings },
  ];

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // --- LOGIC REWRITE ---
  const checkActive = (itemPath: string) => {
    const currentPath = location.pathname;

    // Special Case: If we are in a class workspace, highlight "Assignments"
    if (itemPath === "/student/assignments") {
      return currentPath === "/student/assignments" || currentPath.startsWith("/student/class/");
    }

    // Default: Exact match for other tabs
    return currentPath === itemPath;
  };

  return (
    <div className="w-72 bg-white border-r border-slate-100 flex flex-col p-8 shrink-0 h-screen sticky top-0">
      
      {/* BRANDING */}
      <div className="flex items-center gap-4 mb-12 px-2">
        <div className="w-11 h-11 bg-indigo-600 rounded-[14px] flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
          M
        </div>
        <div className="flex flex-col">
          <span className="font-black text-lg tracking-tight text-slate-900 leading-none">MinorMistake</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600/50 mt-1">Student</span>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto no-scrollbar">
        {menu.map((item) => {
          // Using the new checkActive logic
          const active = checkActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-4 px-4 py-4 rounded-[1.25rem] text-[13px] font-black uppercase tracking-widest transition-all duration-300 group ${
                active
                  ? "bg-slate-900 text-white shadow-2xl shadow-slate-200"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              }`}
            >
              <item.icon 
                size={18} 
                strokeWidth={active ? 3 : 2} 
                className={`${active ? "text-indigo-400" : "text-slate-300 group-hover:text-slate-500"} transition-colors`}
              />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="mt-auto pt-8 border-t border-slate-50">
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-[1.25rem] text-[13px] font-black uppercase tracking-widest text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all duration-300 group"
        >
          <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-rose-100 transition-colors">
            <LogOut size={18} />
          </div>
          Sign Out
        </button>
      </div>
    </div>
  );
}