/**
 * AudioWorklet source for the Ambient Scribe.
 *
 * The source is defined as a raw string and registered at runtime via a Blob
 * URL. This avoids the need for a dedicated Vite entry or MIME-type plumbing:
 * the POC runs purely in the browser.
 *
 * The processor receives Float32 PCM frames from an AudioContext running at
 * 24 kHz (the sample rate OpenAI Realtime expects for pcm16 input), converts
 * them to Int16, batches ~40 ms worth, and posts an ArrayBuffer back to the
 * main thread via `port.postMessage`.
 */
export const PCM16_WORKLET_SOURCE = /* js */ `
class Pcm16Processor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const sampleRate = (options && options.processorOptions && options.processorOptions.sampleRate) || 24000;
    const chunkMs = (options && options.processorOptions && options.processorOptions.chunkMs) || 40;
    this.chunkSize = Math.round((sampleRate * chunkMs) / 1000);
    this.buffer = new Int16Array(this.chunkSize);
    this.offset = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      let s = channel[i];
      if (s > 1) s = 1;
      else if (s < -1) s = -1;
      this.buffer[this.offset++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      if (this.offset >= this.chunkSize) {
        const out = new Int16Array(this.buffer);
        this.port.postMessage(out.buffer, [out.buffer]);
        this.buffer = new Int16Array(this.chunkSize);
        this.offset = 0;
      }
    }
    return true;
  }
}

registerProcessor('ambient-scribe-pcm16', Pcm16Processor);
`;

/** Build a Blob URL that an `AudioContext.audioWorklet.addModule` can load. */
export function createPcm16WorkletUrl(): string {
  const blob = new Blob([PCM16_WORKLET_SOURCE], {
    type: "application/javascript",
  });
  return URL.createObjectURL(blob);
}
