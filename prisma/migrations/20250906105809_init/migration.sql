/*
  Warnings:

  - You are about to drop the column `lastMessage` on the `Conversation` table. All the data in the column will be lost.
  - The `type` column on the `Conversation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `isRead` column on the `Message` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[lastMessageId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[messageId]` on the table `Notifications` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."CONVERSATION_TYPE" AS ENUM ('ONE_TO_ONE', 'GROUP');

-- CreateEnum
CREATE TYPE "public"."MESSAGE_READ_STATUS" AS ENUM ('UNREAD', 'READ', 'SENT');

-- AlterTable
ALTER TABLE "public"."Conversation" DROP COLUMN "lastMessage",
ADD COLUMN     "lastMessageId" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "public"."CONVERSATION_TYPE" NOT NULL DEFAULT 'ONE_TO_ONE';

-- AlterTable
ALTER TABLE "public"."Message" DROP COLUMN "isRead",
ADD COLUMN     "isRead" "public"."MESSAGE_READ_STATUS" NOT NULL DEFAULT 'UNREAD';

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_lastMessageId_key" ON "public"."Conversation"("lastMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "Notifications_messageId_key" ON "public"."Notifications"("messageId");

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "public"."Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
