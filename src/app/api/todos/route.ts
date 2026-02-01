import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { uuidv7 } from "uuidv7";
import { NextResponse } from "next/server";

const createSchema = z.object({
  todoItemId: z.string().uuid(),
  listType: z.enum(["today", "tomorrow", "this_week", "this_month"]),
  doneByDate: z.string().optional(), // YYYY-MM-DD
  scheduledTime: z.string().optional(), // HH:mm
  order: z.number().int().default(0),
});

function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function parseTime(timeString: string, dateString?: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  if (dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, hours, minutes));
  }
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
}

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const listType = searchParams.get("listType") as "today" | "tomorrow" | "this_week" | "this_month" | null;

    const where: any = { userId };
    if (listType) {
      where.listType = listType;
    }

    const todos = await prisma.todo.findMany({
      where,
      include: {
        todoItem: true,
      },
      orderBy: [
        { order: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json(todos);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const data = createSchema.parse(await req.json());

    // Verify todo item exists and belongs to user
    const todoItem = await prisma.todoItem.findFirst({
      where: { id: data.todoItemId, userId, deletedAt: null },
    });

    if (!todoItem) {
      return NextResponse.json({ error: "Todo item not found" }, { status: 404 });
    }

    const todo = await prisma.todo.create({
      data: {
        id: uuidv7(),
        userId,
        todoItemId: data.todoItemId,
        listType: data.listType,
        doneByDate: data.doneByDate ? parseDate(data.doneByDate) : null,
        scheduledTime: data.scheduledTime 
          ? parseTime(data.scheduledTime, data.doneByDate || undefined)
          : null,
        order: data.order,
        status: "pending",
      },
      include: {
        todoItem: true,
      },
    });

    return NextResponse.json(todo);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
