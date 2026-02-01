-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Task_user_id_deleted_at_idx" ON "Task"("user_id", "deleted_at");
