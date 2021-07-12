@react.component
export make = (~id, ~facilityId, ~patientId, ~consultationId) => {
  <div> <CriticalCare__Root id facilityId patientId consultationId /> </div>
}
