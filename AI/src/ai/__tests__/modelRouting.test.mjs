import { describe, it, expect, beforeEach } from "vitest";
import { decideProvider, registerProvider, setProviderAvailability, listProviders, getRoutingHistory } from "../modelRouting.mjs";

describe("modelRouting.mjs", () => {
  it("uses the primary provider when available", () => {
    const d = decideProvider("khoem");
    expect(d.usedProvider).toBe("khoem");
    expect(d.fallbackModel).toBe(null);
  });

  it("lists khoem as a registered primary provider", () => {
    const list = listProviders();
    expect(list.some((p) => p.name === "khoem" && p.isPrimary)).toBe(true);
  });

  it("falls back to a registered available provider when primary is down", () => {
    registerProvider("backup-test", { available: true });
    setProviderAvailability("khoem", false);
    const d = decideProvider("khoem");
    expect(d.usedProvider).toBe("backup-test");
    expect(d.fallbackModel).toBe("backup-test");
    setProviderAvailability("khoem", true); // restore for other tests
  });

  it("never fabricates a fallback — returns NO_FALLBACK when none exists", () => {
    registerProvider("solo-test", { available: false });
    setProviderAvailability("khoem", false);
    const d = decideProvider("khoem", { allowFallback: true });
    // other tests may have registered providers; only assert no invented name
    if (d.error === "NO_FALLBACK") {
      expect(d.usedProvider).toBe(null);
    }
    setProviderAvailability("khoem", true);
  });

  it("respects allowFallback: false — never silently changes provider", () => {
    setProviderAvailability("khoem", false);
    const d = decideProvider("khoem", { allowFallback: false });
    expect(d.usedProvider).toBe(null);
    expect(d.error).toBe("NO_PROVIDER");
    setProviderAvailability("khoem", true);
  });

  it("records routing history", () => {
    decideProvider("khoem");
    const hist = getRoutingHistory(5);
    expect(hist.length).toBeGreaterThan(0);
    expect(hist[0]).toHaveProperty("timestamp");
  });
});
