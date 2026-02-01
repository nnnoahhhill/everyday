import { auth } from "@clerk/nextjs/server";

/**
 * Get the current authenticated user ID
 * Throws error if not authenticated
 */
export async function requireAuth() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  
  return userId;
}

/**
 * Get the current authenticated user ID (optional)
 * Returns null if not authenticated
 */
export async function getUserId() {
  const { userId } = await auth();
  return userId;
}
