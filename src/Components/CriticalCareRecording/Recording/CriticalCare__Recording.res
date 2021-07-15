let str = React.string

open CriticalCare__Types

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
  nursingCare: NursingCare.t,
  ventilatorParametersEditor: CriticalCare__VentilatorParameters.t,
  neurologicalMonitoringStatus: string,
  hemodynamicParametersStatus: string,
  ventilatorParametersStatus: string,
  arterialBloodGasAnalysisStatus: string,
  bloodSugarStatus: string,
  ioBalanceStatus: string,
  dialysisStatus: string,
  pressureSoreStatus: string,
  nursingCareStatus: string,
  totalStatus: int,
  bloodSugarEditor: BloodSugar.t,
}

type action =
  | ShowEditor(editor)
  | CloseEditor
  | SetNursingCare(NursingCare.t)
  | SetVentilatorParametersEditor(CriticalCare__VentilatorParameters.t)
  | UpdateNursingCareStatus(string)
  | UpdateVentilatorParametersStatus(string)
  | UpdateHemodynamicParameterStatus(string)
  | UpdateABGAnalysisStatus(string)
  | UpdateTotal(int)
  | SetBloodSugarEditor(BloodSugar.t)
  | UpdateBloodSugarStatus(string)
  | UpdateDialysisStatus(string)
  | UpdateNeurologicalMonitoringStatus(string)
  | SetIOBalaceStatus(IOBalance.t)
  | UpdateDailyRound(CriticalCare__DailyRound.t)

let showEditor = (editor, send) => {
  send(ShowEditor(editor))
}

let showStatus = item => {
  str("Completed " ++ item ++ "%")
}

let editorToggle = (editorName, state, send) => {
  <div
    id="editorToggle"
    className="border-2 px-4 py-6 mx-auto my-4 cursor-pointer flex justify-between items-center"
    onClick={_ => showEditor(editorName, send)}>
    {switch editorName {
    | NeurologicalMonitoringEditor => str("Neurological Monitoring")
    | HemodynamicParametersEditor => str("Hemodynamic Parameters")
    | VentilatorParametersEditor => str("Ventilator Parameters")
    | ArterialBloodGasAnalysisEditor => str("Arterial Blood Gas Analysis")
    | BloodSugarEditor => str("Blood Sugar")
    | IOBalanceEditor => str("I/O Balance")
    | DialysisEditor => str("Dialysis")
    | PressureSoreEditor => str("Pressure Sore")
    | NursingCareEditor => str("Nursing Care")
    }}
    <div>
      {switch editorName {
      | NeurologicalMonitoringEditor => showStatus(state.neurologicalMonitoringStatus)
      | HemodynamicParametersEditor => showStatus(state.hemodynamicParametersStatus)
      | VentilatorParametersEditor => showStatus(state.ventilatorParametersStatus)
      | ArterialBloodGasAnalysisEditor => showStatus(state.arterialBloodGasAnalysisStatus)
      | BloodSugarEditor => showStatus(state.bloodSugarStatus)
      | IOBalanceEditor => showStatus(state.ioBalanceStatus)
      | DialysisEditor => showStatus(state.dialysisStatus)
      | PressureSoreEditor => showStatus(state.pressureSoreStatus)
      | NursingCareEditor => showStatus(state.nursingCareStatus)
      }}
    </div>
  </div>
}

let reducer = (state, action) => {
  switch action {
  | ShowEditor(editor) => {...state, visibleEditor: Some(editor)}
  | CloseEditor => {...state, visibleEditor: None}
  | SetNursingCare(nursingCare) => {...state, nursingCare: nursingCare}
  | SetVentilatorParametersEditor(editor) => {...state, ventilatorParametersEditor: editor}
  | UpdateNursingCareStatus(nursingCareStatus) => {
      ...state,
      nursingCareStatus: nursingCareStatus,
    }
  | UpdateVentilatorParametersStatus(status) => {
      ...state,
      ventilatorParametersStatus: status,
    }
  | UpdateHemodynamicParameterStatus(hemodynamicParametersStatus) => {
      ...state,
      hemodynamicParametersStatus: hemodynamicParametersStatus,
    }
  | UpdateTotal(total) => {...state, totalStatus: total}
  | SetBloodSugarEditor(editor) => {...state, bloodSugarEditor: editor}
  | UpdateBloodSugarStatus(bloodSugarStatus) => {...state, bloodSugarStatus: bloodSugarStatus}
  | UpdateDialysisStatus(dialysisStatus) => {...state, dialysisStatus: dialysisStatus}
  | UpdateNeurologicalMonitoringStatus(neurologicalMonitoringStatus) => {
      ...state,
      neurologicalMonitoringStatus: neurologicalMonitoringStatus,
    }
  | SetIOBalaceStatus(iobState) => {...state, ioBalanceStatus: "100"}
  | UpdateABGAnalysisStatus(arterialBloodGasAnalysisStatus) => {
      ...state,
      arterialBloodGasAnalysisStatus: arterialBloodGasAnalysisStatus,
    }
  | UpdateDailyRound(dailyRound) => {...state, dailyRound: dailyRound, visibleEditor: None}
  }
}

let initialState = dailyRound => {
  visibleEditor: None,
  dailyRound: dailyRound,
  nursingCare: {
    personalHygiene: None,
    positioning: None,
    suctioning: None,
    rylesTubeCare: None,
    iVSitecare: None,
    nubulisation: None,
    dressing: None,
    dVTPumpStocking: None,
    restrain: None,
    chestTubeCare: None,
    tracheostomyCare: None,
    stomaCare: None,
  },
  ventilatorParametersEditor: {
    ventilationInterface: "iv",
    iv: {
      ventilatorMode: "",
      ventilatorModeSubOption: {
        cmv: "",
        simv: "",
        psv: "",
      },
      peep: "",
      peakInspiratoryPressure: "",
      meanAirwayPressure: "",
      respiratoryRateVentilator: "",
      tidalVolume: "",
      fio2: "",
      spo2: "",
    },
    niv: {
      ventilatorMode: "",
      ventilatorModeSubOption: {
        cmv: "",
        simv: "",
        psv: "",
      },
      peep: "",
      peakInspiratoryPressure: "",
      meanAirwayPressure: "",
      respiratoryRateVentilator: "",
      tidalVolume: "",
      fio2: "",
      spo2: "",
    },
    none: {
      nasalProngs: Some(""),
      simpleFaceMask: Some(""),
      nonRebreathingMask: false,
      highFlowNasalCannula: false,
      fio2: "",
      spo2: "",
    },
  },
  neurologicalMonitoringStatus: "0",
  hemodynamicParametersStatus: "0",
  ventilatorParametersStatus: "0",
  arterialBloodGasAnalysisStatus: "0",
  bloodSugarStatus: "0",
  ioBalanceStatus: "0",
  dialysisStatus: "0",
  pressureSoreStatus: "0",
  nursingCareStatus: "0",
  totalStatus: 0,
  bloodSugarEditor: {
    blood_sugar_level: "",
    dosage: "",
    frequency: "OD",
  },
}

let editorButtons = (state, send) => {
  <div> {Js.Array.map(editor => {
      editorToggle(editor, state, send)
    }, [
      NeurologicalMonitoringEditor,
      HemodynamicParametersEditor,
      VentilatorParametersEditor,
      ArterialBloodGasAnalysisEditor,
      BloodSugarEditor,
      IOBalanceEditor,
      DialysisEditor,
      PressureSoreEditor,
      NursingCareEditor,
    ])->React.array} </div>
}

let updateDailyRound = (send, dailyRound) => {
  send(UpdateDailyRound(dailyRound))
}

@react.component
export make = (~id, ~facilityId, ~patientId, ~consultationId, ~dailyRound) => {
  let (state, send) = React.useReducer(reducer, initialState(dailyRound))

  <div
    className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6 max-w-3xl mx-auto border mt-4 shadow rounded-lg">
    <div className="p-4">
      {switch state.visibleEditor {
      | Some(editor) =>
        <div id="editor">
          <button id="closeEditor" onClick={_ => send(CloseEditor)}> {str("Back")} </button>
          {switch editor {
          | NeurologicalMonitoringEditor =>
            <CriticalCare__NeurologicalMonitoringEditor
              neurologicalMonitoring={CriticalCare__DailyRound.neurologicalMonitoring(
                state.dailyRound,
              )}
              updateCB={updateDailyRound(send)}
              id
              consultationId
            />
          | HemodynamicParametersEditor =>
            <CriticalCare__HemodynamicParametersEditor
              hemodynamicParameter={CriticalCare__DailyRound.hemodynamicParameters(
                state.dailyRound,
              )}
              updateCB={updateDailyRound(send)}
              id
              consultationId
            />
          | VentilatorParametersEditor =>
            <CriticalCare__VentilatorParametersEditor
              initialState={state.ventilatorParametersEditor}
              handleDone={(data, status) => {
                send(SetVentilatorParametersEditor(data))
                send(UpdateVentilatorParametersStatus(status))
                send(CloseEditor)
              }}
            />
          | ArterialBloodGasAnalysisEditor =>
            <CriticalCare__ABGAnalysisEditor
              arterialBloodGasAnalysis={CriticalCare__DailyRound.arterialBloodGasAnalysis(
                state.dailyRound,
              )}
              updateCB={updateDailyRound(send)}
              percentCompleteCB={status => {
                send(UpdateABGAnalysisStatus(status))
                if status == "100" {
                  send(UpdateTotal(state.totalStatus + 1))
                }
              }}
              id
              consultationId
            />
          | BloodSugarEditor =>
            <CriticalCare_BloodSugarEditor
              initialState={state.bloodSugarEditor}
              handleDone={data => {
                send(CloseEditor)
                send(SetBloodSugarEditor(data))
                let status = BloodSugar.showStatus(data)
                send(UpdateBloodSugarStatus(status))
                if status == "100" {
                  send(UpdateTotal(state.totalStatus + 1))
                }
              }}
            />
          | IOBalanceEditor =>
            <CriticalCare__IOBalanceEditor
              ioBalance={CriticalCare__DailyRound.ioBalance(state.dailyRound)}
              updateCB={updateDailyRound(send)}
              id
              consultationId
            />
          | DialysisEditor =>
            <CriticalCare_DialysisEditor
              dialysisParameters={CriticalCare__DailyRound.dialysis(state.dailyRound)}
              updateCB={updateDailyRound(send)}
              id
              consultationId
            />
          | PressureSoreEditor => <CriticalCare__PressureSore />
          | NursingCareEditor =>
            <CriticalCare__NursingCareEditor
              nursingCare={CriticalCare__DailyRound.nursingCare(state.dailyRound)}
              updateCB={updateDailyRound(send)}
              id
              consultationId
            />
          }}
        </div>
      | None => editorButtons(state, send)
      }}
    </div>
  </div>
}
