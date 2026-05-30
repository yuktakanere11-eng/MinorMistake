import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function StudentProfile() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    fetchUser();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Profile</h1>

      {user ? (
        <p>Email: {user.email}</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}