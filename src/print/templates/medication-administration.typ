#import "../typst/care.typ": *

#let data = json(sys.inputs.at("data"))
#let c = data.content
#let l = c.labels
#let slots = c.slot_labels
#let per-day = slots.len()
#let heavy = px(2) + gray(400)
#let thin = px(1) + gray(400)

#show: document.with(
  data.layout,
  running-header: patient-running-header(c.patient, l.patient),
)

#let check = box(width: px(9), height: px(8), {
  let stroke = (paint: palette("green", 700), thickness: px(1.6), cap: "round")
  place(top + left, line(start: (px(0.5), px(4.5)), end: (px(3.5), px(7.5)), stroke: stroke))
  place(top + left, line(start: (px(3.5), px(7.5)), end: (px(8.5), px(0.5)), stroke: stroke))
})

#let count-cell(count) = {
  let content = if count == 0 {
    text(fill: gray(200), "·")
  } else if count <= 3 {
    stack(dir: ltr, spacing: px(2), ..range(count).map(_ => check))
  } else {
    stack(dir: ltr, spacing: px(2), check, text(size: px(9), weight: "semibold", fill: gray(700), "×" + str(count)))
  }
  table.cell(
    fill: if count > 0 { palette("green", 100) },
    inset: 0pt,
    box(width: 100%, height: px(28), align(center + horizon, content)),
  )
}

#let chart(week, prn) = block(stroke: thin, clip: true, {
  set text(size: px(10))
  set table.cell(breakable: false)
  let days = week.days
  table(
    columns: (px(150),) + (1fr,) * (days.len() * per-day),
    inset: px(3),
    align: left + horizon,
    fill: (x, y) => if y == 0 { gray(100) } else if y == 1 { gray(50) } else if prn { palette("pink", 50) },
    stroke: (x, y) => (
      left: if x == 0 { none } else if x == 1 or calc.rem(x - 1, per-day) == 0 { heavy } else { thin },
      top: if y == 0 { none } else { thin },
    ),
    table.header(
      table.cell(rowspan: 2, inset: px(6), text(weight: "bold", l.product)),
      ..days.map(day => table.cell(colspan: per-day, align: center + horizon, stack(
        spacing: px(1),
        text(weight: "bold", day.weekday),
        text(size: px(9), day.date),
      ))),
      ..days.map(_ => slots).flatten().map(slot => table.cell(align: center + horizon, text(size: px(9), slot))),
    ),
    ..week.rows.map(row => (
      table.cell(inset: px(6), align: left + top, {
        text(size: text-size.xs, weight: "bold", row.name)
        for summary in row.summaries {
          linebreak()
          text(size: px(9), fill: gray(600), summary)
        }
        if row.orders != none {
          linebreak()
          text(size: px(8), fill: gray(400), row.orders)
        }
      }),
      ..row.counts.map(count-cell),
    )).flatten(),
  )
})

#block(width: 100%, stroke: heavy, clip: true, below: px(16), {
  block(width: 100%, fill: gray(100), inset: px(12), stroke: (bottom: heavy), text(
    size: text-size.xl,
    weight: "bold",
    tracking: 0.025em,
    upper(c.title),
  ))
  grid(
    columns: (2fr, 1fr, 1fr),
    stroke: (x, y) => (left: if x > 0 { heavy }),
    inset: px(8),
    stack(spacing: px(2), text(size: text-size.xs, weight: "bold", fill: gray(500), upper(l.patient_name)), text(size: text-size.base, weight: "bold", c.info.patient_name)),
    stack(spacing: px(2), text(size: text-size.xs, weight: "bold", fill: gray(500), upper(l.age_sex)), text(weight: "semibold", c.info.age_sex)),
    stack(spacing: px(2), text(size: text-size.xs, weight: "bold", fill: gray(500), upper(l.encounter_date)), text(weight: "semibold", c.info.encounter_date)),
  )
})

#for (s, section) in c.sections.enumerate() {
  if s > 0 { pagebreak(weak: true) }
  for (r, week) in section.ranges.enumerate() {
    if r > 0 { pagebreak(weak: true) }
    if r == 0 {
      block(width: 100%, below: px(8), breakable: false, fill: if section.prn { palette("pink", 700) } else { gray(800) }, inset: (x: px(8), y: px(4)), text(
        size: text-size.sm,
        weight: "bold",
        fill: white,
        tracking: 0.025em,
        upper(section.title),
      ))
    }
    block(below: px(4), sticky: true, text(size: px(10), weight: "semibold", fill: gray(700), week.label))
    chart(week, section.prn)
    v(px(12))
  }
}

#print-meta(left: c.footer.left, right: c.footer.right)
