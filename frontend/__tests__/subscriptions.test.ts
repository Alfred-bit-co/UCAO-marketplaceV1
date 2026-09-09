import { describe, expect, it, vi } from "vitest";
import { daysUntilExpiry, formatSubscriptionDate } from "@/lib/subscriptions";

describe("subscription dates", () => {
  it("calculates remaining calendar days from the current instant", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-09T12:00:00.000Z"));
    expect(daysUntilExpiry("2026-10-09T12:00:00.000Z")).toBe(30);
    expect(daysUntilExpiry("2026-09-09T11:59:59.000Z")).toBe(0);
    vi.useRealTimers();
  });

  it("formats subscription dates in the UCAO campus timezone", () => {
    expect(formatSubscriptionDate("2026-09-09T00:00:00.000Z")).toBe("9 septembre 2026");
    expect(formatSubscriptionDate(null)).toBeNull();
  });
});
