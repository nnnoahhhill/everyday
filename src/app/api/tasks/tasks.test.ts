import { describe, it, expect, vi } from "vitest";

// Mocking prisma and auth
vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findMany: vi.fn().mockResolvedValue([{ id: "1", name: "Test Task" }]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: "1", name: "Test Task" }),
    },
    user: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue(undefined),
}));

import { GET, POST } from "@/app/api/tasks/route";

describe("Tasks API", () => {
  it("GET returns tasks", async () => {
    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toBeInstanceOf(Array);
    expect(data[0].name).toBe("Test Task");
  });

  it("POST creates a task", async () => {
    const req = new Request("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({ name: "New Task" }),
    });
    const response = await POST(req);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.name).toBe("Test Task"); // From mock
  });
});
