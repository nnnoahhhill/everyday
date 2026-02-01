-- Drop foreign key constraints
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_user_id_fkey";
ALTER TABLE "TaskDayLog" DROP CONSTRAINT IF EXISTS "TaskDayLog_user_id_fkey";

-- AlterTable: Change User.id from UUID to TEXT (for Clerk user IDs)
ALTER TABLE "User" ALTER COLUMN "id" TYPE TEXT USING id::TEXT;
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable: Change Task.user_id from UUID to TEXT
ALTER TABLE "Task" ALTER COLUMN "user_id" TYPE TEXT USING user_id::TEXT;

-- AlterTable: Change TaskDayLog.user_id from UUID to TEXT  
ALTER TABLE "TaskDayLog" ALTER COLUMN "user_id" TYPE TEXT USING user_id::TEXT;

-- Recreate foreign key constraints
ALTER TABLE "Task" ADD CONSTRAINT "Task_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskDayLog" ADD CONSTRAINT "TaskDayLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
