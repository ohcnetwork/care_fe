#import "../typst/care.typ": *
#import "../typst/invoice.typ": *

#let data = json(sys.inputs.at("data"))
#let invoices = data.content.invoices
#let first = invoices.first()

#show: document.with(
  data.layout,
  running-header: patient-running-header(first.patient, first.labels.patient),
)

#invoice-bill-to(first)
#v(px(16))

#for (i, invoice) in invoices.enumerate() {
  if i > 0 { pagebreak() }
  invoice-body(invoice, bill-to: false)
}
