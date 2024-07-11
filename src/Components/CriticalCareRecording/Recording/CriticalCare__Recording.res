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
      <CareIcon icon="l-user-nurse" className="text-xl mr-4 text-green-500" />
      <div className={`font-semibold text-xl text-green-500`}> {str("Basic Editor")} </div>
    </div>
    <div>
      <CareIcon icon="l-check-circle" className="text-3xl text-green-500" />
    </div>
  </Link>
}
let editorNameToString = editor => {
  switch editor {
  | NeurologicalMonitoringEditor => "Neurological Monitoring"
  | HemodynamicParametersEditor => "Vitals"
  | VentilatorParametersEditor => "Respiratory Support"
  | ArterialBloodGasAnalysisEditor => "Arterial Blood Gas Analysis"
  | BloodSugarEditor => "Blood Sugar"
  | IOBalanceEditor => "I/O Balance"
  | DialysisEditor => "Dialysis"
  | PressureSoreEditor => "Pressure Sore"
  | NursingCareEditor => "Nursing Care"
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
      <CareIcon
        icon="l-user-nurse"
        className={`text-xl mr-4 ${Belt.Option.isNone(editorUpdated)
            ? "text-secondary-400"
            : "text-green-500"}`}
      />
      <div
        className={`font-semibold text-xl  ${Belt.Option.isNone(editorUpdated)
            ? "text-secondary-800"
            : "text-green-500"}`}>
        {str(editorNameToString(editorName))}
      </div>
    </div>
    <div>
      {Belt.Option.isNone(editorUpdated)
        ? <CareIcon icon="l-check-circle" className="text-3xl text-secondary-300" />
        : <CareIcon icon="l-check-circle" className="text-3xl text-green-500" />}
    </div>
  </div>
}

let reducer = (state, action) => {
  switch action {
  | ShowEditor(editor) => {...state, visibleEditor: Some(editor)}
  | CloseEditor => {...state, visibleEditor: None}
  | UpdateDailyRound(dailyRound, editor) => {
      dailyRound,
      visibleEditor: None,
      updatedEditors: Js.Array.concat([editor], state.updatedEditors),
    }
  }
}

let initialState = dailyRound => {
  visibleEditor: None,
  dailyRound,
  updatedEditors: [],
}

let updateDailyRound = (send, editor, dailyRound) => {
  send(UpdateDailyRound(dailyRound, editor))
}

@genType @react.component
let make = (~id, ~facilityId, ~patientId, ~consultationId, ~dailyRound) => {
  let (state, send) = React.useReducer(reducer, initialState(dailyRound))

  let sections =
    dailyRound.roundsType == VentilatorRound
      ? [
          HemodynamicParametersEditor,
          NeurologicalMonitoringEditor,
          VentilatorParametersEditor,
          ArterialBloodGasAnalysisEditor,
          BloodSugarEditor,
          IOBalanceEditor,
          DialysisEditor,
          PressureSoreEditor,
          NursingCareEditor,
        ]
      : [NeurologicalMonitoringEditor, VentilatorParametersEditor]

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
            className="bg-white px-2 md:px-6 py-5 border-b border-secondary-200 sm:px-6 max-w-5xl mx-auto border mt-4 shadow rounded-lg">
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
                patientId
                facilityId
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
            }}
          </div>
        </div>
      | None =>
        <div
          className="bg-white px-2 md:px-6 py-5 border-b border-secondary-200 sm:px-6 max-w-5xl mx-auto border mt-4 shadow rounded-lg">
          <h2> {str("Record Updates")} </h2>
          <div>
            {basicEditor(~facilityId, ~patientId, ~consultationId, ~id)}
            {Js.Array.map(editor => {
              editorToggle(editor, state, send)
            }, sections)->React.array}
          </div>
          <Link
            href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`}>
            <button
              onClick={_ => Notifications.success({msg: "Detailed Update filed successfully"})}
              className="btn btn-primary w-full mt-6">
              {str("Complete")}
            </button>
          </Link>
        </div>
      }}
    </div>
  </div>
}
