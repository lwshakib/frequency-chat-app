import { PrismaClient } from "../../generated/prisma/client.ts";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

// Mock Prisma
jest.mock("../services/prisma.services", () => ({
  __esModule: true,
  prisma: prismaMock,
}));

export const prismaMock =
  mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});
