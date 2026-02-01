import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { NextResponse } from "next/server";

const updateSchema = z.object({
  listType: z.enum(["today", "tomorrow", "this_week", "this_month"]).optional(),
  doneByDate: z.string().optional().nullable(), // YYYY-MM-DD
  scheduledTime: z.string().optional().nullable(), // HH:mm
  order: z.number().int().optional(),
  status: z.enum(["pending", "completed", "pushed", "missed"]).optional(),
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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const rawData = await req.json();
    const data = updateSchema.parse(rawData);

    const updateData: any = {};
    if (data.listType !== undefined) updateData.listType = data.listType;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.doneByDate !== undefined) {
      updateData.doneByDate = data.doneByDate ? parseDate(data.doneByDate) : null;
    }
    if (data.scheduledTime !== undefined) {
      updateData.scheduledTime = data.scheduledTime 
        ? parseTime(data.scheduledTime, rawData.doneByDate || undefined)
        : null;
    }

    const todo = await prisma.todo.update({
      where: { id, userId },
      data: updateData,
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;

    // Remove from list (back to bank)
    await prisma.todo.delete({
      where: { id, userId },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
