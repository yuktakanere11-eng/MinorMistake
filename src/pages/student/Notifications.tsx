import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Submissions.css";

const Submissions: React.FC = () => {
  const navigate = useNavigate();

  const submissions = [
    { id: 1, student: "John", status: "Pending" },
    { id: 2, student: "Asha", status: "Reviewed" },
  ];

  return (
    <div className="container">
      <h2>Submissions</h2>

      {submissions.map((sub) => (
        <div key={sub.id} className="card">
          <p>{sub.student}</p>
          <p>Status: {sub.status}</p>
          <button onClick={() => navigate(`/teacher/review/${sub.id}`)}>
            Review
          </button>
        </div>
      ))}
    </div>
  );
};

export default Submissions;