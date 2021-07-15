let str = React.string
open CriticalCare__Types

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

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
  saving: bool,
  dirty: bool,
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
  | SetSaving
  | ClearSaving

let reducer = (state, action) => {
  switch action {
  | SetPersonalHygiene(personalHygiene) => {...state, personalHygiene: personalHygiene, dirty: true}
  | SetPositioning(positioning) => {...state, positioning: positioning, dirty: true}
  | SetSuctioning(suctioning) => {...state, suctioning: suctioning, dirty: true}
  | SetRylesTubeCare(rylesTubeCare) => {...state, rylesTubeCare: rylesTubeCare, dirty: true}
  | SetIVSiteCare(iVSitecare) => {...state, iVSitecare: iVSitecare, dirty: true}
  | SetNubulisation(nubulisation) => {...state, nubulisation: nubulisation, dirty: true}
  | SetDressing(dressing) => {...state, dressing: dressing, dirty: true}
  | SetDVTPumpStocking(dVTPumpStocking) => {...state, dVTPumpStocking: dVTPumpStocking, dirty: true}
  | SetRestrain(restrain) => {...state, restrain: restrain, dirty: true}
  | SetChestTubeCare(chestTubeCare) => {...state, chestTubeCare: chestTubeCare, dirty: true}
  | SetTracheostomyCare(tracheostomyCare) => {
      ...state,
      tracheostomyCare: tracheostomyCare,
      dirty: true,
    }
  | SetStomaCare(stomaCare) => {...state, stomaCare: stomaCare, dirty: true}
  | SetSaving => {...state, saving: true}
  | ClearSaving => {...state, saving: false}
  }
}

let handleSubmit = (handleDone, state: stateType) => {
  let nursingState = NursingCare.make(
    ~personalHygiene=state.personalHygiene,
    ~positioning=state.positioning,
    ~suctioning=state.suctioning,
    ~rylesTubeCare=state.rylesTubeCare,
    ~iVSitecare=state.iVSitecare,
    ~nubulisation=state.nubulisation,
    ~dressing=state.dressing,
    ~dVTPumpStocking=state.dVTPumpStocking,
    ~restrain=state.restrain,
    ~chestTubeCare=state.chestTubeCare,
    ~tracheostomyCare=state.tracheostomyCare,
    ~stomaCare=state.stomaCare,
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

let makeField = (title, description) => {
  let payload = Js.Dict.empty()
  Js.Dict.set(payload, "procedure", Js.Json.string(title))
  Js.Dict.set(payload, "description", Js.Json.string(description))
  [payload]
}

let flattenV2 = a => a |> Js.Array.reduce((flat, next) => flat |> Js.Array.concat(next), [])

let makePayload = state => {
  let personalHygiene = switch state.personalHygiene {
  | Some(data) => makeField("personal_hygiene", data)
  | _ => []
  }
  let positioning = switch state.positioning {
  | Some(data) => makeField("positioning", data)
  | _ => []
  }
  let suctioning = switch state.suctioning {
  | Some(data) => makeField("suctioning", data)
  | _ => []
  }
  let rylesTubeCare = switch state.rylesTubeCare {
  | Some(data) => makeField("ryles_tube_care", data)
  | _ => []
  }
  let iVSitecare = switch state.iVSitecare {
  | Some(data) => makeField("i_v_sitecare", data)
  | _ => []
  }
  let nubulisation = switch state.nubulisation {
  | Some(data) => makeField("nubulisation", data)
  | _ => []
  }
  let dressing = switch state.dressing {
  | Some(data) => makeField("dressing", data)
  | _ => []
  }
  let dVTPumpStocking = switch state.dVTPumpStocking {
  | Some(data) => makeField("d_v_t_pump_stocking", data)
  | _ => []
  }
  let restrain = switch state.restrain {
  | Some(data) => makeField("restrain", data)
  | _ => []
  }
  let chestTubeCare = switch state.chestTubeCare {
  | Some(data) => makeField("chest_tube_care", data)
  | _ => []
  }
  let tracheostomyCare = switch state.tracheostomyCare {
  | Some(data) => makeField("tracheostomy_care", data)
  | _ => []
  }
  let stomaCare = switch state.stomaCare {
  | Some(data) => makeField("stoma_care", data)
  | _ => []
  }

  let payload = flattenV2([
    personalHygiene,
    positioning,
    suctioning,
    rylesTubeCare,
    iVSitecare,
    nubulisation,
    dressing,
    dVTPumpStocking,
    restrain,
    chestTubeCare,
    tracheostomyCare,
    stomaCare,
  ])
  let payload = Js.Dict.fromArray([("nursing", Js.Json.objectArray(payload))])
  payload
}

let successCB = (send, updateCB, data) => {
  send(ClearSaving)
  updateCB(CriticalCare__DailyRound.makeFromJs(data))
}

let errorCB = (send, _error) => {
  send(ClearSaving)
}

let saveData = (id, consultationId, state, send, updateCB) => {
  send(SetSaving)
  updateDailyRound(
    consultationId,
    id,
    Js.Json.object_(makePayload(state)),
    successCB(send, updateCB),
    errorCB(send),
  )
}

let initialState = nursing => {
  {
    personalHygiene: NursingCare.personalHygiene(nursing),
    positioning: NursingCare.positioning(nursing),
    suctioning: NursingCare.suctioning(nursing),
    rylesTubeCare: NursingCare.rylesTubeCare(nursing),
    iVSitecare: NursingCare.iVSitecare(nursing),
    nubulisation: NursingCare.nubulisation(nursing),
    dressing: NursingCare.dressing(nursing),
    dVTPumpStocking: NursingCare.dVTPumpStocking(nursing),
    restrain: NursingCare.restrain(nursing),
    chestTubeCare: NursingCare.chestTubeCare(nursing),
    tracheostomyCare: NursingCare.tracheostomyCare(nursing),
    stomaCare: NursingCare.stomaCare(nursing),
    saving: false,
    dirty: false,
  }
}

let getFieldValue = event => {
  ReactEvent.Form.target(event)["value"]
}

@react.component
let make = (~nursingCare, ~updateCB, ~id, ~consultationId) => {
  open MaterialUi
  let (state: stateType, send) = React.useReducer(reducer, initialState(nursingCare))

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
      disabled={state.saving || !state.dirty}
      className="flex w-full bg-green-600 text-white p-2 text-lg hover:bg-green-800 justify-center items-center rounded-md"
      onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
      {str("Done")}
    </button>
  </div>
}
