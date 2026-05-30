import React from "react";
import "../../styles/ShareAssignment.css";

const ShareAssignment: React.FC = () => {
  const inviteCode = "ABC123";

  return (
    <div className="container">
      <h2>Share Assignment</h2>

      <p>Invite Code:</p>
      <div className="code-box">{inviteCode}</div>

      <button onClick={() => navigator.clipboard.writeText(inviteCode)}>
        Copy Code
      </button>
    </div>
  );
};

export default ShareAssignment;