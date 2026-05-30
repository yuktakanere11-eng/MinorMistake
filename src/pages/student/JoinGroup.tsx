import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import "../../styles/studentJoin.css";

export default function JoinClass() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!code) return alert("Enter class code");

    setLoading(true);

    // ✅ get class
    const { data: classData, error } = await supabase
      .from("classes")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !classData) {
      alert("Invalid class code");
      setLoading(false);
      return;
    }

    // ✅ get current user
    const { data: userData } = await supabase.auth.getUser();

    const studentId = userData?.user?.id;

    // ✅ insert into join table
    await supabase.from("student_classes").insert({
      student_id: studentId,
      class_id: classData.id,
    });

    alert("Joined successfully!");

    navigate("/student/dashboard");
  };

  return (
    <div className="join-page">

      <div className="card">

        <h1>Join a Class</h1>

        <p>
          Enter the class code provided by your teacher
        </p>

        <input
          type="text"
          placeholder="Enter class code (e.g. ABC123)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button onClick={handleJoin}>
          {loading ? "Joining..." : "Join Class"}
        </button>

      </div>

    </div>
  );
}