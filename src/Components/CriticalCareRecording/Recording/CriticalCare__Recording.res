let str = React.string
@val external document: {..} = "document"
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
  nursingCare: NursingCare.t,
  abgEditor: ABGAnalysis.t,
  neurologicalMonitoring: NeurologicalMonitoring.t,
  hemodynamic_parameter_editor: CriticalCare__HemodynamicParameters.t,
  ventilatorParametersEditor: CriticalCare__VentilatorParameters.t,
  neurologicalMonitoringStatus: string,
  hemodynamicParametersStatus: string,
  ventilatorParametersStatus: string,
  arterialBloodGasAnalysisStatus: string,
  bloodSugarStatus: string,
  ioBalanceData: IOBalance.t,
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
  | SetNeurologicalMonitoringEditor(NeurologicalMonitoring.t)
  | SetHemodynamicParametersEditor(CriticalCare__HemodynamicParameters.t)
  | SetVentilatorParametersEditor(CriticalCare__VentilatorParameters.t)
  | UpdateNursingCareStatus(string)
  | UpdateVentilatorParametersStatus(string)
  | UpdateHemodynamicParameterStatus(string)
  | UpdateTotal(int)
  | SetBloodSugarEditor(BloodSugar.t)
  | UpdateBloodSugarStatus(string)
  | SetDialysisEditor(Dialysis.t)
  | UpdateDialysisStatus(string)
  | UpdateNeurologicalMonitoringStatus(string)
  | SetIOBalaceData(IOBalance.t)

let showEditor = (editor, send) => {
  send(ShowEditor(editor))
}

let showStatus = item => {
  str("Completed " ++ item ++ "%")
}

let editorToggle = (editorName, state, send) => {
  Js.log(state)
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
      | IOBalanceEditor => showStatus("100%")
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
  | SetNeurologicalMonitoringEditor(neurologicalMonitoring) => {
      ...state,
      neurologicalMonitoring: neurologicalMonitoring,
    }
  | SetHemodynamicParametersEditor(editor) => {...state, hemodynamic_parameter_editor: editor}
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
  }
}

let initialState = {
  visibleEditor: None,
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
    personalHygiene: "",
    positioning: "",
    suctioning: "",
    rylesTubeCare: "",
    iVSitecare: "",
    nubulisation: "",
    dressing: "",
    dVTPumpStocking: "",
    restrain: "",
    chestTubeCare: "",
    tracheostomyCare: "",
    stomaCare: "",
  },
  neurologicalMonitoring: {
    pronePosition: false,
    levelOfConciousness: "",
    leftPupilSize: "",
    leftSizeDescription: "",
    leftPupilReaction: "",
    leftReactionDescription: "",
    rightPupilSize: "",
    rightSizeDescription: "",
    rightPupilReaction: "",
    rightReactionDescription: "",
    eyeOpen: "",
    verbalResponse: "",
    motorResponse: "",
    totalGlascowScale: "",
    upperExtremityR: "",
    upperExtremityL: "",
    lowerExtremityR: "",
    lowerExtremityL: "",
  },
  hemodynamic_parameter_editor: {
    bp_systolic: "",
    bp_diastolic: "",
    pulse: "",
    temperature: "",
    respiratory_rate: "",
    rhythm: None,
    description: "",
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

@react.component
export make = () => {
  let (state, send) = React.useReducer(reducer, initialState)
  Js.log2(state, initialState)
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
              initialState={state.neurologicalMonitoring}
              handleDone={(data, status) => {
                send(SetNeurologicalMonitoringEditor(data))
                send(UpdateNeurologicalMonitoringStatus(status))
                send(CloseEditor)
                if status === "100" {
                  send(UpdateTotal(state.totalStatus + 1))
                }
              }}
            />
          | HemodynamicParametersEditor =>
            <CriticalCare__HemodynamicParametersEditor
              initialState={state.hemodynamic_parameter_editor}
              handleDone={(data, status) => {
                send(SetHemodynamicParametersEditor(data))
                send(UpdateHemodynamicParameterStatus(status))
                send(CloseEditor)
                if status === "100" {
                  send(UpdateTotal(state.totalStatus + 1))
                }
              }}
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
              handleDone={data => {
                send(SetABGAnalysisEditor(data))
                send(CloseEditor)
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
          | PressureSoreEditor
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
