import { describe, it, expect, beforeEach, vi } from "vitest";
import { WebhookManager, type WebhookConfig } from "../../src/main/webhook-manager";

describe("WebhookManager", () => {
  let manager: WebhookManager;

  beforeEach(() => {
    manager = new WebhookManager();
  });

  describe("addWebhook", () => {
    it("adds a webhook config", () => {
      manager.addWebhook({
        id: "slack-1",
        name: "Slack Notifications",
        url: "https://hooks.slack.com/test",
        events: ["done"],
        enabled: true,
      });
      expect(manager.listWebhooks()).toHaveLength(1);
    });
  });

  describe("removeWebhook", () => {
    it("removes an existing webhook", () => {
      manager.addWebhook({
        id: "test-1",
        name: "Test",
        url: "https://example.com",
        events: ["all"],
        enabled: true,
      });
      expect(manager.removeWebhook("test-1")).toBe(true);
      expect(manager.listWebhooks()).toHaveLength(0);
    });

    it("returns false for nonexistent webhook", () => {
      expect(manager.removeWebhook("nope")).toBe(false);
    });
  });

  describe("listWebhooks", () => {
    it("returns empty array initially", () => {
      expect(manager.listWebhooks()).toEqual([]);
    });

    it("returns copies of webhooks", () => {
      manager.addWebhook({
        id: "a",
        name: "A",
        url: "https://a.com",
        events: ["done"],
        enabled: true,
      });
      const list = manager.listWebhooks();
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe("a");
    });
  });

  describe("fire", () => {
    it("does not throw when no webhooks configured", async () => {
      await expect(
        manager.fire("done", {
          event: "test",
          timestamp: new Date().toISOString(),
        }),
      ).resolves.not.toThrow();
    });

    it("filters webhooks by event type", async () => {
      // Mock fetch globally
      const originalFetch = globalThis.fetch;
      const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
      globalThis.fetch = fetchSpy;

      manager.addWebhook({
        id: "done-only",
        name: "Done Only",
        url: "https://example.com/done",
        events: ["done"],
        enabled: true,
      });

      manager.addWebhook({
        id: "error-only",
        name: "Error Only",
        url: "https://example.com/error",
        events: ["error"],
        enabled: true,
      });

      await manager.fire("done", {
        event: "signal.done",
        timestamp: new Date().toISOString(),
      });

      // Only the "done" webhook should fire
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy.mock.calls[0][0]).toBe("https://example.com/done");

      globalThis.fetch = originalFetch;
    });

    it("fires all webhooks with 'all' event filter", async () => {
      const originalFetch = globalThis.fetch;
      const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
      globalThis.fetch = fetchSpy;

      manager.addWebhook({
        id: "catch-all",
        name: "Catch All",
        url: "https://example.com/all",
        events: ["all"],
        enabled: true,
      });

      await manager.fire("done", {
        event: "signal.done",
        timestamp: new Date().toISOString(),
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);

      globalThis.fetch = originalFetch;
    });

    it("skips disabled webhooks", async () => {
      const originalFetch = globalThis.fetch;
      const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
      globalThis.fetch = fetchSpy;

      manager.addWebhook({
        id: "disabled",
        name: "Disabled",
        url: "https://example.com",
        events: ["all"],
        enabled: false,
      });

      await manager.fire("done", {
        event: "test",
        timestamp: new Date().toISOString(),
      });

      expect(fetchSpy).not.toHaveBeenCalled();

      globalThis.fetch = originalFetch;
    });

    it("emits error event on fetch failure", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      manager.addWebhook({
        id: "failing",
        name: "Failing",
        url: "https://unreachable.test",
        events: ["all"],
        enabled: true,
      });

      const errors: unknown[] = [];
      manager.on("error", (e) => errors.push(e));

      await manager.fire("done", {
        event: "test",
        timestamp: new Date().toISOString(),
      });

      expect(errors).toHaveLength(1);
      expect((errors[0] as { webhookId: string }).webhookId).toBe("failing");

      globalThis.fetch = originalFetch;
    });

    it("fires multiple webhooks in parallel", async () => {
      const originalFetch = globalThis.fetch;
      const callOrder: string[] = [];
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        callOrder.push(url);
        return { ok: true };
      });

      manager.addWebhook({
        id: "a",
        name: "A",
        url: "https://a.com",
        events: ["done"],
        enabled: true,
      });
      manager.addWebhook({
        id: "b",
        name: "B",
        url: "https://b.com",
        events: ["done"],
        enabled: true,
      });
      manager.addWebhook({
        id: "c",
        name: "C",
        url: "https://c.com",
        events: ["done"],
        enabled: true,
      });

      await manager.fire("done", { event: "test", timestamp: new Date().toISOString() });

      expect(callOrder).toHaveLength(3);
      expect(callOrder).toContain("https://a.com");
      expect(callOrder).toContain("https://b.com");
      expect(callOrder).toContain("https://c.com");

      globalThis.fetch = originalFetch;
    });

    it("includes custom headers in requests", async () => {
      const originalFetch = globalThis.fetch;
      const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
      globalThis.fetch = fetchSpy;

      manager.addWebhook({
        id: "custom",
        name: "Custom",
        url: "https://api.example.com",
        events: ["all"],
        enabled: true,
        headers: { Authorization: "Bearer token123" },
      });

      await manager.fire("done", { event: "test", timestamp: new Date().toISOString() });

      const fetchCall = fetchSpy.mock.calls[0];
      expect(fetchCall[1].headers.Authorization).toBe("Bearer token123");

      globalThis.fetch = originalFetch;
    });
  });
});
