type reactClass
module PrescriptionBuilder = {
  @module("./PrescriptionBuilder.tsx") @react.component
  external make: (
    ~prescriptions: array<Prescription__Prescription.t>,
    ~setPrescriptions: array<Prescription__Prescription.t> => unit,
  ) => React.element = "default"
}

@react.component
let make = (~prescriptions, ~setPrescriptions) =>
  <PrescriptionBuilder prescriptions setPrescriptions />
