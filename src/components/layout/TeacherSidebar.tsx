import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, BookOpen, 
  FileText, Settings, MessageSquare, BarChart3, LogOut 
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const menu = [
    { name: "Dashboard", path: "/teacher/dashboard", icon: LayoutDashboard },
    { name: "Classes", path: "/teacher/classes", icon: BookOpen },
    { name: "Assignments", path: "/teacher/assignments", icon: FileText },
    { name: "Students", path: "/teacher/students", icon: Users },
    { name: "Feedback", path: "/teacher/feedback", icon: MessageSquare },
    { name: "Analytics", path: "/teacher/analytics", icon: BarChart3 },
    { name: "Settings", path: "/teacher/settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-white border-r flex flex-col p-6 shrink-0 h-screen sticky top-0">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white font-black text-xl">M</div>
        <span className="font-bold text-xl tracking-tight text-slate-900">MinorMistake</span>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {menu.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl text-sm font-bold transition-all ${
                isActive 
                  ? "bg-purple-100 text-purple-600 shadow-sm" 
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </button>
          );
        })}

        {/* Log Out Button - Pushed to bottom via mt-auto */}
        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 p-3.5 rounded-2xl text-sm font-bold text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={20} />
          Log Out
        </button>
      </nav>
    </div>
  );
}