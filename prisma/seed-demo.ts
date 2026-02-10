import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { uuidv7 } from "uuidv7";

// Load environment variables from .env files
config();

// Allow override with PROD_DATABASE_URL for production seeding
const databaseUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or PROD_DATABASE_URL environment variable is not set");
}

const isProduction = !!process.env.PROD_DATABASE_URL;
if (isProduction) {
  console.log("⚠️  PRODUCTION MODE: Seeding production database!");
  console.log("   Database:", databaseUrl.replace(/:[^:@]+@/, ":****@"));
}

const pool = new pg.Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

const DEMO_USER_EMAIL = "kiakaha17@gmail.com";
const DEMO_USER_ID = "user_398w1amfd0BNNehWkBGyak9ePT4"; // Real Clerk user ID

const TASKS = [
  "Bathroom routine",
  "Organize laundry/clothes",
  "Clean bedroom",
  "Clean sink/dishes",
  "Drink 2 bottles water",
  "Take vitamins",
  "Make bed",
  "Wipe down kitchen counters",
  "Take out trash",
  "10 minute walk",
];

// Generate random completion data for a date range
function generateCompletionData(
  startDate: Date,
  endDate: Date,
  taskId: string,
  userId: string,
  completionRate: number // 0-1, probability of completion
) {
  const logs: Array<{
    id: string;
    taskId: string;
    userId: string;
    localDate: Date;
    status: "DONE" | "PARTIAL";
    source: string;
    createdAt: Date;
  }> = [];

  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Skip some days randomly (simulate not using app every day)
    if (Math.random() < 0.15) {
      // 15% chance of skipping a day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      continue;
    }

    // Determine if task was completed
    if (Math.random() < completionRate) {
      // Determine if DONE or PARTIAL (80% DONE, 20% PARTIAL)
      const status = Math.random() < 0.8 ? "DONE" : "PARTIAL";
      
      // Random time during the day for completion
      const completedAt = new Date();
      completedAt.setUTCFullYear(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate()
      );
      completedAt.setUTCHours(
        8 + Math.floor(Math.random() * 12), // Between 8 AM and 8 PM UTC
        Math.floor(Math.random() * 60),
        Math.floor(Math.random() * 60)
      );

      // Normalize localDate to midnight UTC (date only, no time)
      const localDate = new Date(Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate()
      ));

      logs.push({
        id: uuidv7(),
        taskId,
        userId,
        localDate,
        status,
        source: "USER",
        createdAt: completedAt,
      });
    }

    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return logs;
}

async function main() {
  console.log("🌱 Seeding demo data for", DEMO_USER_EMAIL);

  // Delete any existing user with conflicting username (for clean demo data)
  const existingUserByUsername = await prisma.user.findUnique({
    where: { username: DEMO_USER_EMAIL.split("@")[0] },
  });
  
  if (existingUserByUsername && existingUserByUsername.id !== DEMO_USER_ID) {
    console.log(`⚠️  Deleting existing user with username "${DEMO_USER_EMAIL.split("@")[0]}" (ID: ${existingUserByUsername.id})`);
    // Delete all related data first
    await prisma.taskDayLog.deleteMany({ where: { userId: existingUserByUsername.id } });
    await prisma.task.deleteMany({ where: { userId: existingUserByUsername.id } });
    await prisma.user.delete({ where: { id: existingUserByUsername.id } });
  }

  // Create or update user
  const user = await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {
      email: DEMO_USER_EMAIL,
      username: DEMO_USER_EMAIL.split("@")[0],
    },
    create: {
      id: DEMO_USER_ID,
      email: DEMO_USER_EMAIL,
      username: DEMO_USER_EMAIL.split("@")[0],
    },
  });

  console.log("✅ User created/updated:", user.email);

  // Delete existing tasks and logs for this user (clean slate)
  await prisma.taskDayLog.deleteMany({
    where: { userId: DEMO_USER_ID },
  });
  await prisma.task.deleteMany({
    where: { userId: DEMO_USER_ID },
  });

  // Create tasks
  const tasks = [];
  for (const taskName of TASKS) {
    const task = await prisma.task.create({
      data: {
        id: uuidv7(),
        name: taskName,
        userId: DEMO_USER_ID,
        active: true,
      },
    });
    tasks.push(task);
    console.log("✅ Created task:", task.name);
  }

  // Generate 3 months of completion data
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);

  console.log(`📅 Generating logs from ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`);

  // Different completion rates for different tasks (more realistic)
  const completionRates = [
    0.95, // Bathroom routine - very consistent
    0.60, // Organize laundry/clothes - moderate
    0.70, // Clean bedroom - fairly consistent
    0.85, // Clean sink/dishes - very consistent
    0.90, // Drink 2 bottles water - very consistent
    0.75, // Take vitamins - fairly consistent
    0.65, // Make bed - moderate
    0.55, // Wipe down kitchen counters - less consistent
    0.50, // Take out trash - less consistent
    0.40, // 10 minute walk - least consistent
  ];

  let totalLogs = 0;
  for (let i = 0; i < tasks.length; i++) {
    const logs = generateCompletionData(
      startDate,
      endDate,
      tasks[i].id,
      DEMO_USER_ID,
      completionRates[i]
    );

    if (logs.length > 0) {
      await prisma.taskDayLog.createMany({
        data: logs,
      });
      totalLogs += logs.length;
      console.log(`✅ Created ${logs.length} logs for "${tasks[i].name}"`);
    }
  }

  console.log(`\n🎉 Done! Created ${tasks.length} tasks and ${totalLogs} completion logs`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
