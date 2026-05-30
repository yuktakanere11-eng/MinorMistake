import { useNavigate } from "react-router-dom";

const FeedbackList: React.FC = () => {
  const navigate = useNavigate();

  const feedbacks = ["Assignment 1", "Assignment 2"];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Feedback</h2>

      {feedbacks.map((f, i) => (
        <div key={i}>
          <p>{f}</p>
          <button onClick={() => navigate(`/student/feedback/${i}`)}>
            View Feedback
          </button>
        </div>
      ))}
    </div>
  );
};

export default FeedbackList;