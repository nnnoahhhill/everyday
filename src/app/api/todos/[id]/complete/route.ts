import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { uuidv7 } from "uuidv7";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;

    const todo = await prisma.todo.findFirst({
      where: { id, userId },
      include: { todoItem: true },
    });

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    // Mark as completed
    await prisma.todo.update({
      where: { id, userId },
      data: { status: "completed" },
    });

    // Create completion record
    const wasOnTime = todo.doneByDate 
      ? new Date() <= todo.doneByDate
      : true;

    await prisma.todoCompletion.create({
      data: {
        id: uuidv7(),
        todoId: id,
        todoItemId: todo.todoItemId,
        userId,
        completedAt: new Date(),
        wasOnTime,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
