/**
 * Webhook Manager — Fire HTTP webhooks when agents complete tasks.
 * Supports Slack, Discord, and generic URL webhooks.
 */

import { EventEmitter } from "events";

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: Array<"done" | "error" | "needs-qa" | "signal" | "all">;
  enabled: boolean;
  headers?: Record<string, string>;
}

export interface WebhookPayload {
  event: string;
  paneId?: string;
  label?: string;
  agent?: string;
  status?: string;
  timestamp: string;
  detail?: string;
}

export class WebhookManager extends EventEmitter {
  private webhooks: WebhookConfig[] = [];

  addWebhook(config: WebhookConfig): void {
    this.webhooks.push(config);
  }

  removeWebhook(id: string): boolean {
    const idx = this.webhooks.findIndex((w) => w.id === id);
    if (idx === -1) return false;
    this.webhooks.splice(idx, 1);
    return true;
  }

  listWebhooks(): WebhookConfig[] {
    return [...this.webhooks];
  }

  /**
   * Fire webhooks for a given event.
   */
  async fire(event: string, payload: WebhookPayload): Promise<void> {
    const matching = this.webhooks.filter(
      (w) =>
        w.enabled &&
        (w.events.includes("all") || w.events.includes(event as WebhookConfig["events"][number])),
    );

    const results = await Promise.allSettled(matching.map((w) => this.send(w, payload)));

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "rejected") {
        this.emit("error", {
          webhookId: matching[i].id,
          error: result.reason,
        });
      }
    }
  }

  private async send(webhook: WebhookConfig, payload: WebhookPayload): Promise<void> {
    const body = JSON.stringify({
      ...payload,
      webhook: webhook.name,
      source: "agentgrid",
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...webhook.headers,
    };

    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Webhook ${webhook.name} failed: ${response.status} ${response.statusText}`);
    }
  }
}
