import { useState } from "react";
import { analyzeSubmission } from "../lib/ai";

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runAI = async (content: string) => {
    setLoading(true);
    const res = await analyzeSubmission(content);
    setResult(res);
    setLoading(false);
  };

  return { runAI, result, loading };
}