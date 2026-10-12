import { describe, it, expect } from "vitest";
import { EXTRA_ASSETS as X3 } from "../assetsExtra3.mjs";
import { EXTRA_ASSETS as X4 } from "../assetsExtra4.mjs";
import { EXTRA_ASSETS as X5 } from "../assetsExtra5.mjs";
describe("asset region and country", () => {
  it("extra4 and marine extra5 are global with no country", () => {
    for (const a of [...X4, ...X5]) {
      expect(a.region).toBe("global");
      expect(a.country).toBeUndefined();
    }
  });
  it("only real Cambodian vehicles in extra3 stay KH", () => {
    const kh = X3.filter((a) => a.country === "KH").map((a) => a.nameKm).sort();
    expect(kh).toEqual(["ម៉ូតូរ៉ឺម៉ក", "តុកតុកអគ្គិសនីកង់បី", "ស៊ីក្លូ", "រទេះគោ", "ម៉ូតូឌ្រីមធម្មតា"].sort());
    for (const a of X3.filter((x) => x.country !== "KH")) expect(a.region).toBe("global");
  });
});
