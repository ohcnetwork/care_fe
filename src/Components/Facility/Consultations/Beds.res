type reactClass
module Beds = {
  @module("./Beds.tsx") @react.component
  external make: (
    ~facilityId: string,
    ~patientId: string,
    ~consultationId: string,
    ~setState: unit => unit,
  ) => React.element = "default"
}

@react.component
let make = (
  ~facilityId: string,
  ~patientId: string,
  ~consultationId: string,
  ~setState: unit => unit,
) => <Beds facilityId patientId consultationId setState />
