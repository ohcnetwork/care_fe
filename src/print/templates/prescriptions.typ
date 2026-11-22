#import "../typst/care.typ": *

#let data = json(sys.inputs.at("data"))
#let c = data.content
#let l = c.labels
#let border = px(1) + gray(300)

#show: document.with(
  data.layout,
  running-header: patient-running-header(c.patient, l.patient),
)

#let plain(body) = text(weight: "regular", body)

// A medication spans one row per instruction, plus one for a shared note.
#let medication-cells(med) = {
  let total = med.instructions.len() + if med.note != none { 1 } else { 0 }
  let spanned(body) = if total > 1 { table.cell(rowspan: total, body) } else { body }
  let cells = ()
  for (i, instruction) in med.instructions.enumerate() {
    if i == 0 {
      cells += (
        spanned(text(fill: gray(600), weight: "regular", med.index)),
        spanned(text(weight: "medium", med.name)),
      )
    }
    cells += (
      plain(instruction.dosage),
      plain(instruction.frequency),
      plain(instruction.duration),
      plain(instruction.text),
    )
  }
  if med.note != none { cells.push(table.cell(colspan: 4, plain(med.note))) }
  cells
}

#grid(
  columns: (1fr, auto),
  column-gutter: px(16),
  stack(
    spacing: px(12),
    grid(
      columns: (3fr, 2fr),
      column-gutter: px(16),
      detail-rows(c.details.left, label-width: px(112)),
      detail-rows(c.details.right, label-width: px(112)),
    ),
    if c.details.location != none {
      detail-rows((c.details.location,), label-width: px(112))
    },
  ),
  if c.qr_code != none { image(c.qr_code, width: px(85)) },
)

#v(px(8))

#if c.count_text != none {
  block(
    width: 100%,
    below: px(16),
    inset: (bottom: px(8)),
    stroke: (bottom: px(1) + gray(200)),
    text(fill: gray(500), c.count_text),
  )
}

#for (i, rx) in c.prescriptions.enumerate() {
  if i > 0 {
    v(px(24))
    dashed-rule()
    v(px(24))
  }

  block(below: px(6), grid(
    columns: (1fr, auto),
    align: horizon,
    {
      text(size: text-size.base, weight: "medium", fill: gray(950), rx.symbol)
      h(px(8))
      text(weight: "semibold", fill: gray(950), upper(rx.title))
      if rx.progress != none {
        h(px(8))
        text(weight: "medium", fill: gray(700), rx.progress)
      }
    },
    text(fill: gray(950), rx.date),
  ))

  block(width: 100%, stroke: border, radius: px(6), clip: true, {
    pad(x: px(16), y: px(12), {
      text(weight: "medium", fill: gray(700), l.prescribed_by + ": ")
      text(weight: "semibold", fill: gray(950), rx.prescribed_by)
      if rx.note != none {
        linebreak()
        text(size: text-size.xs, fill: gray(700), l.note + ": " + rx.note)
      }
    })
    if rx.medications.len() > 0 {
      data-table(
        columns: (auto, auto, auto, auto, auto, 1fr),
        align: (center, left, left, left, left, left),
        header-align: (center, left, left, left, left, left),
        header: c.table_header,
        rows: rx.medications.map(medication-cells),
        outer: (stroke: (top: border), radius: 0pt),
      )
    }
  })

  align(right, pad(top: px(80), bottom: px(8), text(
    weight: "medium",
    fill: gray(950),
    rx.prescribed_by,
  )))
}

#align(center, text(size: px(10), fill: gray(900), c.footer))
