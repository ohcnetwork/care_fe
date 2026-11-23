#import "../typst/care.typ": *

#let data = json(sys.inputs.at("data"))
#let c = data.content

#show: document.with(
  data.layout,
  running-header: if c.patient != none {
    patient-running-header(c.patient, c.patient_label)
  },
)

#doc-heading(c.heading)
#patient-details(c.details.left, c.details.right)

#if c.title != none or c.note != none {
  block(below: px(8), {
    if c.title != none { text(size: text-size.lg, weight: "semibold", fill: gray(700), c.title) }
    if c.title != none and c.note != none { parbreak() }
    if c.note != none { text(fill: gray(600), c.note) }
  })
}

#if c.table_title != none {
  block(below: px(8), text(size: text-size.base, weight: "semibold", c.table_title))
}
#data-table(
  columns: (1fr,) + (auto,) * (c.table.header.len() - 1),
  align: (left,) + (center,) * (c.table.header.len() - 1),
  header-align: (left,) + (center,) * (c.table.header.len() - 1),
  header: c.table.header,
  rows: c.table.rows,
  outer: (stroke: px(1) + border-color, radius: px(6)),
)

#print-meta(left: c.footer.left, right: c.footer.right)
