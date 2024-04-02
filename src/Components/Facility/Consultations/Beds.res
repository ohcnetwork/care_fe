type reactClass
module Beds = {
  @module("./Beds.tsx") @react.component
  external make: (
    ~patientId: string,
    ~consultationId: string,
    ~setState: unit => unit,
  ) => React.element = "default"
}

@react.component
let make = (~patientId: string, ~consultationId: string, ~setState: unit => unit) =>
  <Beds patientId consultationId setState/>