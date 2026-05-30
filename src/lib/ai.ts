export type AIFeedback = {
  summary: string;
  mistakes: {
    type: string;
    comment: string;
  }[];
};

export async function analyzeSubmission(content: string): Promise<AIFeedback> {
  // ✅ Use content (removes TS warning + useful for debugging)
  console.log("AI analyzing content:", content);

  // 🧠 TEMP MOCK AI (replace with real API later)
  return {
    summary: "Overall good work, but needs improvement in clarity.",
    mistakes: [
      { type: "Concept", comment: "Concept not fully explained." },
      { type: "Presentation", comment: "Layout is inconsistent." },
      { type: "Creativity", comment: "Try more innovative approach." },
    ],
  };
}