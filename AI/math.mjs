// math.mjs — Arbitrary-precision math tool for KHOEM AI
// Non-destructive: standalone module, does not touch existing files.
// Drop into: ~/ai-project/AI/src/ai/tools/math.mjs (or wherever your tools/ folder is)
// Then register it in your tools registry (do NOT overwrite existing tools list —
// just add an entry pointing to these exports).

/**
 * Add any number of values (integers or decimals, as strings or numbers),
 * with no precision loss, no matter how large.
 * Example: addAll("999999999999999999", 1) -> "1000000000000000000"
 */
export function addAll(...values) {
  return sumDecimal(values.map(String));
}

/**
 * Divide a by b with arbitrary precision, returned as a decimal string
 * truncated/rounded to `precision` digits after the decimal point (default 10).
 * Handles huge numerators/denominators (thousands, millions, billions+) safely.
 * Example: divide("1000000", "3", 6) -> "333333.333333"
 */
export function divide(a, b, precision = 10) {
  const { sign, aInt, bInt } = normalizeForDivision(String(a), String(b));
  if (bInt === 0n) {
    throw new Error("Division by zero");
  }
  const scale = 10n ** BigInt(precision);
  const scaled = (aInt * scale) / bInt;
  const result = formatScaled(scaled, precision);
  return sign < 0 ? "-" + result : result;
}

/**
 * Format any integer/decimal string with thousand separators.
 * Example: formatNumber("1234567.891") -> "1,234,567.891"
 * Example: formatNumber("1234567", "km") -> "1,234,567 (គីឡូម៉ែត្រ)"
 */
export function formatNumber(value, khmerLabel = null) {
  const str = String(value);
  const negative = str.startsWith("-");
  const clean = negative ? str.slice(1) : str;
  const [intPart, decPart] = clean.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  let out = (negative ? "-" : "") + withCommas + (decPart ? "." + decPart : "");
  if (khmerLabel) out += ` (${khmerLabel})`;
  return out;
}

// ---------- internal helpers ----------

// Sum a list of decimal strings exactly, using BigInt scaled by the max decimal length.
function sumDecimal(strs) {
  let maxDec = 0;
  for (const s of strs) {
    const dot = s.indexOf(".");
    if (dot !== -1) maxDec = Math.max(maxDec, s.length - dot - 1);
  }
  const scale = 10n ** BigInt(maxDec);
  let total = 0n;
  for (const s of strs) {
    total += toScaledBigInt(s, maxDec, scale);
  }
  return formatScaled(total, maxDec);
}

function toScaledBigInt(s, maxDec, scale) {
  const negative = s.startsWith("-");
  const clean = negative ? s.slice(1) : s;
  const [intPart, decPart = ""] = clean.split(".");
  const paddedDec = decPart.padEnd(maxDec, "0");
  const combined = (intPart || "0") + paddedDec;
  const value = BigInt(combined || "0");
  return negative ? -value : value;
}

function normalizeForDivision(a, b) {
  const aNeg = a.startsWith("-");
  const bNeg = b.startsWith("-");
  const sign = (aNeg !== bNeg) ? -1 : 1;
  const aClean = aNeg ? a.slice(1) : a;
  const bClean = bNeg ? b.slice(1) : b;

  // Align decimals of a and b to integers by scaling both to the same power of 10.
  const aDot = aClean.indexOf(".");
  const bDot = bClean.indexOf(".");
  const aDec = aDot === -1 ? 0 : aClean.length - aDot - 1;
  const bDec = bDot === -1 ? 0 : bClean.length - bDot - 1;
  const maxDec = Math.max(aDec, bDec);
  const scale = 10n ** BigInt(maxDec);

  const aInt = toScaledBigInt(aClean, maxDec, scale);
  const bInt = toScaledBigInt(bClean, maxDec, scale);

  return { sign, aInt, bInt };
}

function formatScaled(scaledInt, decimals) {
  const negative = scaledInt < 0n;
  let str = (negative ? -scaledInt : scaledInt).toString().padStart(decimals + 1, "0");
  if (decimals === 0) return (negative ? "-" : "") + str;
  const intPart = str.slice(0, -decimals) || "0";
  const decPart = str.slice(-decimals).replace(/0+$/, "");
  return (negative ? "-" : "") + intPart + (decPart ? "." + decPart : "");
}
