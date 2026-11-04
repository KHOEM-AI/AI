import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Fixed path only. The client never supplies a path.
const CIDC_ROOT = process.env.CIDC_ROOT || join(homedir(), "Central-Intelligence-Data-Core");
const SCRIPT = join(CIDC_ROOT, "security", "file-integrity", "integrity.mjs");

const fail = (m, status) => Object.assign(new Error(m), { status });

export function scanIntegrity() {
  return new Promise((resolve, reject) => {
    if (!existsSync(SCRIPT)) return reject(fail("រកមិនឃើញ integrity scanner (Central-Intelligence-Data-Core)", 404));
    execFile(process.execPath, [SCRIPT, "check", "--json"], { timeout: 60000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      // exit 0 = no changes, exit 1 = changes found (both valid results)
      if (err && err.code !== 0 && err.code !== 1) {
        return reject(fail(String(stderr || err.message).trim() || "scanner error", err.code === 2 ? 409 : 500));
      }
      try { resolve(JSON.parse(stdout)); }
      catch { reject(fail("integrity output មិនត្រឹមត្រូវ", 500)); }
    });
  });
}
