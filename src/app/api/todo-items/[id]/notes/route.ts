import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { uuidv7 } from "uuidv7";
import { NextResponse } from "next/server";

const noteSchema = z.object({
  note: z.string().min(1).max(5000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const { note } = noteSchema.parse(await req.json());

    // Verify todo item exists and belongs to user
    const todoItem = await prisma.todoItem.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!todoItem) {
      return NextResponse.json({ error: "Todo item not found" }, { status: 404 });
    }

    // Add to note history
    const noteHistory = await prisma.todoNoteHistory.create({
      data: {
        id: uuidv7(),
        todoItemId: id,
        userId,
        note,
      },
    });

    // Update main notes field (append or replace - you can decide)
    await prisma.todoItem.update({
      where: { id },
      data: {
        notes: todoItem.notes ? `${todoItem.notes}\n\n${new Date().toISOString()}: ${note}` : note,
      },
    });

    return NextResponse.json(noteHistory);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;

    const history = await prisma.todoNoteHistory.findMany({
      where: {
        todoItemId: id,
        userId,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(history);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
