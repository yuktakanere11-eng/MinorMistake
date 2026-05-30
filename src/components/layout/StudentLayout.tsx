import StudentSidebar from "./StudentSidebar";
import StudentHeader from "./StudentHeader"; // Ensure this matches the file name below
import { Outlet } from "react-router-dom";

export default function StudentLayout() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* 1. The Fixed Student Sidebar */}
      <StudentSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* 2. The Header */}
        <StudentHeader />

        {/* 3. The Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}