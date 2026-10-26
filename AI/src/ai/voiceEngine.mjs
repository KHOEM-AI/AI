/**
 * KHOEM AI Voice Engine — audio validation core.
 *
 * This module validates generated PCM WAV audio.
 * It does not pretend to synthesize speech until a trained
 * Khmer TTS model is connected.
 */

export function inspectWav(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input ?? []);

  if (buffer.length < 44) {
    throw new Error("WAV_INVALID: file is too short");
  }

  if (buffer.toString("ascii", 0, 4) !== "RIFF" ||
      buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("WAV_INVALID: missing RIFF/WAVE header");
  }

  const declaredSize = buffer.readUInt32LE(4) + 8;
  if (declaredSize > buffer.length || declaredSize < 12) {
    throw new Error("WAV_INVALID: inconsistent RIFF size");
  }

  let offset = 12;
  let format = null;
  let data = null;

  while (offset + 8 <= declaredSize) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + size;

    if (end > declaredSize) {
      throw new Error("WAV_INVALID: chunk exceeds file size");
    }

    if (id === "fmt ") {
      if (size < 16) throw new Error("WAV_INVALID: bad fmt chunk");

      format = {
        encoding: buffer.readUInt16LE(start),
        channels: buffer.readUInt16LE(start + 2),
        sampleRate: buffer.readUInt32LE(start + 4),
        byteRate: buffer.readUInt32LE(start + 8),
        blockAlign: buffer.readUInt16LE(start + 12),
        bitsPerSample: buffer.readUInt16LE(start + 14),
      };
    } else if (id === "data") {
      data = { start, size };
    }

    offset = end + (size % 2);
  }

  if (!format || !data) {
    throw new Error("WAV_INVALID: fmt or data chunk missing");
  }

  if (format.encoding !== 1) {
    throw new Error("WAV_UNSUPPORTED: expected PCM encoding");
  }

  if (![1, 2].includes(format.channels) ||
      ![8, 16, 24, 32].includes(format.bitsPerSample) ||
      format.sampleRate < 8000 ||
      format.sampleRate > 192000) {
    throw new Error("WAV_UNSUPPORTED: unsupported audio format");
  }

  const bytesPerSample = format.bitsPerSample / 8;
  const expectedAlign = format.channels * bytesPerSample;

  if (format.blockAlign !== expectedAlign ||
      format.byteRate !== format.sampleRate * expectedAlign ||
      data.size % expectedAlign !== 0) {
    throw new Error("WAV_INVALID: inconsistent PCM metadata");
  }

  const frames = data.size / expectedAlign;
  if (frames === 0) throw new Error("WAV_INVALID: no audio samples");

  let sumSquares = 0;
  let peak = 0;
  let clippedSamples = 0;
  const fullScale = format.bitsPerSample === 8
    ? 128
    : 2 ** (format.bitsPerSample - 1);

  for (let pos = data.start; pos < data.start + data.size; pos += bytesPerSample) {
    let sample;

    if (format.bitsPerSample === 8) {
      sample = (buffer.readUInt8(pos) - 128) / 128;
    } else if (format.bitsPerSample === 16) {
      sample = buffer.readInt16LE(pos) / fullScale;
    } else if (format.bitsPerSample === 24) {
      let n = buffer[pos] | (buffer[pos + 1] << 8) | (buffer[pos + 2] << 16);
      if (n & 0x800000) n |= 0xff000000;
      sample = n / fullScale;
    } else {
      sample = buffer.readInt32LE(pos) / fullScale;
    }

    const magnitude = Math.abs(sample);
    if (magnitude > peak) peak = magnitude;
    if (magnitude >= 0.999) clippedSamples++;
    sumSquares += sample * sample;
  }

  const sampleCount = data.size / bytesPerSample;
  const rms = Math.sqrt(sumSquares / sampleCount);

  return {
    format: "PCM_WAV",
    channels: format.channels,
    sampleRate: format.sampleRate,
    bitsPerSample: format.bitsPerSample,
    durationSeconds: Number((frames / format.sampleRate).toFixed(3)),
    peak: Number(peak.toFixed(6)),
    rms: Number(rms.toFixed(6)),
    clippedSamples,
    sampleCount,
    nonSilent: rms > 0.0001,
  };
}

/**
 * Validate a future TTS model's output.
 * `audio` must be a PCM WAV Buffer or Uint8Array.
 */
export function evaluateVoiceOutput({ text, audio }) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("TEXT_REQUIRED: provide non-empty input text");
  }

  const metrics = inspectWav(audio);

  return {
    ok: metrics.nonSilent,
    textLength: [...text.trim()].length,
    audio: metrics,
    warnings: [
      ...(!metrics.nonSilent ? ["AUDIO_SILENT_OR_TOO_QUIET"] : []),
      ...(metrics.clippedSamples > 0 ? ["AUDIO_CLIPPING_DETECTED"] : []),
    ],
    synthesisStatus: "NOT_CONNECTED",
  };
}
