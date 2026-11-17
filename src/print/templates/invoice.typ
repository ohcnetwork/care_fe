// Invoice. Data: src/pages/Facility/billing/invoice/invoicePrintData.ts
// Preview in the editor (Tinymist) with the sample data next to this file.

#import "../typst/care.typ": *

#let data = json(sys.inputs.at("data", default: "invoice.sample.json"))
#let invoice = data.content
#let l = invoice.labels

#show: document.with(data.layout)

#let border = px(1) + gray(300)

// --- Title ---------------------------------------------------------------------

#grid(
  columns: (1fr, auto),
  align: (left + horizon, right + horizon),
  {
    set text(size: text-size.base)
    upper(l.invoice)
    h(px(8))
    text(weight: "semibold", fill: gray(950), invoice.number)
  },
  text(weight: "medium")[
    #text(fill: gray(700), l.issue_date + ":") #invoice.issue_date
  ],
)

#v(px(16))

// --- Bill to -------------------------------------------------------------------

#let patient = invoice.patient
#grid(
  columns: (1fr, auto),
  column-gutter: px(16),
  stack(
    spacing: px(4),
    text(weight: "medium", fill: gray(700), l.bill_to + ":"),
    text(size: text-size.base)[
      #text(weight: "semibold", patient.name)
      #h(px(4))
      #text(fill: gray(600), "(" + patient.gender_age + ")")
    ],
    ..patient.identifiers.map(id => text(size: text-size.base, fill: gray(700))[
      #id.label: #h(px(4)) #text(weight: "semibold", id.value)
    ]),
    text(weight: "medium", fill: gray(700))[
      #l.address:
      #if patient.address != none { patient.address } else {
        text(fill: gray(500), l.no_address_provided)
      }
    ],
  ),
  if invoice.qr_code != none { image(invoice.qr_code, width: px(100)) },
)

#v(px(16))

// --- Charge items --------------------------------------------------------------

#let taxes = invoice.tax_columns
#let has-payments = invoice.payments != none

#data-table(
  columns: (auto, 1fr, auto, auto, auto) + taxes.map(_ => auto) + (auto,),
  align: (center, left, right, center, right) + taxes.map(_ => right) + (right,),
  header-align: (center, left, center, center, center)
    + taxes.map(_ => center)
    + (center,),
  header: ("#", l.item, l.unit_price, l.qty, l.discount) + taxes + (l.total,),
  rows: invoice.items.map(item => (
    str(item.index),
    with-subtext(item.title, item.subtitle),
    item.unit_price,
    item.quantity,
    with-subtext(item.discount.total, ..item.discount.parts),
    ..item.taxes.map(tax => with-subtext(tax.total, tax.unit)),
    item.total,
  )),
  empty: l.no_charge_items,
  outer: (stroke: (top: border, x: border), radius: (top: px(2))),
)

// --- Totals ----------------------------------------------------------------------

#block(
  width: 100%,
  above: 0pt,
  breakable: false,
  inset: px(8),
  stroke: (x: border, bottom: if has-payments { none } else { border }),
  radius: if has-payments { 0pt } else { (bottom: px(6)) },
  {
    summary(
      invoice.totals.components
        + ((label: l.net_amount, value: invoice.totals.net, muted: true),),
    )
    dashed-rule()
    summary(((label: l.grand_total, value: invoice.totals.gross, strong: true),))
    dashed-rule()
  },
)

// --- Payments and credit notes -----------------------------------------------------

#let transactions-table(rows, outer) = data-table(
  columns: (auto, 1fr, auto, auto, auto),
  align: (center, left, left, left, right),
  header-align: (center, left, left, left, right),
  header: ("#", l.date_and_time, l.payment_method, l.reference, l.amount),
  rows: rows.map(row => (
    str(row.index),
    stack(
      spacing: px(2),
      text(weight: "medium", fill: gray(950), row.datetime),
      text(font: mono-fonts, size: text-size.xs, fill: gray(500), row.id),
    ),
    row.method,
    row.reference,
    row.amount,
  )),
  outer: outer,
)

#if has-payments {
  block(above: 0pt, transactions-table(
    invoice.payments.rows,
    (stroke: border, radius: (bottom: px(6))),
  ))
  dashed-rule()
  summary(((label: l.total_received, value: invoice.payments.total, strong: true),))
  dashed-rule()
}

#if invoice.credit_notes != none {
  v(px(16))
  block(
    width: 100%,
    stroke: border,
    radius: px(6),
    clip: true,
    inset: (top: px(8)),
    {
      pad(x: px(12), bottom: px(8), text(weight: "medium", l.credit_notes_title))
      transactions-table(
        invoice.credit_notes.rows,
        (stroke: none, radius: 0pt),
      )
    },
  )
  dashed-rule()
  summary(((label: l.total_credit_notes, value: invoice.credit_notes.total, strong: true),))
  dashed-rule()
}

// --- Payment terms and footer ------------------------------------------------------

#if invoice.payment_terms != none {
  block(
    above: px(24),
    width: 100%,
    inset: (top: px(16)),
    stroke: (top: px(1) + border-color),
    [
      #text(weight: "medium", fill: gray(950), l.payment_terms)
      #block(above: px(4), invoice.payment_terms)
    ],
  )
}

#print-meta(
  left: labelled(l.created_by, invoice.created_by),
  right: if invoice.location != none { labelled(l.location, invoice.location) },
)
