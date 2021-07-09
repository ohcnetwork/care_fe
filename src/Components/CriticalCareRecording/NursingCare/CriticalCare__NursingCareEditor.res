let str = React.string
open CriticalCare__Types

type stateType = {
  personalHygiene: option<string>,
  positioning: option<string>,
  suctioning: option<string>,
  rylesTubeCare: option<string>,
  iVSitecare: option<string>,
  nubulisation: option<string>,
  dressing: option<string>,
  dVTPumpStocking: option<string>,
  restrain: option<string>,
  chestTubeCare: option<string>,
  tracheostomyCare: option<string>,
  stomaCare: option<string>,
  done: bool,
}

type action =
  | SetPersonalHygiene(option<string>)
  | SetPositioning(option<string>)
  | SetSuctioning(option<string>)
  | SetRylesTubeCare(option<string>)
  | SetIVSiteCare(option<string>)
  | SetNubulisation(option<string>)
  | SetDressing(option<string>)
  | SetDVTPumpStocking(option<string>)
  | SetRestrain(option<string>)
  | SetChestTubeCare(option<string>)
  | SetTracheostomyCare(option<string>)
  | SetStomaCare(option<string>)
  | SetDone(bool)

let reducer = (state, action) => {
  switch action {
  | SetPersonalHygiene(personalHygiene) => {...state, personalHygiene: personalHygiene}
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
  | SetDone(isDone) => {...state, done: isDone}
  }
}

let handleSubmit = (handleDone, state: stateType) => {
  let nursingState = NursingCare.create(
    state.personalHygiene,
    state.positioning,
    state.suctioning,
    state.rylesTubeCare,
    state.iVSitecare,
    state.nubulisation,
    state.dressing,
    state.dVTPumpStocking,
    state.restrain,
    state.chestTubeCare,
    state.tracheostomyCare,
    state.stomaCare,
  )
  let status = NursingCare.showStatus(nursingState)
  handleDone(nursingState, status)
}

let isEmpty = field => {
  let empty = ref(false)
  switch field {
  | Some(data) =>
    if data === "" {
      empty := true
    }
  | None => ()
  }
  empty.contents
}

let allCompleted = state => {
  let isCompleted = if isEmpty(state.personalHygiene) {
    false
  } else if isEmpty(state.positioning) {
    false
  } else if isEmpty(state.suctioning) {
    false
  } else if isEmpty(state.rylesTubeCare) {
    false
  } else if isEmpty(state.iVSitecare) {
    false
  } else if isEmpty(state.nubulisation) {
    false
  } else if isEmpty(state.dressing) {
    false
  } else if isEmpty(state.dVTPumpStocking) {
    false
  } else if isEmpty(state.restrain) {
    false
  } else if isEmpty(state.chestTubeCare) {
    false
  } else if isEmpty(state.tracheostomyCare) {
    false
  } else if isEmpty(state.stomaCare) {
    false
  } else {
    true
  }
  isCompleted
}

let getFieldValue = event => {
  ReactEvent.Form.target(event)["value"]
}

@react.component
let make = (~handleDone, ~initialState: NursingCare.t) => {
  open MaterialUi
  let (state: stateType, send) = React.useReducer(
    reducer,
    {
      personalHygiene: NursingCare.personalHygiene(initialState),
      positioning: NursingCare.positioning(initialState),
      suctioning: NursingCare.suctioning(initialState),
      rylesTubeCare: NursingCare.rylesTubeCare(initialState),
      iVSitecare: NursingCare.iVSitecare(initialState),
      nubulisation: NursingCare.nubulisation(initialState),
      dressing: NursingCare.dressing(initialState),
      dVTPumpStocking: NursingCare.dVTPumpStocking(initialState),
      restrain: NursingCare.restrain(initialState),
      chestTubeCare: NursingCare.chestTubeCare(initialState),
      tracheostomyCare: NursingCare.tracheostomyCare(initialState),
      stomaCare: NursingCare.stomaCare(initialState),
      done: false,
    },
  )
  React.useEffect7(() => {
    if allCompleted(state) {
      send(SetDone(true))
    } else {
      send(SetDone(false))
    }
    None
  }, (
    state.personalHygiene,
    state.positioning,
    state.suctioning,
    state.rylesTubeCare,
    state.iVSitecare,
    state.nubulisation,
    state.dressing,
  ))

  React.useEffect5(() => {
    if allCompleted(state) {
      send(SetDone(true))
    } else {
      send(SetDone(false))
    }
    None
  }, (
    state.dVTPumpStocking,
    state.restrain,
    state.chestTubeCare,
    state.tracheostomyCare,
    state.stomaCare,
  ))

  <div>
    <CriticalCare__PageTitle title="Nursing Care" />
    <div className="w-11/12 m-auto">
      <div className="my-4 flex items-center flex-wrap relative">
        <InputLabel htmlFor="personal-hygiene"> {str("Personal Hygiene")} </InputLabel>
        {switch state.personalHygiene {
        | Some(data) =>
          <div className="flex flex-col w-full items-start">
            <Checkbox
              className="absolute top-0 right-full"
              checked={true}
              onChange={event => send(SetPersonalHygiene(None))}
            />
            <TextField
              name="personal-hygiene"
              variant=#Outlined
              margin=#Dense
              _type="text"
              value={TextField.Value.string(data)}
              onChange={event => {
                send(SetPersonalHygiene(getFieldValue(event)))
              }}
              className="w-full"
              id="personal-hygiene"
              multiline={true}
              rows={TextField.Rows.int(4)}
            />
            {isEmpty(state.personalHygiene)
              ? <p className="text-sm text-gray-500"> {str("You need to fill this up")} </p>
              : React.null}
          </div>
        | None =>
          <Checkbox
            className="absolute bottom-auto right-full"
            checked={false}
            onChange={event => send(SetPersonalHygiene(Some("")))}
          />
        }}
      </div>
      <div className="my-4 flex items-center flex-wrap relative">
        <InputLabel htmlFor="positioning"> {str("Positioning")} </InputLabel>
        {switch state.positioning {
        | Some(data) =>
          <div className="flex flex-col w-full items-start">
            <Checkbox
              className="absolute top-0 right-full"
              checked={true}
              onChange={event => send(SetPositioning(None))}
            />
            <TextField
              name="positioning"
              variant=#Outlined
              margin=#Dense
              _type="text"
              value={TextField.Value.string(data)}
              onChange={event => send(SetPositioning(getFieldValue(event)))}
              className="w-full"
              id="positioning"
              multiline={true}
              rows={TextField.Rows.int(4)}
            />
            {isEmpty(state.positioning)
              ? <p className="text-sm text-gray-500"> {str("You need to fill this up")} </p>
              : React.null}
          </div>
        | None =>
          <Checkbox
            className="absolute bottom-auto right-full"
            checked={false}
            onChange={event => send(SetPositioning(Some("")))}
          />
        }}
      </div>
      <div className="my-4 flex items-center flex-wrap relative">
        <InputLabel htmlFor="suctioning"> {str("Suctioning")} </InputLabel>
        {switch state.suctioning {
        | Some(data) =>
          <div className="flex flex-col w-full items-start">
            <Checkbox
              className="absolute top-0 right-full"
              checked={true}
              onChange={event => send(SetSuctioning(None))}
            />
            <TextField
              name="suctioning"
              variant=#Outlined
              margin=#Dense
              _type="text"
              value={TextField.Value.string(data)}
              onChange={event => send(SetSuctioning(getFieldValue(event)))}
              className="w-full"
              id="suctioning"
              multiline={true}
              rows={TextField.Rows.int(4)}
            />
            {isEmpty(state.suctioning)
              ? <p className="text-sm text-gray-500"> {str("You need to fill this up")} </p>
              : React.null}
          </div>
        | None =>
          <Checkbox
            className="absolute bottom-auto right-full"
            checked={false}
            onChange={event => send(SetSuctioning(Some("")))}
          />
        }}
      </div>
      <div className="my-4 flex items-center flex-wrap relative">
        <InputLabel htmlFor="rylesTubeCare"> {str("Ryles Tube Care")} </InputLabel>
        {switch state.rylesTubeCare {
        | Some(data) =>
          <div className="flex flex-col w-full items-start">
            <Checkbox
              className="absolute top-0 right-full"
              checked={true}
              onChange={event => send(SetRylesTubeCare(None))}
            />
            <TextField
              name="rylesTubeCare"
              variant=#Outlined
              margin=#Dense
              _type="text"
              value={TextField.Value.string(data)}
              onChange={event => send(SetRylesTubeCare(getFieldValue(event)))}
              className="w-full"
              id="rylesTubeCare"
              multiline={true}
              rows={TextField.Rows.int(4)}
            />
            {isEmpty(state.rylesTubeCare)
              ? <p className="text-sm text-gray-500"> {str("You need to fill this up")} </p>
              : React.null}
          </div>
        | None =>
          <Checkbox
            className="absolute bottom-auto right-full"
            checked={false}
            onChange={event => send(SetRylesTubeCare(Some("")))}
          />
        }}
      </div>
      <div className="my-4 flex items-center flex-wrap relative">
        <InputLabel htmlFor="iVSitecare"> {str("IV Site care")} </InputLabel>
        {switch state.iVSitecare {
        | Some(data) =>
          <div className="flex flex-col w-full items-start">
            <Checkbox
              className="absolute top-0 right-full"
              checked={true}
              onChange={event => send(SetIVSiteCare(None))}
            />
            <TextField
              name="iVSitecare"
              variant=#Outlined
              margin=#Dense
              _type="text"
              value={TextField.Value.string(data)}
              onChange={event => send(SetIVSiteCare(getFieldValue(event)))}
              className="w-full"
              id="iVSitecare"
              multiline={true}
              rows={TextField.Rows.int(4)}
            />
            {isEmpty(state.iVSitecare)
              ? <p className="text-sm text-gray-500"> {str("You need to fill this up")} </p>
              : React.null}
          </div>
        | None =>
          <Checkbox
            className="absolute bottom-auto right-full"
            checked={false}
            onChange={event => send(SetIVSiteCare(Some("")))}
          />
        }}
      </div>
      <div className="my-4 flex items-center flex-wrap relative">
        <InputLabel htmlFor="nubulisation"> {str("Nubulisation")} </InputLabel>
        {switch state.nubulisation {
        | Some(data) =>
          <div className="flex flex-col w-full items-start">
            <Checkbox
              className="absolute top-0 right-full"
              checked={true}
              onChange={event => send(SetNubulisation(None))}
            />
            <TextField
              name="nubulisation"
              variant=#Outlined
              margin=#Dense
              _type="text"
              value={TextField.Value.string(data)}
              onChange={event => send(SetNubulisation(getFieldValue(event)))}
              className="w-full"
              id="nubulisation"
              multiline={true}
              rows={TextField.Rows.int(4)}
            />
            {isEmpty(state.nubulisation)
              ? <p className="text-sm text-gray-500"> {str("You need to fill this up")} </p>
              : React.null}
          </div>
        | None =>
          <Checkbox
            className="absolute bottom-auto right-full"
            checked={false}
            onChange={event => send(SetNubulisation(Some("")))}
          />
        }}
      </div>
      <div className="my-4 flex items-center flex-wrap relative">
        <InputLabel htmlFor="dressing"> {str("Dressing")} </InputLabel>
        {switch state.dressing {
        | Some(data) =>
          <div className="flex flex-col w-full items-start">
            <Checkbox
              className="absolute top-0 right-full"
              checked={true}
              onChange={event => send(SetDressing(None))}
            />
            <TextField
              name="dressing"
              variant=#Outlined
              margin=#Dense
              _type="text"
              value={TextField.Value.string(data)}
              onChange={event => send(SetDressing(getFieldValue(event)))}
              className="w-full"
              id="dressing"
              multiline={true}
              rows={TextField.Rows.int(4)}
            />
            {isEmpty(state.dressing)
              ? <p className="text-sm text-gray-500"> {str("You need to fill this up")} </p>
              : React.null}
          </div>
        | None =>
          <Checkbox
            className="absolute bottom-auto right-full"
            checked={false}
            onChange={event => send(SetDressing(Some("")))}
          />
        }}
      </div>
      <div className="my-4 flex items-center flex-wrap relative">
        <InputLabel htmlFor="dVTPumpStocking"> {str("DVT Pump/Stocking")} </InputLabel>
        {switch state.dVTPumpStocking {
        | Some(data) =>
          <div className="flex flex-col w-full items-start">
            <Checkbox
              className="absolute top-0 right-full"
              checked={true}
              onChange={event => send(SetDVTPumpStocking(None))}
            />
            <TextField
              name="dVTPumpStocking"
              variant=#Outlined
              margin=#Dense
              _type="text"
              value={TextField.Value.string(data)}
              onChange={event => send(SetDVTPumpStocking(getFieldValue(event)))}
              className="w-full"
              id="dVTPumpStocking"
              multiline={true}
              rows={TextField.Rows.int(4)}
            />
            {isEmpty(state.dVTPumpStocking)
              ? <p className="text-sm text-gray-500"> {str("You need to fill this up")} </p>
              : React.null}
          </div>
        | None =>
          <Checkbox
            className="absolute bottom-auto right-full"
            checked={false}
            onChange={event => send(SetDVTPumpStocking(Some("")))}
          />
        }}
      </div>
      <div className="my-4 flex items-center flex-wrap relative">
        <InputLabel htmlFor="restrain"> {str("Restrain")} </InputLabel>
        {switch state.restrain {
        | Some(data) =>
          <div className="flex flex-col w-full items-start">
            <Checkbox
              className="absolute top-0 right-full"
              checked={true}
              onChange={event => send(SetRestrain(None))}
            />
            <TextField
              name="restrain"
              variant=#Outlined
              margin=#Dense
              _type="text"
              value={TextField.Value.string(data)}
              onChange={event => send(SetRestrain(getFieldValue(event)))}
              className="w-full"
              id="restrain"
              multiline={true}
              rows={TextField.Rows.int(4)}
            />
            {isEmpty(state.restrain)
              ? <p className="text-sm text-gray-500"> {str("You need to fill this up")} </p>
              : React.null}
          </div>
        | None =>
          <Checkbox
            className="absolute bottom-auto right-full"
            checked={false}
            onChange={event => send(SetRestrain(Some("")))}
          />
        }}
      </div>
      <div className="my-4 flex items-center flex-wrap relative">
        <InputLabel htmlFor="chestTubeCare"> {str("Chest Tube Care")} </InputLabel>
        {switch state.chestTubeCare {
        | Some(data) =>
          <div className="flex flex-col w-full items-start">
            <Checkbox
              className="absolute top-0 right-full"
              checked={true}
              onChange={event => send(SetChestTubeCare(None))}
            />
            <TextField
              name="chestTubeCare"
              variant=#Outlined
              margin=#Dense
              _type="text"
              value={TextField.Value.string(data)}
              onChange={event => send(SetChestTubeCare(getFieldValue(event)))}
              className="w-full"
              id="chestTubeCare"
              multiline={true}
              rows={TextField.Rows.int(4)}
            />
            {isEmpty(state.chestTubeCare)
              ? <p className="text-sm text-gray-500"> {str("You need to fill this up")} </p>
              : React.null}
          </div>
        | None =>
          <Checkbox
            className="absolute bottom-auto right-full"
            checked={false}
            onChange={event => send(SetChestTubeCare(Some("")))}
          />
        }}
      </div>
      <div className="my-4 flex items-center flex-wrap relative">
        <InputLabel htmlFor="tracheostomyCare"> {str("Tracheostomy Care")} </InputLabel>
        {switch state.tracheostomyCare {
        | Some(data) =>
          <div className="flex flex-col w-full items-start">
            <Checkbox
              className="absolute top-0 right-full"
              checked={true}
              onChange={event => send(SetTracheostomyCare(None))}
            />
            <TextField
              name="tracheostomyCare"
              variant=#Outlined
              margin=#Dense
              _type="text"
              value={TextField.Value.string(data)}
              onChange={event => send(SetTracheostomyCare(getFieldValue(event)))}
              className="w-full"
              id="tracheostomyCare"
              multiline={true}
              rows={TextField.Rows.int(4)}
            />
            {isEmpty(state.tracheostomyCare)
              ? <p className="text-sm text-gray-500"> {str("You need to fill this up")} </p>
              : React.null}
          </div>
        | None =>
          <Checkbox
            className="absolute bottom-auto right-full"
            checked={false}
            onChange={event => send(SetTracheostomyCare(Some("")))}
          />
        }}
      </div>
      <div className="my-4 flex items-center flex-wrap relative">
        <InputLabel htmlFor="stomaCare"> {str("Stoma Care")} </InputLabel>
        {switch state.stomaCare {
        | Some(data) =>
          <div className="flex flex-col w-full items-start">
            <Checkbox
              className="absolute top-0 right-full"
              checked={true}
              onChange={event => send(SetStomaCare(None))}
            />
            <TextField
              name="stomaCare"
              variant=#Outlined
              margin=#Dense
              _type="text"
              value={TextField.Value.string(data)}
              onChange={event => send(SetStomaCare(getFieldValue(event)))}
              className="w-full"
              id="stomaCare"
              multiline={true}
              rows={TextField.Rows.int(4)}
            />
            {isEmpty(state.stomaCare)
              ? <p className="text-sm text-gray-500"> {str("You need to fill this up")} </p>
              : React.null}
          </div>
        | None =>
          <Checkbox
            className="absolute bottom-auto right-full"
            checked={false}
            onChange={event => send(SetStomaCare(Some("")))}
          />
        }}
      </div>
    </div>
    <button
      disabled={!state.done}
      className="flex w-full bg-green-600 text-white p-2 text-lg hover:bg-green-800 justify-center items-center rounded-md"
      onClick={_ => handleSubmit(handleDone, state)}>
      {str("Done")}
    </button>
  </div>
}
