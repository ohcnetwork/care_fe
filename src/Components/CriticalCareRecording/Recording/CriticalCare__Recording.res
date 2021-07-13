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
  abgEditor: ABGAnalysis.t,
  ventilatorParametersEditor: CriticalCare__VentilatorParameters.t,
  neurologicalMonitoringStatus: string,
  hemodynamicParametersStatus: string,
  ventilatorParametersStatus: string,
  arterialBloodGasAnalysisStatus: string,
  bloodSugarStatus: string,
  ioBalanceData: IOBalance.t,
  ioBalanceStatus: string,
  dialysisStatus: string,
  pressureSoreStatus: string,
  nursingCareStatus: string,
  totalStatus: int,
  bloodSugarEditor: BloodSugar.t,
  dialysisEditor: Dialysis.t,
}

type action =
  | ShowEditor(editor)
  | CloseEditor
  | SetABGAnalysisEditor(ABGAnalysis.t)
  | SetNursingCare(NursingCare.t)
  | SetVentilatorParametersEditor(CriticalCare__VentilatorParameters.t)
  | UpdateNursingCareStatus(string)
  | UpdateVentilatorParametersStatus(string)
  | UpdateHemodynamicParameterStatus(string)
  | UpdateABGAnalysisStatus(string)
  | UpdateTotal(int)
  | SetBloodSugarEditor(BloodSugar.t)
  | UpdateBloodSugarStatus(string)
  | SetDialysisEditor(Dialysis.t)
  | UpdateDialysisStatus(string)
  | UpdateNeurologicalMonitoringStatus(string)
  | SetIOBalaceData(IOBalance.t)
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
    className="w-3/4 border-2 px-4 py-6 mx-auto my-4 cursor-pointer flex justify-between items-center"
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
  | SetABGAnalysisEditor(editor) => {...state, abgEditor: editor}
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
  | SetDialysisEditor(editor) => {...state, dialysisEditor: editor}
  | UpdateDialysisStatus(dialysisStatus) => {...state, dialysisStatus: dialysisStatus}
  | UpdateNeurologicalMonitoringStatus(neurologicalMonitoringStatus) => {
      ...state,
      neurologicalMonitoringStatus: neurologicalMonitoringStatus,
    }
  | SetIOBalaceData(data) => {...state, ioBalanceData: data}
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
  abgEditor: {
    po2: "",
    pco2: "",
    pH: "",
    hco3: "",
    baseExcess: "",
    lactate: "",
    sodium: "",
    potassium: "",
  },
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
  ioBalanceData: IOBalance.initialState,
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
  dialysisEditor: {
    fluid_balance: "",
    net_balance: "",
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

  // Js.log2(state, initialState)
  <div>
    <div className="w-3/4 mx-auto my-4" />
    <div className="w-3/4 mx-auto my-4">
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
              initialState={state.abgEditor}
              handleDone={(data, status) => {
                send(SetABGAnalysisEditor(data))
                send(UpdateABGAnalysisStatus(status))
                send(CloseEditor)
                if status === "100" {
                  send(UpdateTotal(state.totalStatus + 1))
                }
              }}
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
              initialState={state.ioBalanceData}
              handleDone={data => {
                CloseEditor->send
                data->SetIOBalaceStatus->send
                data->SetIOBalaceData->send
              }}
            />
          | DialysisEditor =>
            <CriticalCare_DialysisEditor
              initialState={state.dialysisEditor}
              handleDone={data => {
                send(CloseEditor)
                send(SetDialysisEditor(data))
                let status = Dialysis.showStatus(data)
                send(UpdateDialysisStatus(status))
                if status == "100" {
                  send(UpdateTotal(state.totalStatus + 1))
                }
              }}
            />
          | PressureSoreEditor => <CriticalCare__PressureSore />
          | NursingCareEditor =>
            <CriticalCare__NursingCareEditor
              initialState={state.nursingCare}
              handleDone={(data, status) => {
                send(SetNursingCare(data))
                send(UpdateNursingCareStatus(status))
                send(CloseEditor)
                if status === "100" {
                  send(UpdateTotal(state.totalStatus + 1))
                }
              }}
            />
          }}
        </div>
      | None => editorButtons(state, send)
      }}
    </div>
  </div>
}
