/**
 * Pre-React loading screen.
 *
 * Renders the pixel-art Care loading animation from the very first paint,
 * before the React bundle loads. Vanilla JS port of
 * `src/components/ui/loading-animation-svg.tsx` — keep the two in sync.
 *
 * Lifecycle:
 *   1. Runs synchronously; injects SVG + text into <div id="app-loading">.
 *   2. Cycles heart ⇄ logo until React is ready.
 *   3. React's <Loading /> holds the screen via __holdLoadingScreen() while it
 *      is mounted, so the hand-off never restarts the animation midway.
 *   4. App calls __removeLoadingScreen() after its first commit. The screen
 *      fades out at the next settled shape once no <Loading /> holds it, so
 *      the animation is never cut off mid-transition.
 */
(function () {
  var ROWS = 8,
    COLS = 10;
  var WAVE_STEP_MS = 50;
  var HOLD_MS = 650;
  var CELL_ANIM_MS = 300;
  var SAFETY_TIMEOUT_MS = 3000;
  var HEART_FILL = "#f43f5e"; // rose-500
  var LOGO_LIGHT = "#059669"; // emerald-600
  var LOGO_DARK = "#047857"; // emerald-700
  var R = 0.3;

  var HEART_PATTERN = [
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
  ];

  var LOGO_PATTERN = [
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
    [1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
  ];

  var LOGO_LIGHT_KEYS = {
    "0,2": 1,
    "1,2": 1,
    "0,3": 1,
    "1,3": 1,
    "0,6": 1,
    "1,6": 1,
    "0,7": 1,
    "1,7": 1,
    "2,0": 1,
    "2,1": 1,
    "3,0": 1,
    "3,1": 1,
    "2,8": 1,
    "2,9": 1,
    "3,8": 1,
    "3,9": 1,
  };

  var CORNER_MAP = {
    "0,2": { tl: R },
    "0,3": { tr: R },
    "0,6": { tl: R },
    "0,7": { tr: R },
    "2,0": { tl: R },
    "3,0": { bl: R },
    "2,9": { tr: R },
    "3,9": { br: R },
    "7,4": { bl: R },
    "7,5": { br: R },
  };

  // ─── cell path builder ────────────────────────────────────────────────────
  function cellPath(x, y, c) {
    c = c || {};
    var w = 1.01,
      h = 1.01;
    var tl = c.tl || 0,
      tr = c.tr || 0,
      br = c.br || 0,
      bl = c.bl || 0;
    var p = [];
    p.push("M " + (x + tl) + "," + y);
    p.push("L " + (x + w - tr) + "," + y);
    if (tr) p.push("Q " + (x + w) + "," + y + " " + (x + w) + "," + (y + tr));
    p.push("L " + (x + w) + "," + (y + h - br));
    if (br)
      p.push(
        "Q " + (x + w) + "," + (y + h) + " " + (x + w - br) + "," + (y + h),
      );
    p.push("L " + (x + bl) + "," + (y + h));
    if (bl) p.push("Q " + x + "," + (y + h) + " " + x + "," + (y + h - bl));
    p.push("L " + x + "," + (y + tl));
    if (tl) p.push("Q " + x + "," + y + " " + (x + tl) + "," + y);
    p.push("Z");
    return p.join(" ");
  }

  // ─── build cell data ──────────────────────────────────────────────────────
  function distFromCenter(c) {
    return Math.sqrt(Math.pow(c.row - 3.5, 2) + Math.pow(c.col - 4.5, 2));
  }

  var CELL_DATA = [];
  for (var row = 0; row < ROWS; row++) {
    for (var col = 0; col < COLS; col++) {
      var key = row + "," + col;
      CELL_DATA.push({
        row: row,
        col: col,
        idx: row * COLS + col,
        inHeart: HEART_PATTERN[row][col] === 1,
        inLogo: LOGO_PATTERN[row][col] === 1,
        isLogoLight: !!LOGO_LIGHT_KEYS[key],
        d: cellPath(col, row, CORNER_MAP[key]),
      });
    }
  }
  CELL_DATA.sort(function (a, b) {
    return distFromCenter(a) - distFromCenter(b);
  });

  var CELL_BY_IDX = new Array(ROWS * COLS);
  CELL_DATA.forEach(function (c) {
    CELL_BY_IDX[c.idx] = c;
  });

  // ─── wave groups ──────────────────────────────────────────────────────────
  // Cells at the same rounded radial distance fire together as a crisp ring.
  var groupMap = {};
  CELL_DATA.forEach(function (c) {
    var k = Math.round(distFromCenter(c) * 2);
    if (!groupMap[k]) groupMap[k] = [];
    groupMap[k].push(c.idx);
  });
  var WAVE_GROUPS = Object.keys(groupMap)
    .map(Number)
    .sort(function (a, b) {
      return a - b;
    })
    .map(function (k) {
      return groupMap[k];
    });
  var WAVE_GROUPS_REV = WAVE_GROUPS.slice().reverse();

  // ─── build DOM ────────────────────────────────────────────────────────────
  var NS = "http://www.w3.org/2000/svg";

  var container = document.getElementById("app-loading");
  if (!container) return;

  var svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 " + COLS + " " + ROWS);
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "display:block;width:64px;height:51.2px";

  // beatG owns the heartbeat — all paths composite as one layer
  var beatG = document.createElementNS(NS, "g");
  beatG.style.cssText = "transform-box:fill-box;transform-origin:center";
  svg.appendChild(beatG);

  var pathEls = new Array(ROWS * COLS);
  var KF = new Array(ROWS * COLS);
  for (var i = 0; i < ROWS * COLS; i++) {
    var cell = CELL_BY_IDX[i];
    var lFill = cell.isLogoLight ? LOGO_LIGHT : LOGO_DARK;
    KF[i] = {
      heartIn: [
        { fill: HEART_FILL, transform: "scale(0.35)", opacity: "0" },
        { fill: HEART_FILL, transform: "scale(1)", opacity: "1" },
      ],
      logoIn: [
        { fill: lFill, transform: "scale(0.35)", opacity: "0" },
        { fill: lFill, transform: "scale(1)", opacity: "1" },
      ],
      heartOut: [
        { fill: HEART_FILL, transform: "scale(1)", opacity: "1" },
        { fill: HEART_FILL, transform: "scale(0.35)", opacity: "0" },
      ],
      logoOut: [
        { fill: lFill, transform: "scale(1)", opacity: "1" },
        { fill: lFill, transform: "scale(0.35)", opacity: "0" },
      ],
      heartToLogo: [
        { fill: HEART_FILL, transform: "scale(1)", opacity: "1", offset: 0 },
        { fill: HEART_FILL, transform: "scale(0.68)", opacity: "0.4", offset: 0.3 },
        { fill: lFill, transform: "scale(0.68)", opacity: "0.4", offset: 0.33 },
        { fill: lFill, transform: "scale(1)", opacity: "1", offset: 1 },
      ],
      logoToHeart: [
        { fill: lFill, transform: "scale(1)", opacity: "1", offset: 0 },
        { fill: lFill, transform: "scale(0.68)", opacity: "0.4", offset: 0.3 },
        { fill: HEART_FILL, transform: "scale(0.68)", opacity: "0.4", offset: 0.33 },
        { fill: HEART_FILL, transform: "scale(1)", opacity: "1", offset: 1 },
      ],
    };
    var path = document.createElementNS(NS, "path");
    path.setAttribute("d", cell.d);
    path.setAttribute("fill", "transparent");
    path.setAttribute("opacity", "0");
    path.style.cssText = "transform-box:fill-box;transform-origin:center";
    beatG.appendChild(path);
    pathEls[i] = path;
  }

  // Matches the React label; i18n isn't available before the bundle loads.
  var label = document.createElement("p");
  label.style.cssText =
    "margin:0;padding-left:12px;text-align:center;font-size:12px;line-height:16px;font-weight:500;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280";
  label.appendChild(document.createTextNode("loading"));
  var dots = [];
  for (var d = 0; d < 3; d++) {
    var dot = document.createElement("span");
    dot.textContent = ".";
    dot.style.opacity = "0";
    label.appendChild(dot);
    dots.push(dot);
  }

  container.appendChild(svg);
  container.appendChild(label);

  dots.forEach(function (dot, i) {
    dot.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], {
      duration: 1500,
      delay: i * 200,
      iterations: Infinity,
    });
  });

  // ─── animation engine ─────────────────────────────────────────────────────
  var timers = new Set();
  var mounted = true;
  var isFirstShow = true;
  var pendingRemove = false;
  var holds = 0;

  function schedule(fn, delay) {
    var id = setTimeout(function () {
      timers.delete(id);
      if (mounted) fn();
    }, delay);
    timers.add(id);
  }

  function show(next, onDone) {
    var first = isFirstShow;
    if (first) isFirstShow = false;

    var nextProp = next === "heart" ? "inHeart" : "inLogo";
    var prevProp = next === "heart" ? "inLogo" : "inHeart";
    var groups = next === "logo" ? WAVE_GROUPS_REV : WAVE_GROUPS;
    var waveDuration = (groups.length - 1) * WAVE_STEP_MS;

    // lub-dub heartbeat while the shape is filling in
    schedule(
      function () {
        beatG.animate(
          [
            { transform: "scale(1)", offset: 0 },
            { transform: "scale(1.08)", offset: 0.2 },
            { transform: "scale(1)", offset: 0.46 },
            { transform: "scale(1.03)", offset: 0.68 },
            { transform: "scale(1)", offset: 1 },
          ],
          { duration: 580, easing: "ease-in-out", fill: "none" },
        );
      },
      Math.round(waveDuration * 0.45),
    );

    groups.forEach(function (indices, i) {
      schedule(function () {
        indices.forEach(function (idx) {
          var cell = CELL_BY_IDX[idx];
          var inNext = cell[nextProp];
          var inPrev = !first && cell[prevProp];
          if (!inNext && !inPrev) return;

          var el = pathEls[idx];
          el.getAnimations().forEach(function (a) {
            try {
              a.commitStyles();
            } catch (e) {
              /* ignore */
            }
            a.cancel();
          });

          var kf = KF[idx];
          if (inNext && inPrev) {
            el.animate(next === "heart" ? kf.logoToHeart : kf.heartToLogo, {
              duration: CELL_ANIM_MS,
              easing: "ease-in-out",
              fill: "forwards",
            });
          } else if (inNext) {
            el.animate(next === "heart" ? kf.heartIn : kf.logoIn, {
              duration: CELL_ANIM_MS,
              easing: "cubic-bezier(0.2, 0, 0.2, 1)",
              fill: "forwards",
            });
          } else {
            el.animate(next === "heart" ? kf.logoOut : kf.heartOut, {
              duration: CELL_ANIM_MS,
              easing: "cubic-bezier(0.55, 0, 1, 0.45)",
              fill: "forwards",
            });
          }
        });
      }, i * WAVE_STEP_MS);
    });

    // Gentle breathing pulse mid-hold
    schedule(
      function () {
        beatG.animate(
          [
            { transform: "scale(1)", offset: 0 },
            { transform: "scale(1.025)", offset: 0.5 },
            { transform: "scale(1)", offset: 1 },
          ],
          {
            duration: Math.round(HOLD_MS * 0.8),
            easing: "ease-in-out",
            fill: "none",
          },
        );
      },
      waveDuration + Math.round(CELL_ANIM_MS * 0.55),
    );

    schedule(onDone, waveDuration + HOLD_MS);
  }

  // ─── teardown ─────────────────────────────────────────────────────────────
  function canRemove() {
    return mounted && pendingRemove && holds === 0;
  }

  function doRemove() {
    mounted = false;
    timers.forEach(clearTimeout);
    timers.clear();
    delete window.__removeLoadingScreen;
    delete window.__holdLoadingScreen;

    container.style.pointerEvents = "none";
    container.style.transition = "opacity 150ms ease";
    container.style.opacity = "0";
    setTimeout(function () {
      if (container.parentNode) container.parentNode.removeChild(container);
    }, 200);
  }

  // Ensures removal even if the cycle loop stalls (e.g. throttled timers).
  function armSafetyTimeout() {
    setTimeout(function () {
      if (canRemove()) doRemove();
    }, SAFETY_TIMEOUT_MS);
  }

  // ─── start loop ───────────────────────────────────────────────────────────
  var nextShape = "heart";
  function cycle() {
    show(nextShape, function () {
      if (canRemove()) return doRemove();
      nextShape = nextShape === "heart" ? "logo" : "heart";
      cycle();
    });
  }
  cycle();

  /**
   * Called once React has committed. The screen fades out at the next settled
   * shape, or immediately with `{ immediate: true }`.
   */
  window.__removeLoadingScreen = function (options) {
    if (!mounted) return;
    pendingRemove = true;
    if (options && options.immediate) {
      holds = 0;
      doRemove();
      return;
    }
    armSafetyTimeout();
  };

  /**
   * Keeps the screen up while React is still only showing its own loader, so
   * the user sees one continuous animation. Returns a release function.
   */
  window.__holdLoadingScreen = function () {
    if (!mounted) return function () {};
    holds++;
    var released = false;
    return function () {
      if (released) return;
      released = true;
      holds--;
      if (canRemove()) armSafetyTimeout();
    };
  };
})();
