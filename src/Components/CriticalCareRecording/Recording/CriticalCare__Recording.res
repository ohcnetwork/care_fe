let str = React.string

type editor =
  | NeurologicalMonitoringEditor
  | HemodynamicParametersEditor
  | VentilatorParametersEditor
  | ArterialBloodGasAnalysisEditor
  | BloodSugarEditor
  | IOBalanceEditor
  | DialysisEditor
  | PressureSoreEditor
  | NursingCareEditor
  | MedicineEditor
  | OthersEditor

type state = {
  visibleEditor: option<editor>,
  dailyRound: CriticalCare__DailyRound.t,
  updatedEditors: array<editor>,
}

type action =
  | ShowEditor(editor)
  | CloseEditor
  | UpdateDailyRound(CriticalCare__DailyRound.t, editor)

let showEditor = (editor, send) => {
  send(ShowEditor(editor))
}

let showStatus = item => {
  str("Completed " ++ item ++ "%")
}

let basicEditor = (~facilityId, ~patientId, ~consultationId, ~id) => {
  <Link
    className={`rounded-lg border px-4 py-2 mt-4 mx-auto cursor-pointer flex justify-between items-center bg-green-100 border-green-500`}
    href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${id}/update`}>
    <div className="flex items-center">
      <i className={"text-xl fas fa-user-nurse mr-4 text-green-500"} />
      <div className={`font-semibold text-xl text-green-500`}> {str("Basic Editor")} </div>
    </div>
    <div> <i className="text-3xl fas fa-check-circle text-green-500" /> </div>
  </Link>
}
let editorNameToString = editor => {
  switch editor {
  | NeurologicalMonitoringEditor => "Neurological Monitoring"
  | HemodynamicParametersEditor => "Hemodynamic Parameters (Vitals)"
  | VentilatorParametersEditor => "Ventilator Parameters"
  | ArterialBloodGasAnalysisEditor => "Arterial Blood Gas Analysis"
  | BloodSugarEditor => "Blood Sugar"
  | IOBalanceEditor => "I/O Balance"
  | DialysisEditor => "Dialysis"
  | PressureSoreEditor => "Pressure Sore"
  | NursingCareEditor => "Nursing Care"
  | MedicineEditor => "Medicine"
  | OthersEditor => "Others"
  }
}

let editorToggle = (editorName, state, send) => {
  let editorUpdated = Js.Array.find(f => f === editorName, state.updatedEditors)
  <div
    key={editorNameToString(editorName)}
    id="editorToggle"
    className={`rounded-lg border px-4 py-2 mt-4 mx-auto cursor-pointer flex justify-between items-center ${Belt.Option.isNone(
        editorUpdated,
      )
        ? ""
        : "bg-green-100 border-green-500"}`}
    onClick={_ => showEditor(editorName, send)}>
    <div className="flex items-center">
      <i
        className={`text-xl fas fa-user-nurse mr-4 ${Belt.Option.isNone(editorUpdated)
            ? "text-gray-400"
            : "text-green-500"}`}
      />
      <div
        className={`font-semibold text-xl  ${Belt.Option.isNone(editorUpdated)
            ? "text-gray-800"
            : "text-green-500"}`}>
        {str(editorNameToString(editorName))}
      </div>
    </div>
    <div>
      {Belt.Option.isNone(editorUpdated)
        ? <i className="text-3xl fas fa-check-circle text-gray-300" />
        : <i className="text-3xl fas fa-check-circle text-green-500" />}
    </div>
  </div>
}

let reducer = (state, action) => {
  switch action {
  | ShowEditor(editor) => {...state, visibleEditor: Some(editor)}
  | CloseEditor => {...state, visibleEditor: None}
  | UpdateDailyRound(dailyRound, editor) => {
      dailyRound: dailyRound,
      visibleEditor: None,
      updatedEditors: Js.Array.concat([editor], state.updatedEditors),
    }
  }
}

let initialState = dailyRound => {
  visibleEditor: None,
  dailyRound: dailyRound,
  updatedEditors: [],
}

let updateDailyRound = (send, editor, dailyRound) => {
  send(UpdateDailyRound(dailyRound, editor))
}

@react.component
export make = (~id, ~facilityId, ~patientId, ~consultationId, ~dailyRound) => {
  let (state, send) = React.useReducer(reducer, initialState(dailyRound))

  <div className=" px-4 py-5 sm:px-6 max-w-5xl mx-auto mt-4">
    {ReactUtils.nullUnless(
      <div>
        <Link
          className="btn btn-default bg-white"
          href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`}>
          {str("Go back to Consultation")}
        </Link>
      </div>,
      Belt.Option.isNone(state.visibleEditor),
    )}
    <div>
      {switch state.visibleEditor {
      | Some(editor) =>
        <div id="editor">
          <button
            className="btn btn-default bg-white" id="closeEditor" onClick={_ => send(CloseEditor)}>
            {str("Back")}
          </button>
          <div
            className="bg-white px-2 md:px-6 py-5 border-b border-gray-200 sm:px-6 max-w-5xl mx-auto border mt-4 shadow rounded-lg">
            {switch editor {
            | NeurologicalMonitoringEditor =>
              <CriticalCare__NeurologicalMonitoringEditor
                neurologicalMonitoring={CriticalCare__DailyRound.neurologicalMonitoring(
                  state.dailyRound,
                )}
                updateCB={updateDailyRound(send, NeurologicalMonitoringEditor)}
                id
                consultationId
              />
            | HemodynamicParametersEditor =>
              <CriticalCare__HemodynamicParametersEditor
                hemodynamicParameter={CriticalCare__DailyRound.hemodynamicParameters(
                  state.dailyRound,
                )}
                updateCB={updateDailyRound(send, HemodynamicParametersEditor)}
                id
                consultationId
              />
            | VentilatorParametersEditor =>
              // This need to updated
              <CriticalCare__VentilatorParametersEditor
                ventilatorParameters={CriticalCare__DailyRound.ventilatorParameters(
                  state.dailyRound,
                )}
                updateCB={updateDailyRound(send, VentilatorParametersEditor)}
                id
                consultationId
              />
            | ArterialBloodGasAnalysisEditor =>
              <CriticalCare__ABGAnalysisEditor
                arterialBloodGasAnalysis={CriticalCare__DailyRound.arterialBloodGasAnalysis(
                  state.dailyRound,
                )}
                updateCB={updateDailyRound(send, ArterialBloodGasAnalysisEditor)}
                id
                consultationId
              />
            | BloodSugarEditor =>
              <CriticalCare_BloodSugarEditor
                bloodsugarParameters={CriticalCare__DailyRound.bloodSugar(state.dailyRound)}
                updateCB={updateDailyRound(send, BloodSugarEditor)}
                id
                consultationId
              />
            | IOBalanceEditor =>
              <CriticalCare__IOBalanceEditor
                ioBalance={CriticalCare__DailyRound.ioBalance(state.dailyRound)}
                updateCB={updateDailyRound(send, IOBalanceEditor)}
                id
                consultationId
              />
            | DialysisEditor =>
              <CriticalCare_DialysisEditor
                dialysisParameters={CriticalCare__DailyRound.dialysis(state.dailyRound)}
                updateCB={updateDailyRound(send, DialysisEditor)}
                id
                consultationId
              />
            | PressureSoreEditor =>
              <CriticalCare__PressureSoreEditor
                pressureSoreParameter={CriticalCare__DailyRound.pressureSoreParameter(
                  state.dailyRound,
                )}
                updateCB={updateDailyRound(send, PressureSoreEditor)}
                id
                consultationId
                previewMode={false}
              />
            | NursingCareEditor =>
              <CriticalCare__NursingCareEditor
                nursingCare={CriticalCare__DailyRound.nursingCare(state.dailyRound)}
                updateCB={updateDailyRound(send, NursingCareEditor)}
                id
                consultationId
              />
            | MedicineEditor =>
              <CriticalCare__MedicineEditor
                medicines={CriticalCare__DailyRound.medicine(state.dailyRound)}
                updateCB={updateDailyRound(send, MedicineEditor)}
                id
                consultationId
              />
            | OthersEditor =>
              <CriticalCare__OthersEditor
                others={CriticalCare__DailyRound.others(state.dailyRound)}
                updateCB={updateDailyRound(send, OthersEditor)}
                id
                consultationId
              />
            }}
          </div>
        </div>
      | None =>
        <div
          className="bg-white px-2 md:px-6 py-5 border-b border-gray-200 sm:px-6 max-w-5xl mx-auto border mt-4 shadow rounded-lg">
          <h2> {str("Record Updates")} </h2>
          <div>
            {basicEditor(~facilityId, ~patientId, ~consultationId, ~id)} {Js.Array.map(editor => {
              editorToggle(editor, state, send)
            }, [
              HemodynamicParametersEditor,
              NeurologicalMonitoringEditor,
              VentilatorParametersEditor,
              ArterialBloodGasAnalysisEditor,
              BloodSugarEditor,
              IOBalanceEditor,
              DialysisEditor,
              PressureSoreEditor,
              NursingCareEditor,
              MedicineEditor,
              OthersEditor,
            ])->React.array}
          </div>
          <Link
            href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`}>
            <div className="btn btn-primary w-full mt-6"> {str("Complete")} </div>
          </Link>
        </div>
      }}
    </div>
  </div>
}
