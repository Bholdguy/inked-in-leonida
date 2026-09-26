import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter, RATE_LIMIT, RATE_WINDOW_MS } from "../rateLimit";

describe("createRateLimiter", () => {
  it("defaults to 20 per 10 minutes", () => {
    expect(RATE_LIMIT).toBe(20);
    expect(RATE_WINDOW_MS).toBe(600_000);
  });

  it("allows 20, blocks the 21st, per key", () => {
    const rl = createRateLimiter(20, 600_000, () => 0);
    for (let i = 0; i < 20; i++) expect(rl.allow("a")).toBe(true);
    expect(rl.allow("a")).toBe(false);
    expect(rl.allow("b")).toBe(true);
  });

  it("slides: requests older than the window stop counting", () => {
    let t = 0;
    const rl = createRateLimiter(20, 600_000, () => t);
    for (let i = 0; i < 20; i++) {
      t = i * 1000;
      rl.allow("a");
    }
    t = 600_000 - 1; // the first hit (t=0) is still inside the window
    expect(rl.allow("a")).toBe(false);
    t = 600_000; // the first hit just aged out
    expect(rl.allow("a")).toBe(true);
    expect(rl.allow("a")).toBe(false);
  });

  it("blocked attempts do not extend the window", () => {
    let t = 0;
    const rl = createRateLimiter(2, 1000, () => t);
    rl.allow("a");
    rl.allow("a");
    for (let i = 0; i < 50; i++) rl.allow("a");
    t = 1000;
    expect(rl.allow("a")).toBe(true);
  });

  it("reset clears all keys", () => {
    const rl = createRateLimiter(1, 1000, () => 0);
    rl.allow("a");
    expect(rl.allow("a")).toBe(false);
    rl.reset();
    expect(rl.allow("a")).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });
  it("falls back to x-real-ip, then unknown", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
