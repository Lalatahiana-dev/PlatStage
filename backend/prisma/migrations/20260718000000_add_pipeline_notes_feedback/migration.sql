-- AlterEnum: Add new values to ApplicationStatus
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'REVIEWING';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'SHORTLISTED';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'INTERVIEW_SCHEDULED';

-- Add notes column to Application
ALTER TABLE "Application" ADD COLUMN "notes" TEXT;

-- Add feedback and timestamp columns to Interview
ALTER TABLE "Interview" ADD COLUMN "completed_at" TIMESTAMP(3);
ALTER TABLE "Interview" ADD COLUMN "rating" INTEGER;
ALTER TABLE "Interview" ADD COLUMN "strengths" TEXT;
ALTER TABLE "Interview" ADD COLUMN "weaknesses" TEXT;
ALTER TABLE "Interview" ADD COLUMN "feedback_notes" TEXT;
ALTER TABLE "Interview" ADD COLUMN "final_decision" TEXT;
ALTER TABLE "Interview" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Interview" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
