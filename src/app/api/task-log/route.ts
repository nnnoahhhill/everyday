import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { uuidv7 } from "uuidv7";
import { NextResponse } from "next/server";

const schema = z.object({
  taskId: z.string().uuid(),
  localDate: z.string(), // Expecting YYYY-MM-DD
  status: z.enum(["DONE", "PARTIAL"]),
});


function normalizeDate(dateStr: string): Date {
  // Validate and normalize YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }
  
  const dateParts = dateStr.split('-');
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
  const day = parseInt(dateParts[2], 10);
  
  // Create date at midnight UTC to avoid timezone issues
  const date = new Date(Date.UTC(year, month, day));
  
  // Validate the date is valid
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  
  return date;
}

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const data = schema.parse(await req.json());

    const localDate = normalizeDate(data.localDate);

    // Verify task exists and belongs to user
    const task = await prisma.task.findFirst({
      where: { id: data.taskId, userId, active: true },
    });
    
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.taskDayLog.upsert({
      where: {
        taskId_localDate: {
          taskId: data.taskId,
          localDate: localDate,
        },
      },
      update: { 
        status: data.status,
        createdAt: new Date(), // Update the timestamp as per spec
      },
      create: {
        id: uuidv7(),
        taskId: data.taskId,
        userId,
        localDate: localDate,
        status: data.status,
        source: "USER",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    const localDateStr = searchParams.get("localDate");

    if (!taskId || !localDateStr) {
      return NextResponse.json({ error: "taskId and localDate are required" }, { status: 400 });
    }

    const localDate = normalizeDate(localDateStr);

    // Verify task exists and belongs to user
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.taskDayLog.deleteMany({
      where: {
        taskId,
        localDate,
        userId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
  }
}
