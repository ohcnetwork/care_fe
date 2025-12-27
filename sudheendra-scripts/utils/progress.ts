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

type ProgressNodeDef = {
  label: string;
  total?: number | null;
  status?: string;
  children?: ProgressNodeDef[];
};

export type ProgressNode = {
  label: string;
  total: number | null;
  current: number;
  status: string;
  start: bigint;
  done: boolean;
  frame: number;
  parent: ProgressNode | null;
  children: ProgressNode[];
};

export type ProgressTree = {
  start(): void;
  stop(): void;
  tick(node: ProgressNode, n?: number): void;
  setTotal(node: ProgressNode, total: number): void;
  status(node: ProgressNode, msg: string): void;
  nodes: ProgressNode[];
};

/**
 * Creates a progress tree for a given task.
 *
 * @example
 * const progress = createProgressTree([
 *   {
 *     label: 'Discover',
 *     total: null,
 *     status: 'scanning'
 *   },
 *   {
 *     label: 'Process',
 *     total: null,
 *     status: 'waiting'
 *   }
 * ]);
 *
 * progress.start();
 *
 * const [discover, processStage] = progress.nodes;
 *
 * (async () => {
 *   // Stage 1 discovers items
 *   await sleep(800);
 *   const items = Array.from({ length: 25 });
 *
 *   progress.setTotal(discover, items.length);
 *   for (const _ of items) {
 *     await sleep(50);
 *     progress.tick(discover);
 *   }
 *
 *   // Stage 2 now knows total
 *   progress.setTotal(processStage, items.length);
 *   progress.status(processStage, 'processing');
 *
 *   for (const _ of items) {
 *     await sleep(120);
 *     progress.tick(processStage);
 *   }
 *
 *   progress.stop();
 * })();
 *
 * function sleep(ms: number) {
 *   return new Promise<void>(r => setTimeout(r, ms));
 * }
 */
export function createProgressTree(
  rootDefs: ProgressNodeDef[],
  intervalMs = 80,
): ProgressTree {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const isTTY = process.stdout.isTTY;
  const startTime = process.hrtime.bigint();

  const now = () => process.hrtime.bigint();
  const secondsSince = (t: bigint) => Number(now() - t) / 1e9;

  function createNode(
    def: ProgressNodeDef,
    parent: ProgressNode | null,
  ): ProgressNode {
    const node: ProgressNode = {
      label: def.label,
      total: def.total ?? null,
      current: 0,
      status: def.status ?? "",
      start: now(),
      done: false,
      frame: 0,
      parent,
      children: [],
    };

    node.children = (def.children ?? []).map((c) => createNode(c, node));
    return node;
  }

  const roots = rootDefs.map((d) => createNode(d, null));

  function aggregate(node: ProgressNode) {
    if (!node.children.length) return;

    const totals = node.children
      .map((c) => c.total)
      .filter((t): t is number => typeof t === "number");

    node.total = totals.length ? totals.reduce((a, t) => a + t, 0) : null;
    node.current = node.children.reduce((a, c) => a + c.current, 0);
    node.done = totals.length > 0 && node.children.every((c) => c.done);
  }

  function bubble(node: ProgressNode) {
    let p = node.parent;
    while (p) {
      aggregate(p);
      p = p.parent;
    }
  }

  function rate(node: ProgressNode) {
    const e = secondsSince(node.start);
    return e > 0 ? node.current / e : 0;
  }

  function eta(node: ProgressNode) {
    if (node.total == null) return Infinity;
    const r = rate(node);
    return r > 0 ? (node.total - node.current) / r : Infinity;
  }

  function format(sec: number) {
    if (!Number.isFinite(sec)) return "∞";
    if (sec < 60) return `${sec.toFixed(1)}s`;
    const m = Math.floor(sec / 60);
    return `${m}m ${Math.round(sec % 60)}s`;
  }

  function renderNode(node: ProgressNode, depth = 0) {
    const indent = "  ".repeat(depth);
    const icon = node.done
      ? "✔"
      : node.current === 0
        ? "◯"
        : frames[node.frame++ % frames.length];

    if (node.total == null) {
      process.stdout.write(
        `${indent}${icon} ${node.label} • ${node.status || "discovering"}\n`,
      );
    } else {
      process.stdout.write(
        `${indent}${icon} ${node.label} (${node.current}/${node.total}) ` +
          (node.done
            ? `• done in ${format(secondsSince(node.start))}`
            : `• ${rate(node).toFixed(1)}/s • ETA ${format(eta(node))} • ${node.status}`) +
          "\n",
      );
    }

    node.children.forEach((c) => renderNode(c, depth + 1));
  }

  function overall() {
    const total = roots
      .map((r) => r.total)
      .filter((t): t is number => typeof t === "number")
      .reduce((a, t) => a + t, 0);

    const current = roots.reduce((a, r) => a + r.current, 0);
    const elapsed = secondsSince(startTime);
    const r = elapsed > 0 ? current / elapsed : 0;
    const remaining = r > 0 ? (total - current) / r : Infinity;

    return { total, current, r, remaining };
  }

  let interval: NodeJS.Timeout | null = null;

  function render() {
    process.stdout.write("\x1b[?25l");
    process.stdout.cursorTo(0, 0);
    process.stdout.clearScreenDown();

    roots.forEach((r) => renderNode(r));

    const o = overall();
    process.stdout.write(
      "\n" +
        "─".repeat(48) +
        "\n" +
        `Overall: ${o.current}/${o.total} • ${o.r.toFixed(1)}/s • ETA ${format(o.remaining)}\n`,
    );
  }

  function cleanup() {
    if (interval) clearInterval(interval);
    if (isTTY) process.stdout.write("\x1b[?25h");
  }

  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });

  return {
    start() {
      if (!isTTY) return;
      interval = setInterval(render, intervalMs);
    },

    tick(node: ProgressNode, n = 1) {
      if (node.done) return;
      if (node.total != null) {
        node.current = Math.min(node.current + n, node.total);
        node.done = node.current >= node.total;
      } else {
        node.current += n;
      }
      bubble(node);
    },

    setTotal(node: ProgressNode, total: number) {
      node.total = total;
      node.current = Math.min(node.current, total);
      node.done = node.current >= total;
      bubble(node);
    },

    status(node: ProgressNode, msg: string) {
      node.status = msg;
    },

    stop() {
      cleanup();
      if (isTTY) render();
    },

    nodes: roots,
  };
}
