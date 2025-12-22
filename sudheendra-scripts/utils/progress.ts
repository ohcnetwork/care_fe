/**
 * Creates a progress bar for a given task.
 *
 * @example
 * const progress = createProgress({
 *   label: 'Creating Product Knowledges',
 *   total: 25
 * });
 *
 * progress.start();
 *
 * for (let i = 0; i < 25; i++) {
 *   await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
 *   progress.tick();
 * }
 *
 * progress.stop();
 */
export function createProgress({
  label,
  total,
  intervalMs = 80,
}: {
  label: string;
  total: number;
  intervalMs?: number;
}) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

  let frame = 0;
  let current = 0;
  let interval: NodeJS.Timeout | null = null;
  const startTime = process.hrtime.bigint();

  const isTTY = process.stdout.isTTY;

  function nowSeconds() {
    return Number(process.hrtime.bigint() - startTime) / 1e9;
  }

  function throughput(elapsed: number) {
    return elapsed > 0 ? current / elapsed : 0;
  }

  function eta(elapsed: number) {
    const rate = throughput(elapsed);
    return rate > 0 ? (total - current) / rate : Infinity;
  }

  function formatSeconds(s: number) {
    if (!Number.isFinite(s)) return "∞";
    if (s < 60) return `${s.toFixed(1)}s`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}m ${r.toFixed(0)}s`;
  }

  return {
    start() {
      if (!isTTY) {
        console.log(`${label} (0/${total})`);
        return;
      }

      interval = setInterval(() => {
        const elapsed = nowSeconds();
        const rate = throughput(elapsed);
        const remaining = eta(elapsed);

        process.stdout.write(
          `\r${frames[frame++ % frames.length]} ${label} (${current}/${total})` +
            ` • ${rate.toFixed(1)}/s` +
            ` • ETA ${formatSeconds(remaining)}`,
        );
      }, intervalMs);
    },

    tick(n = 1) {
      current += n;
    },

    stop() {
      const elapsed = nowSeconds();
      const avgRate = current / elapsed;

      if (interval) clearInterval(interval);

      if (isTTY) {
        process.stdout.write(
          `\r✔ ${label} (${total}/${total})` +
            ` • avg ${avgRate.toFixed(1)}/s` +
            ` • done in ${formatSeconds(elapsed)}\n`,
        );
      } else {
        console.log(`${label} done in ${elapsed.toFixed(1)}s`);
      }
    },
  };
}
