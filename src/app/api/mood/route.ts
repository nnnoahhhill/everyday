import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { uuidv7 } from "uuidv7";
import { NextResponse } from "next/server";

const postSchema = z.object({
  feelings: z.array(z.string()).min(1),
  rating: z.number().min(0).max(10),
  notes: z.string().optional(),
  localDate: z.string(), // YYYY-MM-DD
});

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const data = postSchema.parse(await req.json());

    const localDate = parseLocalDate(data.localDate);

    const mood = await prisma.dailyMood.upsert({
      where: {
        userId_localDate: {
          userId,
          localDate,
        },
      },
      update: {
        feelings: data.feelings,
        rating: data.rating,
        notes: data.notes,
      },
      create: {
        id: uuidv7(),
        userId,
        localDate,
        feelings: data.feelings,
        rating: data.rating,
        notes: data.notes,
      },
    });

    return NextResponse.json(mood);
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
    const date = searchParams.get("date");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (date) {
      // Get mood for specific date
      const localDate = parseLocalDate(date);
      const mood = await prisma.dailyMood.findUnique({
        where: {
          userId_localDate: {
            userId,
            localDate,
          },
        },
      });
      return NextResponse.json(mood || null);
    }

    if (start && end) {
      // Get mood history
      const startDate = parseLocalDate(start);
      const endDate = parseLocalDate(end);
      const moods = await prisma.dailyMood.findMany({
        where: {
          userId,
          localDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { localDate: "asc" },
      });
      return NextResponse.json(moods);
    }

    // Get today's mood
    const today = parseLocalDate(new Date().toISOString().split('T')[0]);
    const mood = await prisma.dailyMood.findUnique({
      where: {
        userId_localDate: {
          userId,
          localDate: today,
        },
      },
    });
    return NextResponse.json(mood || null);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
