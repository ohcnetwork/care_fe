// CARE print library: shared page layout and components for Typst templates.
// 1 CSS px is 0.75pt, as when browsers print, so `px(14)` matches `text-sm`.
// Data reaches templates as JSON and is inserted as plain text: never `eval` it.

#let px(value) = value * 0.75pt

// The app passes the CAREUI palette through `sys.inputs.theme`; these defaults
// apply when a template is compiled outside the app.

#let _default-theme = (
  "gray-50": "#f9fafb",
  "gray-100": "#f3f4f6",
  "gray-200": "#e5e7eb",
  "gray-300": "#d1d5db",
  "gray-400": "#9ca3af",
  "gray-500": "#6b7280",
  "gray-600": "#4b5563",
  "gray-700": "#374151",
  "gray-800": "#1f2937",
  "gray-900": "#111827",
  "gray-950": "#030712",
  "neutral-50": "#fafafa",
  "neutral-100": "#f5f5f5",
  "neutral-200": "#e5e5e5",
  "neutral-300": "#d4d4d4",
  "neutral-950": "#0a0a0a",
  "red-600": "#dc2626",
  "red-50": "#fef2f2",
  "red-700": "#b91c1c",
  "yellow-200": "#fef08a",
  "yellow-600": "#ca8a04",
  "pink-50": "#fdf2f8",
  "pink-700": "#be185d",
  "green-100": "#dcfce7",
  "green-700": "#15803d",
)

#let _theme = {
  let input = sys.inputs.at("theme", default: none)
  let overrides = if input == none { (:) } else { json(bytes(input)) }
  _default-theme + overrides
}

/// A colour from the CAREUI palette, e.g. `palette("red", 600)`.
#let palette(name, shade) = rgb(_theme.at(name + "-" + str(shade)))

/// Shorthand for `palette("gray", shade)`, matching `text-gray-*` classes.
#let gray(shade) = palette("gray", shade)

// Light-theme semantic tokens (paper is always light).
#let foreground = palette("neutral", 950)
#let border-color = palette("neutral", 200)
#let soft-background = palette("neutral", 50)

#let text-size = (
  xs: px(12),
  sm: px(14),
  base: px(16),
  lg: px(18),
  xl: px(20),
  xxl: px(24),
)

// Typst can't use the computer's fonts, so a character Figtree lacks falls
// back to the next font that has it (Hindi and Marathi share Devanagari).
#let fonts = (
  "Figtree",
  "Noto Sans Malayalam",
  "Noto Sans Devanagari",
  "Noto Sans Tamil",
  "Noto Sans Kannada",
)
#let mono-fonts = ("Geist Mono",) + fonts

// Whether a block this wide is narrow, like A5 portrait (128mm between 10mm
// margins; A4 is 190mm). Narrow blocks get smaller text.
#let _is-narrow(width) = width < 450pt

/// An image at most `max-width` wide and `max-height` tall, keeping its aspect
/// ratio; one limited by height is centred.
#let bounded-image(path, max-width: none, max-height: none) = layout(size => {
  let width = if max-width == none { size.width } else {
    calc.min(size.width, max-width)
  }
  let img = image(path, width: width)
  if max-height != none and measure(img).height > max-height {
    align(center, image(path, height: max-height))
  } else {
    img
  }
})

/// A QR code from `useQrCode`. It holds a patient UUID (29 squares a side),
/// which scans easily at this size on any paper.
#let qr-code(path) = image(path, width: px(80))

#let labelled(label, value) = [#text(weight: "semibold", label + ":") #value]

/// A value with smaller, muted lines below it (e.g. lot number, unit tax).
#let with-subtext(value, ..lines) = {
  let lines = lines.pos().filter(l => l != none)
  if lines.len() == 0 { return value }
  stack(
    spacing: px(2),
    value,
    ..lines.map(l => text(size: text-size.xs, fill: gray(500), l)),
  )
}

#let dashed-rule() = block(
  width: 100%,
  inset: (y: px(4)),
  line(length: 100%, stroke: (
    paint: gray(200),
    thickness: px(2),
    dash: "dashed",
  )),
)

/// Right-aligned "label  value" rows, like an invoice's totals. A row is
/// (label, value, muted?: bool, strong?: bool).
#let summary(rows, width: px(256)) = align(right, block(width: width, stack(
  spacing: px(8),
  ..rows.map(row => {
    let muted = row.at("muted", default: false)
    let strong = row.at("strong", default: false)
    set text(
      fill: if muted { gray(500) } else { gray(950) },
      weight: if strong { "semibold" } else { "regular" },
    )
    grid(
      columns: (1fr, auto),
      column-gutter: px(8),
      row.label, row.value,
    )
  }),
)))

#let _break-after = regex("[^-,;/)\\]]*[-,;/)\\]]?")
#let _kannada-virama = regex("\u{0CCD}\u{200D}?$")

// The letters of `s`. Typst keeps joined letters together, except Kannada's
// (ಸ್ + ವಾ), so join those.
#let _letters(s) = {
  let units = ()
  for c in s.clusters() {
    if units.len() > 0 and units.last().ends-with(_kannada-virama) {
      units.last() += c
    } else {
      units.push(c)
    }
  }
  units
}

#let _word-or-space = regex("\\S+|\\s+")

// Splits a word wider than `width` into lines: after punctuation first, then
// between letters.
#let _break-word(word, width) = {
  let lines = ()
  let line = ""
  for piece in word.matches(_break-after).map(m => m.text).filter(p => p != "") {
    let units = if measure(text(piece)).width > width { _letters(piece) } else { (piece,) }
    for unit in units {
      if line != "" and measure(text(line + unit)).width > width {
        lines.push(line)
        line = unit
      } else {
        line += unit
      }
    }
  }
  lines.push(line)
  lines.join(linebreak())
}

/// Breaks words wider than their cell, like CSS `overflow-wrap: anywhere`
/// (Typst can't: typst/typst#674). Uses line breaks, not zero-width spaces,
/// which PDF viewers drop characters next to when copying. Matches up to 100
/// words at a time: past ~500 show-rule matches in one paragraph, Typst fails
/// with "maximum grouping depth exceeded".
#let fit-words(body) = layout(size => {
  show regex("\\S+(?:\\s+\\S+){0,99}"): words => context {
    words.text.matches(_word-or-space).map(m => {
      let t = m.text
      if t.trim() == "" or measure(text(t)).width <= size.width { t } else { _break-word(t, size.width) }
    }).join()
  }
  body
})

// A task list's checkbox, drawn: Figtree and Noto have no ☐ or ☑.
#let _checkbox(checked) = box(
  width: 0.75em,
  height: 0.75em,
  baseline: 0.1em,
  stroke: 0.06em + gray(700),
  radius: 0.12em,
  if checked {
    let tick = 0.1em + gray(900)
    place(line(start: (18%, 52%), end: (42%, 76%), stroke: tick))
    place(line(start: (42%, 76%), end: (82%, 26%), stroke: tick))
  },
)

#let _rich-run(run) = {
  if run.kind == "break" { return linebreak() }
  let body = if "code" in run.marks { text(font: mono-fonts, run.text) } else { text(run.text) }
  if "bold" in run.marks { body = strong(body) }
  if "italic" in run.marks { body = emph(body) }
  if "underline" in run.marks { body = underline(body) }
  if "strike" in run.marks { body = strike(body) }
  if "highlight" in run.marks { body = highlight(fill: palette("yellow", 200), body) }
  if run.link != none and run.link != "" {
    body = link(run.link, if "underline" in run.marks { body } else { underline(body) })
  }
  body
}

#let _rich-blocks(nodes, lead: none) = {
  let parts = ()
  let lead-left = lead != none
  for node in nodes {
    let body = if node.kind == "paragraph" {
      node.runs.map(_rich-run).join()
    } else if node.kind == "heading" {
      let size = (1.4em, 1.25em, 1.1em).at(node.level - 1, default: 1em)
      text(size: size, weight: "semibold", node.runs.map(_rich-run).join())
    } else if node.kind == "list" {
      let item-body(item) = {
        let body = _rich-blocks(item.blocks)
        if item.checked == none { body } else {
          grid(columns: (auto, 1fr), column-gutter: 0.4em, _checkbox(item.checked), body)
        }
      }
      // A checklist shows checkboxes in place of bullets, as on screen.
      if node.items.all(item => item.checked != none) {
        stack(spacing: px(4), ..node.items.map(item-body))
      } else if node.ordered {
        enum(start: node.start, ..node.items.map(item-body))
      } else {
        // Typst's default second-level marker (‣) isn't in Figtree.
        list(marker: ([•], [–]), ..node.items.map(item-body))
      }
    } else if node.kind == "quote" {
      block(
        inset: (left: px(8)),
        stroke: (left: px(2) + gray(300)),
        text(fill: gray(600), _rich-blocks(node.blocks)),
      )
    } else if node.kind == "rule" {
      line(length: 100%, stroke: px(1) + border-color)
    }
    if lead-left {
      lead-left = false
      if node.kind == "paragraph" { body = [#lead #body] } else { parts.push(lead) }
    }
    parts.push(body)
  }
  if lead-left { parts.push(lead) }
  stack(spacing: px(6), ..parts)
}

/// Markdown from the rich-text editor, as blocks from src/print/richText.ts.
/// The text is only drawn, never evaluated. `lead` (e.g. "Note:") goes before
/// the first paragraph.
#let rich-text(blocks, lead: none) = fit-words(_rich-blocks(blocks, lead: lead))

/// Applies `fit-words` to a table's cells, except in `auto` columns, where it
/// would split values that should fit (amounts, "6.00%").
#let fit-cells(columns, body) = {
  show table.cell: cell => {
    let spanned = range(cell.x, cell.x + cell.colspan)
    if spanned.all(x => columns.at(x) == auto) { return cell }
    let inset = if type(cell.inset) == dictionary { cell.inset } else { (rest: cell.inset) }
    pad(..inset, align(cell.align, fit-words(cell.body)))
  }
  body
}

/// A bordered table in the style of CAREUI's `Table`. `header` repeats on
/// every page; `header-align` defaults to centre; `empty` is shown without rows;
/// `outer` sets the outer border's sides and corner radius. Put free text in
/// `fr` columns: long text in an `auto` column squeezes the `fr` ones. Rows
/// continue on the next page: a row kept whole loses what runs past the page.
#let data-table(
  columns: (),
  align: (),
  header: (),
  header-align: none,
  rows: (),
  empty: none,
  outer: (stroke: (:), radius: px(6)),
) = layout(size => {
  let n = columns.len()
  let header-align = if header-align == none {
    range(n).map(_ => center)
  } else { header-align }
  let line = px(1) + border-color
  // Narrow pages (A5 portrait) get smaller text and padding.
  let narrow = _is-narrow(size.width)
  let inset = if narrow { (x: px(4), y: px(6)) } else { (x: px(8), y: px(8)) }
  let font-size = if narrow { text-size.xs } else { text.size }

  // If the `auto` columns would leave the `fr` ones under 40% of the width,
  // size each to its widest value instead, so only its header wraps.
  let sizes = columns
  if rows.len() > 0 and rows.all(r => r.len() == n) and columns.any(c => type(c) == fraction) {
    let content-of(c) = if type(c) == content and c.func() == table.cell { c.body } else { c }
    let width(c) = measure(text(size: font-size, weight: "medium", content-of(c))).width
    let longest-word(h) = if type(h) == str { calc.max(..h.split(" ").map(width)) } else { width(h) }
    let fit = range(n).map(i => if columns.at(i) != auto { none } else {
      calc.max(longest-word(header.at(i)), ..rows.map(r => width(r.at(i)))) + 2 * inset.x
    })
    let natural = range(n).map(i => if fit.at(i) == none { 0pt } else {
      calc.max(fit.at(i), width(header.at(i)) + 2 * inset.x)
    })
    if size.width - natural.sum() < 0.4 * size.width {
      sizes = range(n).map(i => if fit.at(i) == none { columns.at(i) } else { fit.at(i) })
    }
  }

  let body = if rows.len() == 0 and empty != none {
    (table.cell(colspan: n, align: center, text(fill: gray(500), empty)),)
  } else {
    rows.flatten()
  }

  block(
    width: 100%,
    stroke: outer.at("stroke", default: px(1) + gray(300)),
    radius: outer.at("radius", default: px(6)),
    clip: true,
    {
    set text(weight: "medium", fill: gray(950))
    set text(size: font-size) if narrow
    fit-cells(columns, table(
      columns: sizes,
      inset: inset,
      align: (x, y) => if y == 0 { header-align.at(x) + horizon } else {
        align.at(x) + horizon
      },
      fill: (_, y) => if y == 0 { soft-background },
      stroke: (x, y) => (
        left: if x > 0 { line },
        top: if y > 0 { line },
      ),
      table.header(..header),
      ..body,
    ))
    },
  )
})

/// Small print at the end of a document ("Created by", "Location", ...).
#let print-meta(left: none, right: none) = block(above: px(8), {
  set text(size: px(10), fill: gray(500))
  grid(
    columns: (1fr, auto),
    column-gutter: px(12),
    left, right,
  )
})

/// Small uppercase title above a document, e.g. "DISPENSE ORDER".
#let doc-heading(title) = block(
  below: px(8),
  text(
    size: text-size.sm,
    weight: "semibold",
    fill: gray(500),
    tracking: 0.05em,
    upper(title),
  ),
)

/// "Label : value" rows. Each row is `(label, value)`; a missing value is "-".
#let detail-rows(rows, label-width: px(128)) = stack(
  spacing: px(8),
  ..rows.map(row => grid(
    columns: (label-width, auto, 1fr),
    text(fill: gray(600), row.label),
    text(fill: gray(600), ":"),
    pad(left: px(4), text(weight: "semibold", if (
      row.value == none or row.value == ""
    ) { "-" } else {
      // A zero-width space lets long ids wrap; Typst won't break a hyphen before a digit.
      row.value.replace("-", "-\u{200B}")
    })),
  )),
)

/// Two columns of detail rows under a rule, as at the top of pharmacy documents.
#let patient-details(left, right) = block(
  width: 100%,
  above: 0pt,
  below: px(16),
  inset: (top: px(8)),
  stroke: (top: px(1) + gray(200)),
  grid(
    columns: (1fr, 1fr),
    column-gutter: px(24),
    detail-rows(left), detail-rows(right),
  ),
)

#let _facility-info(facility, narrow) = {
  let name-size = if narrow { text-size.xl } else { text-size.xxl }
  text(size: name-size, weight: "semibold", facility.name)
  set text(size: text-size.xs, fill: gray(500))
  if facility.address != none { linebreak(); facility.address }
  if facility.phone != none { linebreak(); facility.phone }
}

#let _logo(logo) = {
  let width = if logo.width != none { px(logo.width) } else { auto }
  let height = if logo.height != none { px(logo.height) } else { auto }
  if width == auto and height == auto { height = px(40) }
  image(logo.path, width: width, height: height, fit: "contain")
}

#let _header(header) = {
  if header == none or header.hidden { return }

  if header.image != none {
    return block(below: px(16), bounded-image(
      header.image.path,
      max-width: px(768),
      max-height: if header.image.max_height != none {
        px(header.image.max_height)
      },
    ))
  }

  let logo = if header.logo != none { _logo(header.logo) }
  let alignment = if header.logo == none { "right" } else {
    header.logo.alignment
  }

  block(
    width: 100%,
    inset: (bottom: px(8)),
    stroke: (bottom: px(1) + border-color),
    below: px(12),
    // Measured across the page: next to a wide logo, the name's own cell is
    // narrow even on A4.
    layout(size => {
      let info = box(_facility-info(header.facility, _is-narrow(size.width)))
      if alignment == "center" {
        stack(spacing: px(8), align(center, logo), info)
      } else if alignment == "left" {
        grid(
          columns: (auto, 1fr),
          column-gutter: px(12),
          logo, align(right, info),
        )
      } else {
        grid(
          columns: (1fr, auto),
          column-gutter: px(12),
          info, logo,
        )
      }
    }),
  )
}

#let _tiled-watermark(watermark) = {
  let size = (px(220), px(100))
  let fill = gray(900).transparentize((1 - watermark.opacity) * 100%)
  let tile = tiling(size: size, block(
    width: size.at(0),
    height: size.at(1),
    align(center + horizon, rotate(watermark.rotation * 1deg, reflow: false, text(
      font: fonts,
      size: px(12),
      weight: "semibold",
      tracking: px(2),
      fill: fill,
      watermark.text,
    ))),
  ))
  place(top + left, rect(width: 100%, height: 100%, fill: tile, stroke: none))
}

#let _status-watermark(status) = {
  let colour = (
    red: palette("red", 600),
    gray: gray(600),
    yellow: palette("yellow", 600),
  ).at(status.color, default: palette("red", 600))
  place(center + horizon, rotate(-30deg, reflow: false, text(
    font: fonts,
    size: px(60),
    weight: "bold",
    tracking: 0.1em,
    fill: colour.transparentize(80%),
    upper(status.text),
  )))
}

/// "Patient: name" on the left and the identifiers on the right, for the top of
/// continuation pages. Takes `{ name, identifiers: [{ label, value }] }`.
#let patient-running-header(patient, label) = {
  set text(size: 8pt, fill: gray(700))
  grid(
    columns: (1fr, auto),
    column-gutter: px(16),
    align: (left + bottom, right + bottom),
    [#label: #patient.name],
    patient.identifiers.map(id => id.label + ": " + id.value).join(" | "),
  )
}

// Shown on every page except the first, which has the full header.
#let _running-header(running-header) = if running-header != none {
  context if counter(page).get().first() > 1 { running-header }
}

#let _page-number(template) = context {
  let total = counter(page).final().first()
  let current = counter(page).get().first()
  set text(size: px(10), fill: gray(500))
  align(center, template
    .replace("{current}", str(current))
    .replace("{total}", str(total)))
}

/// Applies the facility's print template: page, header, footer image,
/// watermarks and page numbers. Use as `#show: document.with(data.layout)`.
/// `running-header` repeats on pages after the first if the top margin is 8mm+.
#let document(layout, body, running-header: none) = {
  let page-config = layout.page
  let margin = page-config.margin

  set std.document(title: layout.title)
  set page(
    paper: page-config.paper,
    flipped: page-config.flipped,
    margin: (
      top: margin.top * 1mm,
      right: margin.right * 1mm,
      bottom: margin.bottom * 1mm,
      left: margin.left * 1mm,
    ),
    // Above the content so opaque header images don't hide watermarks.
    foreground: {
      if layout.watermark != none { _tiled-watermark(layout.watermark) }
      if layout.status_watermark != none {
        _status-watermark(layout.status_watermark)
      }
    },
    header: _running-header(running-header),
    header-ascent: px(4),
    footer: _page-number(layout.labels.page_x_of_y),
  )
  // Measure lines like CSS (ascender to descender) so Tailwind spacing carries
  // over: `stack(spacing: px(4))` is `gap-1`. Leading gives `text-sm`'s ~1.43.
  set text(
    font: fonts,
    size: text-size.sm,
    fill: foreground,
    top-edge: "ascender",
    bottom-edge: "descender",
  )
  set par(leading: 0.25em, spacing: px(8))
  show strong: set text(weight: "semibold")

  _header(layout.header)
  body

  if layout.footer_image != none {
    // Like `mt-auto`: push the footer image to the bottom of the last page.
    v(1fr)
    block(above: px(8), bounded-image(
      layout.footer_image.path,
      max-height: if layout.footer_image.max_height != none {
        px(layout.footer_image.max_height)
      },
    ))
  }
}
