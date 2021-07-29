@react.component
export make = (~pressureSoreParameter, ~id, ~consultationId) => {
  let pressureSoreParameter = CriticalCare__PressureSore.makeFromJsx(pressureSoreParameter)
  <CriticalCare__PressureSoreEditor
    previewMode={true} pressureSoreParameter updateCB={_ => ()} id consultationId
  />
}
