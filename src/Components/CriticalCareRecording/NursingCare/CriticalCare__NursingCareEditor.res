let str = React.string
open CriticalCare__Types

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

type state = {
  procedures: array<NursingCare.item>,
  saving: bool,
  dirty: bool,
}

type action =
  | UpdateDescription(string, NursingCare.item)
  | DeleteProcedure(NursingCare.procedure)
  | AddProcedure(NursingCare.procedure)
  | SetSaving
  | ClearSaving

let reducer = (state, action) => {
  switch action {
  | UpdateDescription(field, item) => {
      ...state,
      procedures: Js.Array.map(
        f =>
          NursingCare.procedure(f) === NursingCare.procedure(item)
            ? NursingCare.updateDescription(field, item)
            : f,
        state.procedures,
      ),
      dirty: true,
    }
  | AddProcedure(procedure) => {
      ...state,
      procedures: Js.Array.concat([NursingCare.makeDefaultItem(procedure)], state.procedures),
      dirty: true,
    }
  | DeleteProcedure(procedure) => {
      ...state,
      procedures: Js.Array.filter(f => NursingCare.procedure(f) != procedure, state.procedures),
      dirty: true,
    }
  | SetSaving => {
      ...state,
      saving: true,
    }
  | ClearSaving => {
      ...state,
      saving: false,
    }
  }
}

let makeField = p => {
  let payload = Js.Dict.empty()
  Js.Dict.set(payload, "procedure", Js.Json.string(NursingCare.encodeProcedure(p)))
  Js.Dict.set(payload, "description", Js.Json.string(NursingCare.description(p)))
  payload
}

let flattenV2 = a => a |> Js.Array.reduce((flat, next) => flat |> Js.Array.concat(next), [])

let makePayload = state => {
  Js.Dict.fromArray([("nursing", Js.Json.objectArray(Js.Array.map(makeField, state.procedures)))])
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
    procedures: nursing,
    saving: false,
    dirty: false,
  }
}

let getFieldValue = event => {
  ReactEvent.Form.target(event)["value"]
}

let handleOnChange = (send, item, event) => {
  let value = ReactEvent.Form.target(event)["value"]
  send(UpdateDescription(value, item))
}

@react.component
let make = (~nursingCare, ~updateCB, ~id, ~consultationId) => {
  let (state, send) = React.useReducer(reducer, initialState(nursingCare))

  <div>
    <CriticalCare__PageTitle title="Nursing Care" />
    <div className="w-full"> {Js.Array.mapi((procedure, index) => {
        let selected = Js.Array.find(f => NursingCare.procedure(f) === procedure, state.procedures)
        <div className="mt-4" key={string_of_int(index)}>
          <Checkbox
            id={string_of_int(index)}
            label={NursingCare.procedureString(procedure)}
            checked={Belt.Option.isSome(selected)}
            onChange={_ =>
              send(
                Belt.Option.isSome(selected) ? DeleteProcedure(procedure) : AddProcedure(procedure),
              )}
          />
          {switch selected {
          | Some(s) =>
            <textarea
              id={"text-area" ++ string_of_int(index)}
              className="appearance-none mt-2 block w-full text-gray-800 border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white focus:border-primary-400"
              value={NursingCare.description(s)}
              onChange={handleOnChange(send, s)}
            />
          | None => React.null
          }}
        </div>
      }, [
        NursingCare.PersonalHygiene,
        Positioning,
        Suctioning,
        RylesTubeCare,
        IVSitecare,
        Nubulisation,
        Dressing,
        DVTPumpStocking,
        Restrain,
        ChestTubeCare,
        TracheostomyCare,
        StomaCare,
      ])->React.array} </div>
    <button
      disabled={state.saving || !state.dirty}
      className="btn btn-primary btn-large w-full"
      onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
      {str("Done")}
    </button>
  </div>
}
