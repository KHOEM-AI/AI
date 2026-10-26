import { describe, expect, it } from "vitest";
import { inspectWav, evaluateVoiceOutput } from "../voiceEngine.mjs";

function makePcmWav(samples, sampleRate = 16000) {
  const dataSize = samples.length * 2;
  const wav = Buffer.alloc(44 + dataSize);

  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(dataSize, 40);

  samples.forEach((sample, index) => {
    wav.writeInt16LE(sample, 44 + index * 2);
  });

  return wav;
}

describe("KHOEM AI Voice Engine audio validation", () => {
  it("inspects valid PCM WAV metadata and audio samples", () => {
    const result = inspectWav(makePcmWav([0, 5000, -5000, 10000]));

    expect(result.format).toBe("PCM_WAV");
    expect(result.sampleRate).toBe(16000);
    expect(result.channels).toBe(1);
    expect(result.durationSeconds).toBe(0);
    expect(result.nonSilent).toBe(true);
  });

  it("detects silent audio", () => {
    const result = evaluateVoiceOutput({
      text: "សួស្តី",
      audio: makePcmWav(new Array(160).fill(0)),
    });

    expect(result.ok).toBe(false);
    expect(result.warnings).toContain("AUDIO_SILENT_OR_TOO_QUIET");
  });

  it("rejects a non-WAV file", () => {
    expect(() => inspectWav(Buffer.from("not audio")))
      .toThrow(/WAV_INVALID/);
  });

  it("requires text before evaluating generated audio", () => {
    expect(() => evaluateVoiceOutput({
      text: " ",
      audio: makePcmWav([1000]),
    })).toThrow(/TEXT_REQUIRED/);
  });

  it("flags clipping without claiming synthesis is connected", () => {
    const result = evaluateVoiceOutput({
      text: "សាកល្បងសំឡេង",
      audio: makePcmWav([32767, -32768, 1000]),
    });

    expect(result.warnings).toContain("AUDIO_CLIPPING_DETECTED");
    expect(result.synthesisStatus).toBe("NOT_CONNECTED");
  });
});
