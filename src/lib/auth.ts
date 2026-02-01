import { cookies } from "next/headers";

export async function requireAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("tide_session")?.value;
  if (session !== "admin") {
    throw new Error("UNAUTHORIZED");
  }
}
