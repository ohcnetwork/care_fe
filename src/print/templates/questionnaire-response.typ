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

#if c.title != none {
  block(
    width: 100%,
    below: px(16),
    inset: (bottom: px(8)),
    stroke: (bottom: px(1) + border-color),
    {
      text(size: text-size.lg, weight: "semibold", c.title)
      if c.description != none and c.description != "" {
        linebreak()
        text(fill: gray(500), c.description)
      }
    },
  )
}

#for (i, response) in c.responses.enumerate() {
  if i > 0 { v(px(8)); dashed-rule(); v(px(8)) }
  block(below: px(12), {
    text(response.created)
    linebreak()
    text(response.date)
  })
  pad(left: px(16), for block-item in response.blocks {
    if block-item.type == "heading" {
      block(above: px(14), below: px(6), width: 100%, breakable: false, {
        text(size: text-size.lg, weight: "semibold", fill: black, block-item.text)
        if block-item.rule { v(px(4)); line(length: 100%, stroke: px(1) + gray(200)) }
      })
    } else {
      block(above: px(8), width: 100%, {
        text(size: text-size.base, weight: "medium", block-item.text)
        for answer in block-item.answers {
          linebreak()
          text(fill: gray(700), answer)
        }
      })
    }
  })
}
