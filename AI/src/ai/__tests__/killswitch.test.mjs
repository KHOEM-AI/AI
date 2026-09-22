import { describe, it, expect, beforeEach } from "vitest";
import {
  isKilled,
  activateKillSwitch,
  deactivateKillSwitch,
  getKillSwitchStatus,
} from "../killswitch.mjs";

describe("killswitch.mjs", () => {
  beforeEach(() => {
    deactivateKillSwitch();
  });

  it("starts not killed", () => {
    expect(isKilled()).toBe(false);
    expect(getKillSwitchStatus()).toEqual({
      killed: false,
      killedAt: null,
      killedReason: null,
    });
  });

  it("activateKillSwitch sets killed=true with reason and timestamp", () => {
    const result = activateKillSwitch("unit test");
    expect(result.ok).toBe(true);
    expect(isKilled()).toBe(true);
    expect(getKillSwitchStatus().killedReason).toBe("unit test");
    expect(getKillSwitchStatus().killedAt).toBeTruthy();
  });

  it("defaults reason to 'manual' when not provided", () => {
    activateKillSwitch();
    expect(getKillSwitchStatus().killedReason).toBe("manual");
  });

  it("deactivateKillSwitch resets state", () => {
    activateKillSwitch("test");
    deactivateKillSwitch();
    expect(isKilled()).toBe(false);
    expect(getKillSwitchStatus()).toEqual({
      killed: false,
      killedAt: null,
      killedReason: null,
    });
  });
});
