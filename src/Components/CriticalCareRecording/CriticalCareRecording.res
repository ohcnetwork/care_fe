@react.component
export make = (~id, ~facilityId, ~patientId, ~consultationId, ~preview) => {
  <div> <CriticalCare__Root id facilityId patientId consultationId preview /> </div>
}
