import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { uuidv7 } from "uuidv7";
import { NextResponse } from "next/server";

const schema = z.object({ name: z.string().min(1).max(50) });

async function ensureUser(userId: string) {
  // Ensure user exists in our database (sync with Clerk)
  // Clerk user IDs are like "user_3953cBpnciQgg0gWil8FJSHv777"
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      username: userId, // Use Clerk user ID as username (or extract from Clerk if needed)
    },
  });
}

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const body = schema.parse(await req.json());

    await ensureUser(userId);

    const count = await prisma.task.count({ 
      where: { 
        active: true, 
        userId,
        deletedAt: null, // Only count non-deleted tasks
      } 
    });
    if (count >= 20) {
      return NextResponse.json({ error: "Task limit reached" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        id: uuidv7(),
        name: body.name,
        userId,
      },
    });
    return NextResponse.json(task);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // Optional: filter logs by date
    const includeArchived = searchParams.get("archived") === "true";
    
    const tasks = await prisma.task.findMany({
      where: { 
        active: true, 
        userId,
        ...(includeArchived ? {} : { deletedAt: null }), // Only non-deleted unless archived=true
      },
      include: date ? {
        logs: {
          where: {
            localDate: new Date(date),
          },
          take: 1,
        },
      } : undefined,
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(tasks);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Tasks GET error:", error);
    return NextResponse.json({ 
      error: error.message || "Internal server error",
      details: process.env.NODE_ENV === "development" ? String(error) : undefined
    }, { status: 500 });
  }
}
