let str = React.string
open CriticalCare__Types

let handleSubmit = (handleDone, state) => {
  handleDone(state)
}

type action =
  | SetPersonalHygiene(string)
  | SetPositioning(string)
  | SetSuctioning(string)
  | SetRylesTubeCare(string)
  | SetIVSiteCare(string)
  | SetNubulisation(string)
  | SetDressing(string)
  | SetDVTPumpStocking(string)
  | SetRestrain(string)
  | SetChestTubeCare(string)
  | SetTracheostomyCare(string)
  | SetStomaCare(string)

let reducer = (state, action) => {
  switch action {
  | SetPersonalHygiene(personalHygiene) => {...state, NursingCare.personalHygiene: personalHygiene}
  | SetPositioning(positioning) => {...state, positioning: positioning}
  | SetSuctioning(suctioning) => {...state, suctioning: suctioning}
  | SetRylesTubeCare(rylesTubeCare) => {...state, rylesTubeCare: rylesTubeCare}
  | SetIVSiteCare(iVSitecare) => {...state, iVSitecare: iVSitecare}
  | SetNubulisation(nubulisation) => {...state, nubulisation: nubulisation}
  | SetDressing(dressing) => {...state, dressing: dressing}
  | SetDVTPumpStocking(dVTPumpStocking) => {...state, dVTPumpStocking: dVTPumpStocking}
  | SetRestrain(restrain) => {...state, restrain: restrain}
  | SetChestTubeCare(chestTubeCare) => {...state, chestTubeCare: chestTubeCare}
  | SetTracheostomyCare(tracheostomyCare) => {...state, tracheostomyCare: tracheostomyCare}
  | SetStomaCare(stomaCare) => {...state, stomaCare: stomaCare}
  }
}

let getFieldValue = event => {
  ReactEvent.Form.target(event)["value"]
}

@react.component
let make = (~handleDone, ~initialState) => {
  open MaterialUi
  let (state, send) = React.useReducer(reducer, (initialState: NursingCare.t))
  <div>
    <CriticalCare__PageTitle title="Nursing Care" />
    <div className="my-4">
      <InputLabel htmlFor="personal-hygiene"> {str("Personal Hygiene")} </InputLabel>
      <TextField
        name="personal-hygiene"
        variant=#Outlined
        margin=#Dense
        _type="text"
        value={TextField.Value.string(state.personalHygiene)}
        onChange={event => send(SetPersonalHygiene(getFieldValue(event)))}
        className="w-full"
        id="personal-hygiene"
      />
    </div>
    <div className="my-4">
      <InputLabel htmlFor="positioning"> {str("Positioning")} </InputLabel>
      <TextField
        name="positioning"
        variant=#Outlined
        margin=#Dense
        _type="text"
        value={TextField.Value.string(state.positioning)}
        onChange={event => send(SetPositioning(getFieldValue(event)))}
        className="w-full"
        id="positioning"
      />
    </div>
    <div className="my-4">
      <InputLabel htmlFor="personal-hygiene"> {str("Suctioning")} </InputLabel>
      <TextField
        name="suctioning"
        variant=#Outlined
        margin=#Dense
        _type="text"
        value={TextField.Value.string(state.suctioning)}
        onChange={event => send(SetSuctioning(getFieldValue(event)))}
        className="w-full"
        id="suctioning"
      />
    </div>
    <div className="my-4">
      <InputLabel htmlFor="personal-hygiene"> {str("Ryles Tube Care")} </InputLabel>
      <TextField
        name="ryles-tube-care"
        variant=#Outlined
        margin=#Dense
        _type="text"
        value={TextField.Value.string(state.rylesTubeCare)}
        onChange={event => send(SetRylesTubeCare(getFieldValue(event)))}
        className="w-full"
        id="ryles-tube-care"
      />
    </div>
    <div className="my-4">
      <InputLabel htmlFor="personal-hygiene"> {str("IV Site care")} </InputLabel>
      <TextField
        name="iv-site-care"
        variant=#Outlined
        margin=#Dense
        _type="text"
        value={TextField.Value.string(state.iVSitecare)}
        onChange={event => send(SetIVSiteCare(getFieldValue(event)))}
        className="w-full"
        id="iv-site-care"
      />
    </div>
    <div className="my-4">
      <InputLabel htmlFor="personal-hygiene"> {str("Nubulisation")} </InputLabel>
      <TextField
        name="nubulisation"
        variant=#Outlined
        margin=#Dense
        _type="text"
        value={TextField.Value.string(state.nubulisation)}
        onChange={event => send(SetNubulisation(getFieldValue(event)))}
        className="w-full"
        id="nubulisation"
      />
    </div>
    <div className="my-4">
      <InputLabel htmlFor="personal-hygiene"> {str("Dressing")} </InputLabel>
      <TextField
        name="dressing"
        variant=#Outlined
        margin=#Dense
        _type="text"
        value={TextField.Value.string(state.dressing)}
        onChange={event => send(SetDressing(getFieldValue(event)))}
        className="w-full"
        id="dressing"
      />
    </div>
    <div className="my-4">
      <InputLabel htmlFor="personal-hygiene"> {str("DVT Pump Stocking")} </InputLabel>
      <TextField
        name="dvt-pump-stocking"
        variant=#Outlined
        margin=#Dense
        _type="text"
        value={TextField.Value.string(state.dVTPumpStocking)}
        onChange={event => send(SetDVTPumpStocking(getFieldValue(event)))}
        className="w-full"
        id="dvt-pump-stocking"
      />
    </div>
    <div className="my-4">
      <InputLabel htmlFor="personal-hygiene"> {str("Restrain")} </InputLabel>
      <TextField
        name="restrain"
        variant=#Outlined
        margin=#Dense
        _type="text"
        value={TextField.Value.string(state.restrain)}
        onChange={event => send(SetRestrain(getFieldValue(event)))}
        className="w-full"
        id="restrain"
      />
    </div>
    <div className="my-4">
      <InputLabel htmlFor="chest-tube-care"> {str("Chest Tube Care")} </InputLabel>
      <TextField
        name="chest-tube-care"
        variant=#Outlined
        margin=#Dense
        _type="text"
        value={TextField.Value.string(state.chestTubeCare)}
        onChange={event => send(SetChestTubeCare(getFieldValue(event)))}
        className="w-full"
        id="chest-tube-care"
      />
    </div>
    <div className="my-4">
      <InputLabel htmlFor="personal-hygiene"> {str("Tracheostomy Care")} </InputLabel>
      <TextField
        name="tracheostomy-care"
        variant=#Outlined
        margin=#Dense
        _type="text"
        value={TextField.Value.string(state.tracheostomyCare)}
        onChange={event => send(SetTracheostomyCare(getFieldValue(event)))}
        className="w-full"
        id="tracheostomy-care"
      />
    </div>
    <div className="my-4">
      <InputLabel htmlFor="stoma-care"> {str("Stoma Care")} </InputLabel>
      <TextField
        name="stoma-care"
        variant=#Outlined
        margin=#Dense
        _type="text"
        value={TextField.Value.string(state.stomaCare)}
        onChange={event => send(SetStomaCare(getFieldValue(event)))}
        className="w-full"
        id="stoma-care"
      />
    </div>
    <button
      className="flex w-full bg-blue-600 text-white p-2 text-lg hover:bg-blue-800 justify-center items-center rounded-md"
      onClick={_ => handleSubmit(handleDone, state)}>
      {str("Done")}
    </button>
  </div>
}
