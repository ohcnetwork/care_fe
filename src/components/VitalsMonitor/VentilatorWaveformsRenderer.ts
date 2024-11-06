import { ChannelOptions } from "@/components/VitalsMonitor/types";
import { lerp } from "@/components/VitalsMonitor/utils";

interface ChannelState {
  buffer: number[];
  cursor: Position;
  color: string;
  deltaX: number;
  transform: (value: number) => number;
  chunkSize: number;
  options: ChannelOptions;
  rows: number;
}

interface Position {
  x: number;
  y: number;
}

interface Options {
  /**
   * The size of the canvas rendering context.
   *
   * Height should preferably be a multiple of 4.
   */
  size: { width: number; height: number };
  /**
   * The 2D render context of the canvas to draw the vitals waveforms on.
   */
  foregroundRenderContext: CanvasRenderingContext2D;
  /**
   * The 2D render context of the canvas to draw the
   */
  backgroundRenderContext: CanvasRenderingContext2D;
  /**
   * The interval at which the canvas is rendered in milliseconds.
   */
  animationInterval: number;
  /**
   * Options for Pressure channel.
   */
  pressure: ChannelOptions;
  /**
   * Options for Flow channel.
   */
  flow: ChannelOptions;
  /**
   * Options for Volume channel.
   */
  volume: ChannelOptions;
  /**
   * Duration of each row on the canvas in seconds.
   */
  duration: number;
}

/**
 * Provides the API for rendering vitals waveforms on a canvas.
 *
 * Strategy:
 * - Render frequency is set manually and is independent of the sampling rate.
 * - Manages rendering of all the vitals channels.
 */
class VentilatorVitalsRenderer {
  constructor(options: Options) {
    const {
      pressure,
      flow,
      volume,
      size: { height: h, width: w },
      duration,
    } = options;

    this.options = options;
    this.state = {
      pressure: {
        color: "#0ffc03",
        buffer: [],
        cursor: { x: 0, y: 0 },
        deltaX: w / (duration * pressure.samplingRate),
        transform: lerp(pressure.lowLimit, pressure.highLimit, h * 0.33, 0),
        chunkSize: pressure.samplingRate * options.animationInterval * 1e-3,
        options: pressure,
        rows: 1,
      },

      flow: {
        color: "#ffff24",
        buffer: [],
        cursor: { x: 0, y: 0 },
        deltaX: w / (duration * flow.samplingRate),
        transform: lerp(flow.lowLimit, flow.highLimit, h * 0.67, h * 0.33),
        chunkSize: flow.samplingRate * options.animationInterval * 1e-3,
        options: flow,
        rows: 1,
      },

      volume: {
        color: "#03a9f4",
        buffer: [],
        cursor: { x: 0, y: 0 },
        deltaX: w / (duration * volume.samplingRate),
        transform: lerp(volume.lowLimit, volume.highLimit, h, h * 0.67),
        chunkSize: volume.samplingRate * options.animationInterval * 1e-3,
        options: volume,
        rows: 1,
      },
    };

    // Draw baseline for each channel.
    this.initialize(this.state.pressure);
    this.initialize(this.state.flow);
    this.initialize(this.state.volume);

    // Start rendering.
    setInterval(() => {
      this.render(this.state.pressure);
      this.render(this.state.flow);
      this.render(this.state.volume);
    }, options.animationInterval);
  }

  private options: Options;
  private state: {
    pressure: ChannelState;
    flow: ChannelState;
    volume: ChannelState;
  };

  /**
   * Appends data to the buffer of the specified channel.
   */
  append(channel: "pressure" | "flow" | "volume", data: number[]) {
    const state = this.state[channel];
    state.buffer.push(...data.map(state.transform));
  }

  private initialize(channel: ChannelState) {
    const { foregroundRenderContext: ctx, size } = this.options;
    const { transform, rows, options, color } = channel;

    for (let row = 0; row < rows; row++) {
      const y = transform(options.baseline) + (row * size.height) / 4;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size.width, y);
      ctx.strokeStyle = color;
      ctx.stroke();
    }

    channel.cursor = { x: 0, y: transform(options.baseline) };
  }

  private render(channel: ChannelState) {
    const { foregroundRenderContext: ctx, size } = this.options;
    const { cursor, deltaX, transform } = channel;

    const xMax = size.width * channel.rows;

    ctx.beginPath();
    ctx.moveTo(...this.correctForRow(cursor));

    ctx.strokeStyle = channel.color;
    ctx.lineWidth = 1.5;

    channel.buffer.splice(0, channel.chunkSize).forEach((nextY) => {
      cursor.x += deltaX;
      cursor.y = nextY;

      if (cursor.x > xMax) {
        cursor.x = 0;
      }

      const [x, y] = this.correctForRow(cursor);

      if (x < deltaX) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    const deltaRows = Math.floor(cursor.x / size.width);
    ctx.clearRect(
      cursor.x - deltaRows * size.width,
      1 + transform(channel.options.highLimit) + (deltaRows * size.height) / 3,
      10,
      size.height / 3 + 5,
    );
  }

  /**
   * Corrects the cursor position for the appropriate row if the cursor is
   * outside the bounds of the canvas.
   */
  private correctForRow(cursor: Position): [number, number] {
    const { size } = this.options;

    const deltaRows = Math.floor(cursor.x / size.width);

    const x = cursor.x % size.width;
    const y = cursor.y + (deltaRows * size.height) / 4;

    return [x, y];
  }
}

export default VentilatorVitalsRenderer;
