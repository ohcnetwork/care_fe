#import "../typst/care.typ": *

#let data = json(sys.inputs.at("data"))
#let c = data.content
#let border = px(1) + gray(300)

#show: document.with(
  data.layout,
  running-header: patient-running-header(c.patient, c.patient_label),
)

#let split-at = calc.ceil(c.patient_rows.len() / 2)

#doc-heading(c.heading)
#patient-details(
  c.patient_rows.slice(0, split-at),
  c.patient_rows.slice(split-at),
)

#let results-table(results) = {
  let n = results.header.len()
  table(
    columns: (1fr,) * n,
    inset: px(6),
    stroke: border,
    align: left + top,
    table.header(..results.header.map(h => table.cell(
      fill: soft-background,
      text(weight: "medium", fill: gray(600), h),
    ))),
    ..results.rows.map(row => row.cells.enumerate().map(((i, cell)) => table.cell(
      fill: if row.component { soft-background },
      inset: if i == 0 and row.component {
        (left: px(18), right: px(6), y: px(6))
      } else { px(6) },
      text(
        weight: if row.highlight and i > 0 and i != 2 { "bold" } else { "regular" },
        cell,
      ),
    ))).flatten(),
  )
}

#let labelled-text(item) = block(above: px(12), width: 100%, {
  text(weight: "medium", fill: gray(700), item.label)
  linebreak()
  item.text
})

#for report in c.reports {
  block(
    above: px(24),
    below: px(8),
    width: 100%,
    inset: (top: px(16)),
    stroke: (top: px(1) + border-color),
    text(size: text-size.lg, weight: "semibold", report.title),
  )
  grid(
    columns: (1fr, 1fr),
    column-gutter: px(24),
    row-gutter: px(6),
    ..report.rows.map(row => detail-rows((row,))),
  )
  v(px(16))
  if report.results != none { results-table(report.results) }
  if report.note != none { labelled-text(report.note) }
  if report.conclusion != none { labelled-text(report.conclusion) }
}

#print-meta(left: c.footer.left, right: c.footer.right)

#for report in c.reports {
  for path in report.attachments {
    pagebreak()
    block(width: 100%, height: 100%, align(center + horizon, image(
      path,
      width: 100%,
      height: 100%,
      fit: "contain",
    )))
  }
}
