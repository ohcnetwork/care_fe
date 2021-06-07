let select = (setPrescription, prescription) => setPrescription(_ => prescription)

@react.component
export make = (~prescriptions, ~setPrescriptions) =>
  <div> <Prescription__Builder prescriptions selectCB={select(setPrescriptions)} /> </div>
