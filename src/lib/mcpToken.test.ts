import { describe, expect, it } from "vitest";
import { createMcpToken, hashMcpToken } from "./mcpToken";

describe("MCP personal tokens", () => {
  it("creates distinct tokens and stable SHA-256 hashes", async () => {
    const first = await createMcpToken();
    const second = await createMcpToken();
    expect(first.token).toMatch(/^mp_[A-Za-z0-9_-]{43}$/);
    expect(first.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashMcpToken(first.token)).toBe(first.hash);
    expect(second.token).not.toBe(first.token);
  });
});

