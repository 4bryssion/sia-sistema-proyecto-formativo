/*
  Warnings:

  - The `task_status` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `end_date` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('en_progreso', 'completada', 'no_completada');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "end_date" DATE NOT NULL,
DROP COLUMN "task_status",
ADD COLUMN     "task_status" "TaskStatus" NOT NULL DEFAULT 'en_progreso';
