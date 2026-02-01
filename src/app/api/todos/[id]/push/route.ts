import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { uuidv7 } from "uuidv7";
import { NextResponse } from "next/server";

const pushSchema = z.object({
  toListType: z.enum(["today", "tomorrow", "this_week", "this_month"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const { toListType } = pushSchema.parse(await req.json());

    const todo = await prisma.todo.findFirst({
      where: { id, userId },
    });

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    // Record the push
    await prisma.todoPush.create({
      data: {
        id: uuidv7(),
        todoId: id,
        userId,
        fromListType: todo.listType,
        toListType,
      },
    });

    // Update todo to new list
    await prisma.todo.update({
      where: { id, userId },
      data: {
        listType: toListType,
        status: "pushed",
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
