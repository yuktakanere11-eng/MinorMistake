// TEMP USER (NO AUTH — FLOW BASED)

export type CurrentUser = {
  fullName: string;
  institution: string;
  role: "teacher" | "student";
};

export async function getCurrentUserWithProfile(): Promise<CurrentUser | null> {
  try {
    const userStr = localStorage.getItem("user");

    if (!userStr) return null;

    const user: CurrentUser = JSON.parse(userStr);

    return user;
  } catch (error) {
    console.error("Error getting user from localStorage:", error);
    return null;
  }
}