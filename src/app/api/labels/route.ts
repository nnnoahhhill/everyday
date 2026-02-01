import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { uuidv7 } from "uuidv7";
import { NextResponse } from "next/server";

const createSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();

    const labels = await prisma.userLabel.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(labels);
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

    const label = await prisma.userLabel.create({
      data: {
        id: uuidv7(),
        userId,
        name: data.name,
        color: data.color || null,
      },
    });

    return NextResponse.json(label);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Label name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
