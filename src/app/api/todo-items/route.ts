import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { uuidv7 } from "uuidv7";
import { NextResponse } from "next/server";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  notes: z.string().optional(),
  intensity: z.enum(["chill", "moderate", "kinda_hard", "damn_son"]).optional(),
  daysNeeded: z.number().int().positive().optional().nullable(),
  isFun: z.boolean().optional(),
  isWork: z.boolean().optional(),
  isPlay: z.boolean().optional(),
  customLabels: z.array(z.string()).optional().default([]),
  earliestStart: z.string().datetime().optional().nullable(),
  latest: z.string().datetime().optional().nullable(),
});

const updateSchema = createSchema.partial();

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const includeDeleted = searchParams.get("archived") === "true";

    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    const orderBy: any = {};
    if (sortBy === "earliestStart") {
      orderBy.earliestStart = sortOrder;
    } else if (sortBy === "latest") {
      orderBy.latest = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const items = await prisma.todoItem.findMany({
      where: {
        userId,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy,
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("GET /api/todo-items error:", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ 
      error: error.message || "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const rawData = await req.json();
    const data = createSchema.parse(rawData);

    const item = await prisma.todoItem.create({
      data: {
        id: uuidv7(),
        userId,
        title: data.title,
        description: data.description || null,
        notes: data.notes || null,
        intensity: data.intensity || "moderate",
        daysNeeded: data.daysNeeded ?? null,
        isFun: data.isFun ?? false,
        isWork: data.isWork ?? false,
        isPlay: data.isPlay ?? false,
        customLabels: data.customLabels || [],
        earliestStart: data.earliestStart ? new Date(data.earliestStart) : null,
        latest: data.latest ? new Date(data.latest) : null,
      },
      include: {
        todos: true,
        completions: true,
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("POST /api/todo-items error:", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.name === "ZodError") {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.errors 
      }, { status: 400 });
    }
    return NextResponse.json({ 
      error: error.message || "Failed to create item",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 400 });
  }
}
