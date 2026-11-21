#import "../typst/care.typ": *

#let data = json(sys.inputs.at("data"))
#let c = data.content

#show: document.with(data.layout)

#align(center, {
  text(size: text-size.xxl, weight: "bold", c.title)
  parbreak()
  text(size: text-size.sm, fill: gray(600), c.reference)
})
#v(px(24))

#align(right, text(weight: "semibold", c.date))
#v(px(8))

#labelled(c.from.label, c.from.value)
#v(px(16))

#text(weight: "semibold", c.subject)
#v(px(16))

#set par(leading: 0.5em)
#c.intro

#pad(left: px(16), {
  for field in c.fields {
    labelled(field.label, field.value)
    linebreak()
  }
  v(px(8))
  labelled(c.reason.label, c.reason.value)
})

#labelled(c.status.label, c.status.value)

#v(px(48))
#grid(
  columns: (1fr,) * c.signatures.len(),
  column-gutter: px(24),
  ..c.signatures.map(signature => stack(
    spacing: px(2),
    text(weight: "semibold", signature.label),
    signature.name,
    text(size: text-size.sm, fill: gray(600), signature.date),
  )),
)
