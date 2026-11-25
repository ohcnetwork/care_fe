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

#let fonts = ("Figtree",)
#let mono-fonts = ("Geist Mono",) + fonts

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

/// A bordered table in the style of CAREUI's `Table`. `header` repeats on
/// every page; `header-align` defaults to centre; `empty` is shown without rows;
/// `outer` sets the outer border's sides and corner radius.
#let data-table(
  columns: (),
  align: (),
  header: (),
  header-align: none,
  rows: (),
  empty: none,
  outer: (stroke: (:), radius: px(6)),
) = {
  let n = columns.len()
  let header-align = if header-align == none {
    range(n).map(_ => center)
  } else { header-align }
  let line = px(1) + border-color

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
    // Never split a row across pages.
    set table.cell(breakable: false)
    table(
      columns: columns,
      inset: (x: px(8), y: px(8)),
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
    )
    },
  )
}

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

#let _facility-info(facility) = {
  text(size: text-size.xxl, weight: "semibold", facility.name)
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
  let info = box(_facility-info(header.facility))
  let alignment = if header.logo == none { "right" } else {
    header.logo.alignment
  }

  block(
    width: 100%,
    inset: (bottom: px(8)),
    stroke: (bottom: px(1) + border-color),
    below: px(12),
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
    },
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
