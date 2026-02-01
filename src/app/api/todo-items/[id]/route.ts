import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { NextResponse } from "next/server";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  notes: z.string().optional(),
  intensity: z.enum(["chill", "moderate", "kinda_hard", "damn_son"]).optional(),
  daysNeeded: z.number().int().positive().optional().nullable(),
  isFun: z.boolean().optional(),
  isWork: z.boolean().optional(),
  isPlay: z.boolean().optional(),
  customLabels: z.array(z.string()).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const data = updateSchema.parse(await req.json());

    const item = await prisma.todoItem.update({
      where: { id, userId },
      data,
    });

    return NextResponse.json(item);
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

    // Soft delete
    await prisma.todoItem.update({
      where: { id, userId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
