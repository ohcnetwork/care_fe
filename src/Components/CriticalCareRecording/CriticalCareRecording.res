@react.component
let make = (~id, ~facilityId, ~patientId, ~consultationId, ~preview) => {
  <div> <CriticalCare__Root id facilityId patientId consultationId preview /> </div>
}
