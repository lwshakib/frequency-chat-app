import { expect, test, describe, beforeEach, mock } from "bun:test";
import request from "supertest";
import express from "express";

// Define prisma mock globally or locally
const prismaMock = {
  notification: {
    findMany: mock(() => Promise.resolve([])),
    update: mock(() => Promise.resolve({})),
    updateMany: mock(() => Promise.resolve({})),
  },
};

// Mock the services/prisma.services before importing things that use it
mock.module("../services/prisma.services", () => ({
  prisma: prismaMock,
}));

// Now import the app logic
import notificationsRouter from "../routes/notifications.routes";

const app = express();
app.use(express.json());
app.use("/notifications", notificationsRouter);

describe("Notifications API", () => {
  beforeEach(() => {
    prismaMock.notification.findMany.mockClear();
    prismaMock.notification.update.mockClear();
  });

  test("should return a list of notifications for a user", async () => {
    const mockData = [
      {
        id: "1",
        content: "Test Notification",
        isRead: false,
        userId: "user1",
      },
    ];

    prismaMock.notification.findMany.mockResolvedValue(mockData as any);

    const response = await request(app).get("/notifications/user1");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].content).toBe("Test Notification");
  });

  test("should mark a notification as read", async () => {
    prismaMock.notification.update.mockResolvedValue({
      id: "1",
      isRead: true,
    } as any);

    const response = await request(app).put("/notifications/1/read");

    expect(response.status).toBe(200);
    expect(response.body.isRead).toBe(true);
  });
});
