#import "../typst/care.typ": *
#import "../typst/invoice.typ": *

#let data = json(sys.inputs.at("data"))
#let invoice = data.content

#show: document.with(
  data.layout,
  running-header: patient-running-header(invoice.patient, invoice.labels.patient),
)

#invoice-body(invoice)
