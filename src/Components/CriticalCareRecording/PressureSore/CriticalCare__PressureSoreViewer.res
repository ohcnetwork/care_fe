@react.component
export make = (~pressureSoreParameter, ~id, ~consultationId) => {
  let pressureSoreParameter = CriticalCare__PressureSore.makeFromJsx(pressureSoreParameter)
  <CriticalCare__PressureSoreEditor
    previewMode={true}
    pressureSoreParameter={pressureSoreParameter}
    updateCB={_ => ()}
    id={id}
    consultationId={consultationId}
  />
}
