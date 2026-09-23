// src/ai.ts
// KHOEM-AI Real-Time Frontend/API Security Shield & Request Signer

const STORAGE_SESSION_KEY = "KHOEM_SESSION_TOKEN";
const STORAGE_TIME_KEY = "KHOEM_SESSION_TIME";
const SESSION_MAX_AGE_MS = 3600000; // 1 ម៉ោង

export interface SecurityCheckResult {
  ok: boolean;
  reason: string;
}

export interface SecureFetchOptions extends RequestInit {
  apiKey?: string;
}

export class AISecurityShield {

  /**
   * សម្អាត input ទប់ស្កាត់ XSS, Script Injection និង Path Traversal
   * @param input - input string
   * @returns string ដែលបានសម្អាត
   */
  static sanitize(input: string): string {
    if (!input) return "";
    return input
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/javascript:/gi, "")
      .replace(/eval\((.*)\)/gi, "")
      .replace(/<\s*script[^>]*>/gi, "")
      .replace(/(\.\.\/|\.\.\\)/g, "");
  }

  /**
   * បង្កើត Digital Signature (SHA-256) លើ payload និង timestamp
   * @param payload - string payload
   * @param timestamp - string timestamp
   * @returns Promise<string> - hex signature
   */
  static async generateSignature(payload: string, timestamp: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload + timestamp);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * បញ្ជាក់សញ្ញាឌីជីថលថាតើត្រឹមត្រូវឬអត់
   * @param signature - សញ្ញាឌីជីថលត្រូវ verify
   * @param payload - original payload
   * @param timestamp - original timestamp
   * @returns Promise<boolean> - true ប្រសិនបើត្រូវនឹង signature
   */
  static async verifySignature(signature: string, payload: string, timestamp: string): Promise<boolean> {
    const expected = await this.generateSignature(payload, timestamp);
    return signature === expected;
  }
}
