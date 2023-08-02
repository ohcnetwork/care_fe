@react.component
let make = (~painParameter, ~id, ~consultationId) => {
  let painParameter = CriticalCare__Pain.makeFromJsx(painParameter)
  <CriticalCare__PainEditor
    previewMode={true}
    painParameter={painParameter}
    updateCB={_ => ()}
    id={id}
    consultationId={consultationId}
  />
}
