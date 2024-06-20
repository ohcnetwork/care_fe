let str = React.string
open CriticalCare__Types

type optionType = {
  id: int,
  text: string,
}

let symptoms = [
  "ASYMPTOMATIC",
  "FEVER",
  "SORE THROAT",
  "COUGH",
  "BREATHLESSNESS",
  "MYALGIA",
  "ABDOMINAL DISCOMFORT",
  "VOMITING",
  "OTHERS",
  "",
  "SPUTUM",
  "NAUSEA",
  "CHEST PAIN",
  "HEMOPTYSIS",
  "NASAL DISCHARGE",
  "BODY ACHE",
  "DIARRHOEA",
  "PAIN",
  "PEDAL EDEMA",
  "WOUND",
  "CONSTIPATION",
  "HEAD ACHE",
  "BLEEDING",
  "DIZZINESS",
]

@react.component
let make = (~others, ~renderOptionalDescription, ~title) => {
  let additionalSymptoms = Others.additional_symptoms(others)
  <div>
    {title("Symptoms")}
    <div className="flex flex-wrap max-w-full">
      {switch additionalSymptoms {
      | Some(symptomsArray) => Js.Array.map(id => {
          <div className="rounded-full px-4 py-2 bg-gray-400 m-1 text-sm">
            {str(symptoms[id - 1])}
          </div>
        }, symptomsArray)->React.array
      | None => React.null
      }}
    </div>
    {renderOptionalDescription(
      "Physical Examination Info",
      Others.physical_examination_info(others),
    )}
    {renderOptionalDescription("Other Details", Others.other_details(others))}
  </div>
}
