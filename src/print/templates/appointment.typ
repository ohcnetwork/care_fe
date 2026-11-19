#import "../typst/care.typ": *

#let data = json(sys.inputs.at("data"))
#let c = data.content

#show: document.with(data.layout)
#set text(size: text-size.xs)

#let section-title(title) = block(below: px(2), text(weight: "semibold", fill: gray(950), title))
#let total-line(total) = align(right, pad(top: px(4), right: px(4), {
  text(fill: gray(950), total.label)
  h(px(8))
  text(weight: "semibold", fill: gray(950), total.value)
}))

#block(
  width: 100%,
  below: px(8),
  inset: (bottom: px(4)),
  stroke: (bottom: px(1) + gray(300)),
  grid(
    columns: (1fr, auto),
    align: (left + top, right + top),
    text(size: text-size.base, weight: "semibold", fill: gray(950), c.title),
    stack(
      spacing: px(2),
      text(weight: "semibold", fill: gray(950), c.date),
      text(fill: gray(600), c.resource),
    ),
  ),
)

#grid(
  columns: (1fr, auto),
  column-gutter: px(12),
  detail-rows(c.patient_rows, label-width: px(80)),
  grid(
    columns: (auto, auto),
    column-gutter: px(12),
    align: top,
    if c.token != none {
      align(right, stack(
        spacing: px(2),
        text(fill: gray(600), c.token.label),
        text(size: text-size.xl, weight: "bold", fill: gray(950), c.token.value),
      ))
    },
    if c.qr_code != none { image(c.qr_code, width: px(80)) },
  ),
)

#if c.tags != none {
  v(px(6))
  labelled(c.tags.label, c.tags.value)
}

#if c.charges != none {
  v(px(8))
  section-title(c.charges.title)
  data-table(
    columns: (auto, 1fr, auto, auto),
    align: (center, left, center, center),
    header-align: (center, left, center, center),
    header: c.charges.header,
    rows: c.charges.rows.map(row => (
      row.index,
      with-subtext(row.title, row.subtitle),
      row.amount,
      row.status,
    )),
  )
  total-line(c.charges.total)
}

#if c.payments != none {
  v(px(8))
  dashed-rule()
  section-title(c.payments.title)
  data-table(
    columns: (auto, 1fr, 1fr, auto),
    align: (center, left, left, right),
    header-align: (center, left, left, right),
    header: c.payments.header,
    rows: c.payments.rows.map(row => (
      row.index,
      with-subtext(row.invoice, row.invoice_time),
      with-subtext(row.method, row.reference),
      row.amount,
    )),
  )
  total-line(c.payments.total)
}

#if c.note != none {
  v(px(8))
  block(
    width: 100%,
    inset: (bottom: px(2)),
    stroke: (bottom: px(1) + gray(200)),
    text(weight: "semibold", fill: gray(700), c.note.label),
  )
  block(width: 100%, fill: soft-background, inset: px(6), radius: px(4), c.note.text)
}

#print-meta(left: c.footer.left, right: c.footer.right)
