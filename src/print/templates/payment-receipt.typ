#import "../typst/care.typ": *

#let data = json(sys.inputs.at("data"))
#let c = data.content
#let border = px(1) + gray(300)

#show: document.with(data.layout)

#block(
  width: 100%,
  below: px(16),
  inset: (bottom: px(8)),
  stroke: (bottom: px(1) + gray(200)),
  {
    text(size: text-size.xl, weight: "semibold", upper(c.title))
    h(px(8))
    box(
      stroke: border,
      radius: px(4),
      inset: (x: px(6), y: px(2)),
      text(size: text-size.xs, weight: "semibold", upper(c.outcome)),
    )
  },
)

#patient-details(c.details.left, c.details.right)

#if c.invoice != none {
  data-table(
    columns: (1fr, auto, auto),
    align: (left, left, right),
    header-align: (left, left, right),
    header: c.invoice.header,
    rows: (c.invoice.row,),
  )
  v(px(16))
}

#data-table(
  columns: (1fr, auto, auto, auto),
  align: (left, left, left, right),
  header-align: (left, left, left, right),
  header: c.breakdown.header,
  rows: (c.breakdown.row,),
)

#v(px(24))
#summary(c.totals)

#if c.note != none {
  block(
    above: px(32),
    width: 100%,
    inset: (top: px(16)),
    stroke: (top: px(1) + border-color),
    [
      #text(weight: "medium", fill: gray(950), c.labels.notes)
      #block(above: px(4), text(fill: gray(600), c.note))
    ],
  )
}

#print-meta(left: c.footer.left, right: c.footer.right)
