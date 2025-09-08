/*
  Warnings:

  - You are about to drop the `Notifications` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Notifications" DROP CONSTRAINT "Notifications_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notifications" DROP CONSTRAINT "Notifications_messageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notifications" DROP CONSTRAINT "Notifications_senderId_fkey";

-- DropTable
DROP TABLE "public"."Notifications";
