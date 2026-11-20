#import "../typst/care.typ": *

#let data = json(sys.inputs.at("data"))
#let c = data.content

#show: document.with(data.layout)
#set text(size: text-size.xs)

#let alignments = (left: left, center: center, right: right)
#let rule = px(1) + gray(300)

#let section-table(section) = {
  let n = section.header.len()
  if section.title != none {
    block(above: px(16), below: px(4), text(size: text-size.sm, weight: "semibold", section.title))
  } else { v(px(4)) }
  table(
    columns: range(n).map(i => if i == section.grow { 1fr } else { auto }),
    inset: (x: px(4), y: px(2)),
    align: (x, y) => alignments.at(section.align.at(x)) + horizon,
    stroke: (x, y) => if y == 0 { (y: rule) },
    table.header(..section.header.map(h => text(weight: "bold", h))),
    ..section.rows.map(row => {
      let fill = if row.at("flagged", default: false) { palette("red", 50) }
      let ink = if row.at("flagged", default: false) { palette("red", 700) } else { foreground }
      if row.type == "group" {
        (
          table.cell(colspan: n - 1, text(weight: "bold", row.cells.at(0))),
          table.cell(align: right, text(weight: "bold", row.cells.at(1))),
        )
      } else if row.type == "total" {
        (
          table.cell(colspan: n - 1, fill: gray(50), align: right, text(weight: "semibold", row.cells.at(0))),
          table.cell(fill: gray(50), align: right, text(weight: "semibold", row.cells.at(1))),
        )
      } else {
        row.cells.map(cell => table.cell(fill: fill, text(fill: ink, cell)))
      }
    }).flatten(),
  )
}

#if c.warning != none {
  text(fill: palette("red", 600), c.warning)
} else {
  if c.header_space { block(height: px(80), below: px(16), width: 100%, stroke: (bottom: px(1) + gray(200)))[] }

  grid(
    columns: (1fr, 1fr),
    column-gutter: px(32),
    detail-rows(c.details.left, label-width: px(88)),
    detail-rows(c.details.right, label-width: px(96)),
  )

  for section in c.sections { section-table(section) }

  if c.account_summary != none {
    v(px(16))
    table(
      columns: (1fr,) * 4,
      inset: px(3),
      align: center + horizon,
      stroke: rule,
      ..c.account_summary.header.map(h => text(weight: "bold", h)),
      ..c.account_summary.row,
    )
  }

  print-meta(left: c.footer.left, right: c.footer.right)
}
