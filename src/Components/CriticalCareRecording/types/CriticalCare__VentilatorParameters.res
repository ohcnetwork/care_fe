type parentventilatorModeType = CMV | SIMV | UNKNOWN

type ventilatorInterfaceType =
  | UNKNOWN
  | INVASIVE
  | NON_INVASIVE

type ventilatorModeType =
  | UNKNOWN
  | VCV
  | PCV
  | PRVC
  | APRV
  | VC_SIMV
  | PC_SIMV
  | PRVC_SIMV
  | ASV
  | PSV

type ventilatorOxygenModalityType =
  | UNKNOWN
  | NASAL_PRONGS
  | SIMPLE_FACE_MASK
  | NON_REBREATHING_MASK
  | HIGH_FLOW_NASAL_CANNULA

let encodeParentventilatorModeType = parentventilatorModeType => {
  switch parentventilatorModeType {
  | CMV => "CMV"
  | SIMV => "SIMV"
  | UNKNOWN => "UNKNOWN"
  }
}

let encodeVentilatorInterfaceType = ventilatorInterfaceType => {
  switch ventilatorInterfaceType {
  | INVASIVE => "INVASIVE"
  | NON_INVASIVE => "NON_INVASIVE"
  | UNKNOWN => "UNKNOWN"
  }
}
let encodeVentilatorModeType = ventilatorModeType => {
  switch ventilatorModeType {
  | VCV => "VCV"
  | PCV => "PCV"
  | PRVC => "PRVC"
  | APRV => "APRV"
  | VC_SIMV => "VC_SIMV"
  | PC_SIMV => "PC_SIMV"
  | PRVC_SIMV => "PRVC_SIMV"
  | ASV => "ASV"
  | PSV => "PSV"
  | _ => "UNKNOWN"
  }
}

let encodeVentilatorOxygenModalityType = ventilatorOxygenModalityType => {
  switch ventilatorOxygenModalityType {
  | NASAL_PRONGS => "NASAL_PRONGS"
  | SIMPLE_FACE_MASK => "SIMPLE_FACE_MASK"
  | NON_REBREATHING_MASK => "NON_REBREATHING_MASK"
  | HIGH_FLOW_NASAL_CANNULA => "HIGH_FLOW_NASAL_CANNULA"
  | _ => "UNKNOWN"
  }
}

let decodeParentventilatorModeType = parentventilatorModeType => {
  switch parentventilatorModeType {
  | "CMV" => CMV
  | "SIMV" => SIMV
  | "UNKNOWN" => UNKNOWN
  | _ => UNKNOWN
  }
}
let decodeVentilatorInterfaceType = ventilatorInterfaceType => {
  switch ventilatorInterfaceType {
  | "INVASIVE" => INVASIVE
  | "NON_INVASIVE" => NON_INVASIVE
  | "UNKNOWN" => UNKNOWN
  | _ => UNKNOWN
  }
}

let decodeVentilatorModeType = ventilatorModeType => {
  switch ventilatorModeType {
  | "VCV" => VCV
  | "PCV" => PCV
  | "PRVC" => PRVC
  | "APRV" => APRV
  | "VC_SIMV" => VC_SIMV
  | "PC_SIMV" => PC_SIMV
  | "PRVC_SIMV" => PRVC_SIMV
  | "ASV" => ASV
  | "PSV" => PSV
  | _ => UNKNOWN
  }
}

let decodeVetilatorOxygenModalityType = ventilatorOxygenModalityType => {
  switch ventilatorOxygenModalityType {
  | "NASAL_PRONGS" => NASAL_PRONGS
  | "SIMPLE_FACE_MASK" => SIMPLE_FACE_MASK
  | "NON_REBREATHING_MASK" => NON_REBREATHING_MASK
  | "HIGH_FLOW_NASAL_CANNULA" => HIGH_FLOW_NASAL_CANNULA
  | _ => UNKNOWN
  }
}

let ventilatorInterfaceTypeToString = ventilatorInterfaceType => {
  switch ventilatorInterfaceType {
  | INVASIVE => "Invasive"
  | NON_INVASIVE => "Non Invasive"
  | UNKNOWN => "Unknown"
  }
}

let ventilatorModeTypeToString = ventilatorModeType => {
  switch ventilatorModeType {
  | VCV => "VCV"
  | PCV => "PCV"
  | PRVC => "PRVC"
  | APRV => "APRV"
  | VC_SIMV => "VC SIMV"
  | PC_SIMV => "PC SIMV"
  | PRVC_SIMV => "PRVC SIMV"
  | ASV => "ASV"
  | PSV => "PSV"
  | _ => "Unknown"
  }
}

let ventilatorOxygenModalityTypeToString = ventilatorOxygenModalityType => {
  switch ventilatorOxygenModalityType {
  | NASAL_PRONGS => "Nasal Prongs"
  | SIMPLE_FACE_MASK => "Simple Face Mask"
  | NON_REBREATHING_MASK => "Non Rebreathing Mask"
  | HIGH_FLOW_NASAL_CANNULA => "High Flow Nasal Cannula"
  | _ => "Unknown"
  }
}

export type t = {
  ventilator_interface: ventilatorInterfaceType,
  ventilator_mode: ventilatorModeType,
  ventilator_oxygen_modality: ventilatorOxygenModalityType,
  ventilator_peep: option<float>,
  ventilator_pip: option<int>,
  ventilator_mean_airway_pressure: option<int>,
  ventilator_resp_rate: option<int>,
  ventilator_pressure_support: option<int>,
  ventilator_tidal_volume: option<int>,
  ventilator_oxygen_modality_oxygen_rate: option<int>,
  ventilator_oxygen_modality_flow_rate: option<int>,
  ventilator_fi02: option<int>,
  ventilator_spo2: option<int>,
}

let ventilatorInterface = t => t.ventilator_interface
let ventilatorMode = t => t.ventilator_mode
let oxygenModality = t => t.ventilator_oxygen_modality
let peep = t => t.ventilator_peep
let pip = t => t.ventilator_pip
let meanAirwayPressure = t => t.ventilator_mean_airway_pressure
let respiratoryRate = t => t.ventilator_resp_rate
let pressureSupport = t => t.ventilator_pressure_support
let tidalVolume = t => t.ventilator_tidal_volume
let oxygenModalityOxygenRate = t => t.ventilator_oxygen_modality_oxygen_rate
let oxygenModalityFlowRate = t => t.ventilator_oxygen_modality_flow_rate
let fio2 = t => t.ventilator_fi02
let spo2 = t => t.ventilator_spo2

let getParentVentilatorMode = ventilatorModeType => {
  switch ventilatorModeType {
  | VCV => CMV
  | PCV => CMV
  | PRVC => CMV
  | APRV => CMV
  | VC_SIMV => SIMV
  | PC_SIMV => SIMV
  | PRVC_SIMV => SIMV
  | ASV => SIMV
  | PSV => UNKNOWN
  | UNKNOWN => UNKNOWN
  }
}
type state = {
  ventilator_interface: ventilatorInterfaceType,
  ventilator_mode: ventilatorModeType,
  ventilator_oxygen_modality: ventilatorOxygenModalityType,
  ventilator_peep: option<float>,
  ventilator_pip: option<int>,
  ventilator_mean_airway_pressure: option<int>,
  ventilator_resp_rate: option<int>,
  ventilator_pressure_support: option<int>,
  ventilator_tidal_volume: option<int>,
  ventilator_oxygen_modality_oxygen_rate: option<int>,
  ventilator_oxygen_modality_flow_rate: option<int>,
  ventilator_fi02: option<int>,
  ventilator_spo2: option<int>,
  saving: bool,
}

type action =
  | SetVentilatorInterface(ventilatorInterfaceType)
  | SetVentilatorMode(ventilatorModeType)
  | SetOxygenModality(ventilatorOxygenModalityType)
  | SetPeep(option<float>)
  | SetPIP(option<int>)
  | SetMeanAirwayPressure(option<int>)
  | SetRespiratoryRate(option<int>)
  | SetPressureSupport(option<int>)
  | SetTidalVolume(option<int>)
  | SetOxygenModalityOxygenRate(option<int>)
  | SetOxygenModalityFlowRate(option<int>)
  | SetFIO2(option<int>)
  | SetSPO2(option<int>)
  | SetSaving
  | ClearSaving

let make = (
  ~ventilator_interface,
  ~ventilator_mode,
  ~ventilator_oxygen_modality,
  ~ventilator_peep,
  ~ventilator_pip,
  ~ventilator_mean_airway_pressure,
  ~ventilator_resp_rate,
  ~ventilator_pressure_support,
  ~ventilator_tidal_volume,
  ~ventilator_oxygen_modality_oxygen_rate,
  ~ventilator_oxygen_modality_flow_rate,
  ~ventilator_fi02,
  ~ventilator_spo2,
) => {
  ventilator_interface: ventilator_interface,
  ventilator_mode: ventilator_mode,
  ventilator_oxygen_modality: ventilator_oxygen_modality,
  ventilator_peep: ventilator_peep,
  ventilator_pip: ventilator_pip,
  ventilator_mean_airway_pressure: ventilator_mean_airway_pressure,
  ventilator_resp_rate: ventilator_resp_rate,
  ventilator_pressure_support: ventilator_pressure_support,
  ventilator_tidal_volume: ventilator_tidal_volume,
  ventilator_oxygen_modality_oxygen_rate: ventilator_oxygen_modality_oxygen_rate,
  ventilator_oxygen_modality_flow_rate: ventilator_oxygen_modality_flow_rate,
  ventilator_fi02: ventilator_fi02,
  ventilator_spo2: ventilator_spo2,
}

let makeFromJs = dailyRound => {
  make(
    ~ventilator_interface=decodeVentilatorInterfaceType(dailyRound["ventilator_interface"]),
    ~ventilator_mode=decodeVentilatorModeType(dailyRound["ventilator_mode"]),
    ~ventilator_oxygen_modality=decodeVetilatorOxygenModalityType(
      dailyRound["ventilator_oxygen_modality"],
    ),
    ~ventilator_peep=dailyRound["ventilator_peep"]->Js.Nullable.toOption,
    ~ventilator_pip=dailyRound["ventilator_pip"]->Js.Nullable.toOption,
    ~ventilator_mean_airway_pressure=dailyRound["ventilator_mean_airway_pressure"]->Js.Nullable.toOption,
    ~ventilator_resp_rate=dailyRound["ventilator_resp_rate"]->Js.Nullable.toOption,
    ~ventilator_pressure_support=dailyRound["ventilator_pressure_support"]->Js.Nullable.toOption,
    ~ventilator_tidal_volume=dailyRound["ventilator_tidal_volume"]->Js.Nullable.toOption,
    ~ventilator_oxygen_modality_oxygen_rate=dailyRound["ventilator_oxygen_modality_oxygen_rate"]->Js.Nullable.toOption,
    ~ventilator_oxygen_modality_flow_rate=dailyRound["ventilator_oxygen_modality_flow_rate"]->Js.Nullable.toOption,
    ~ventilator_fi02=dailyRound["ventilator_fi02"]->Js.Nullable.toOption,
    ~ventilator_spo2=dailyRound["ventilator_spo2"]->Js.Nullable.toOption,
  )
}

let getStatus = (min, minText, max, maxText, val) => {
  if val >= min && val <= max {
    ("Normal", "#059669")
  } else if val < min {
    (minText, "#DC2626")
  } else {
    (maxText, "#DC2626")
  }
}
