import { describe, expect, it } from "vitest";
import { generateUuid, isUuid } from "./uuid";

describe("UUID", () => {
  it("genera UUID v4 válidos y únicos", () => {
    const ids = new Set(Array.from({ length: 2000 }, () => generateUuid()));
    expect(ids.size).toBe(2000);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it("usa getRandomValues si randomUUID no existe", () => {
    const id = generateUuid({ getRandomValues: <T extends ArrayBufferView | null>(a: T) => crypto.getRandomValues(a as Uint8Array) as T });
    expect(isUuid(id)).toBe(true);
    expect(id[14]).toBe("4");
  });
  it("rechaza valores no UUID", () => {
    expect(isUuid("abc")).toBe(false);
    expect(isUuid(123)).toBe(false);
  });
});
