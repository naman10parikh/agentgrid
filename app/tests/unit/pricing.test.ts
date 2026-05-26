import { describe, it, expect } from "vitest";
import { PRICING_TIERS } from "../../src/shared/pricing";

describe("Pricing Tiers", () => {
  it("has 3 tiers", () => {
    expect(PRICING_TIERS).toHaveLength(3);
  });

  it("free tier is first", () => {
    expect(PRICING_TIERS[0].name).toBe("CLI");
    expect(PRICING_TIERS[0].price).toBe("Free");
  });

  it("pro tier is highlighted", () => {
    const pro = PRICING_TIERS.find((t) => t.name === "Pro");
    expect(pro?.highlighted).toBe(true);
    expect(pro?.price).toBe("$19");
  });

  it("team tier has SSO", () => {
    const team = PRICING_TIERS.find((t) => t.name === "Team");
    expect(team?.features.some((f) => f.includes("SSO"))).toBe(true);
  });

  it("all tiers have features", () => {
    for (const tier of PRICING_TIERS) {
      expect(tier.features.length).toBeGreaterThan(0);
      expect(tier.cta).toBeTruthy();
      expect(tier.description).toBeTruthy();
    }
  });

  it("exactly one tier is highlighted", () => {
    const highlighted = PRICING_TIERS.filter((t) => t.highlighted);
    expect(highlighted).toHaveLength(1);
  });
});
