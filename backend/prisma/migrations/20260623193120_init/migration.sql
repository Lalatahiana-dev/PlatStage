-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('ONLINE', 'ON_SITE');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_APPLICATION', 'ACCEPTED', 'REFUSED', 'NEW_MESSAGE');

-- CreateTable
CREATE TABLE "User" (
    "id_user" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "Role" (
    "id_role" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id_role")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id_user_role" SERIAL NOT NULL,
    "id_user" INTEGER NOT NULL,
    "id_role" INTEGER NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id_user_role")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id_student" SERIAL NOT NULL,
    "phone" TEXT,
    "university" TEXT,
    "level" TEXT,
    "cv_url" TEXT,
    "address" TEXT,
    "photo_url" TEXT,
    "id_user" INTEGER NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id_student")
);

-- CreateTable
CREATE TABLE "Company" (
    "id_company" SERIAL NOT NULL,
    "company_name" TEXT NOT NULL,
    "sector" TEXT,
    "description" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "address" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "id_user" INTEGER NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id_company")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id_skill" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id_skill")
);

-- CreateTable
CREATE TABLE "StudentSkill" (
    "id_student_skill" SERIAL NOT NULL,
    "id_student" INTEGER NOT NULL,
    "id_skill" INTEGER NOT NULL,

    CONSTRAINT "StudentSkill_pkey" PRIMARY KEY ("id_student_skill")
);

-- CreateTable
CREATE TABLE "Category" (
    "id_category" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id_category")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id_offer" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "location" TEXT,
    "salary" DOUBLE PRECISION,
    "deadline" TIMESTAMP(3),
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "id_company" INTEGER NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id_offer")
);

-- CreateTable
CREATE TABLE "OfferCategory" (
    "id_offer_category" SERIAL NOT NULL,
    "id_offer" INTEGER NOT NULL,
    "id_category" INTEGER NOT NULL,

    CONSTRAINT "OfferCategory_pkey" PRIMARY KEY ("id_offer_category")
);

-- CreateTable
CREATE TABLE "Application" (
    "id_application" SERIAL NOT NULL,
    "motivation" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "id_student" INTEGER NOT NULL,
    "id_offer" INTEGER NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id_application")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id_favorite" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_student" INTEGER NOT NULL,
    "id_offer" INTEGER NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id_favorite")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id_conversation" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "id_student" INTEGER NOT NULL,
    "id_company" INTEGER NOT NULL,
    "id_offer" INTEGER NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id_conversation")
);

-- CreateTable
CREATE TABLE "Message" (
    "id_message" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_conversation" INTEGER NOT NULL,
    "id_sender" INTEGER NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id_message")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id_interview" SERIAL NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "type" "InterviewType" NOT NULL,
    "status" "InterviewStatus" NOT NULL DEFAULT 'PENDING',
    "id_application" INTEGER NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id_interview")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id_notification" SERIAL NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "type" "NotificationType",
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_user" INTEGER NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id_notification")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_id_user_id_role_key" ON "UserRole"("id_user", "id_role");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_id_user_key" ON "StudentProfile"("id_user");

-- CreateIndex
CREATE UNIQUE INDEX "Company_id_user_key" ON "Company"("id_user");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSkill_id_student_id_skill_key" ON "StudentSkill"("id_student", "id_skill");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OfferCategory_id_offer_id_category_key" ON "OfferCategory"("id_offer", "id_category");

-- CreateIndex
CREATE UNIQUE INDEX "Application_id_student_id_offer_key" ON "Application"("id_student", "id_offer");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_id_student_id_offer_key" ON "Favorite"("id_student", "id_offer");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_id_student_id_company_id_offer_key" ON "Conversation"("id_student", "id_company", "id_offer");

-- CreateIndex
CREATE UNIQUE INDEX "Interview_id_application_key" ON "Interview"("id_application");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "Role"("id_role") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSkill" ADD CONSTRAINT "StudentSkill_id_student_fkey" FOREIGN KEY ("id_student") REFERENCES "StudentProfile"("id_student") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSkill" ADD CONSTRAINT "StudentSkill_id_skill_fkey" FOREIGN KEY ("id_skill") REFERENCES "Skill"("id_skill") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_id_company_fkey" FOREIGN KEY ("id_company") REFERENCES "Company"("id_company") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferCategory" ADD CONSTRAINT "OfferCategory_id_offer_fkey" FOREIGN KEY ("id_offer") REFERENCES "Offer"("id_offer") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferCategory" ADD CONSTRAINT "OfferCategory_id_category_fkey" FOREIGN KEY ("id_category") REFERENCES "Category"("id_category") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_id_student_fkey" FOREIGN KEY ("id_student") REFERENCES "StudentProfile"("id_student") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_id_offer_fkey" FOREIGN KEY ("id_offer") REFERENCES "Offer"("id_offer") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_id_student_fkey" FOREIGN KEY ("id_student") REFERENCES "StudentProfile"("id_student") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_id_offer_fkey" FOREIGN KEY ("id_offer") REFERENCES "Offer"("id_offer") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_id_student_fkey" FOREIGN KEY ("id_student") REFERENCES "StudentProfile"("id_student") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_id_company_fkey" FOREIGN KEY ("id_company") REFERENCES "Company"("id_company") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_id_offer_fkey" FOREIGN KEY ("id_offer") REFERENCES "Offer"("id_offer") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_id_conversation_fkey" FOREIGN KEY ("id_conversation") REFERENCES "Conversation"("id_conversation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_id_sender_fkey" FOREIGN KEY ("id_sender") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_id_application_fkey" FOREIGN KEY ("id_application") REFERENCES "Application"("id_application") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
