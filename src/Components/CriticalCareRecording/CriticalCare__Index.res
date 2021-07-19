let str = React.string
open CriticalCare__Types

let renderLine = (title, value) => {
  <div>
    <span className="font-semibold"> {str(`${title}:`)} </span>
    <span className="pl-2"> {str(value)} </span>
  </div>
}

let renderOptionalInt = (title, value) => {
  Belt.Option.mapWithDefault(value, React.null, v => renderLine(title, string_of_int(v)))
}

let renderOptionalDescription = (title, value) => {
  switch value {
  | Some(v) =>
    <div>
      <span className="font-semibold"> {str(`${title}:`)} </span>
      <span className="pl-2"> {str(v)} </span>
    </div>
  | None => React.null
  }
}

let title = text => {
  <div className="text-lg font-bold mt-2"> {str(text)} </div>
}

let renderCriticalCare = neurologicalMonitoring => {
  <div className="space-y-2">
    {renderLine(
      "Level of Consciousness",
      NeurologicalMonitoring.consciousnessLevelToString(
        NeurologicalMonitoring.consciousnessLevel(neurologicalMonitoring),
      ),
    )}
    {renderOptionalDescription(
      "Consciousness Level Reaction Description",
      NeurologicalMonitoring.consciousnessLevelDetails(neurologicalMonitoring),
    )}
    <div className="flex md:flex-row flex-col mt-2">
      <div className="px-4 py-2 border bg-gray-100 m-1 rounded-lg shadow md:w-1/2 w-full">
        {title("Left Pupil")}
        {renderOptionalInt("Size", NeurologicalMonitoring.leftPupilSize(neurologicalMonitoring))}
        {renderOptionalDescription(
          "Pupil Size Description",
          NeurologicalMonitoring.leftPupilSizeDetails(neurologicalMonitoring),
        )}
        {renderLine(
          "Light Reaction",
          NeurologicalMonitoring.lightReactionToString(
            NeurologicalMonitoring.leftPupilLightReaction(neurologicalMonitoring),
          ),
        )}
        {renderOptionalDescription(
          "Light Reaction Description",
          NeurologicalMonitoring.leftPupilLightReactionDetails(neurologicalMonitoring),
        )}
      </div>
      <div className="px-4 py-2 border bg-gray-100 m-1 rounded-lg shadow md:w-1/2 w-full">
        {title("Right Pupil")}
        {renderOptionalInt("Size", NeurologicalMonitoring.rightPupilSize(neurologicalMonitoring))}
        {renderOptionalDescription(
          "Pupil Size Description",
          NeurologicalMonitoring.rightPupilSizeDetails(neurologicalMonitoring),
        )}
      </div>
    </div>
    {renderLine(
      "Light Reaction",
      NeurologicalMonitoring.lightReactionToString(
        NeurologicalMonitoring.leftPupilLightReaction(neurologicalMonitoring),
      ),
    )}
    {renderOptionalDescription(
      "Light Reaction Description",
      NeurologicalMonitoring.leftPupilLightReactionDetails(neurologicalMonitoring),
    )}
    {str("...add more")}
  </div>
}

let renderPrescription = prescriptions => {
  <div>
    {ArrayUtils.isEmpty(prescriptions)
      ? <div> {str("No Medicines Prescribed")} </div>
      : <div className="flex flex-col">
          <div className="-my-2 py-2 overflow-x-auto sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div
              className="align-middle inline-block min-w-full shadow overflow-hidden sm:rounded-lg border-b border-gray-200">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th
                      className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                      {str("Medicine")}
                    </th>
                    <th
                      className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                      {str("Dosage")}
                    </th>
                    <th
                      className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                      {str("Days")}
                    </th>
                  </tr>
                </thead>
                <tbody> {Js.Array.mapi((p, index) => {
                    <tr className="bg-white" key={string_of_int(index)}>
                      <td
                        className="px-6 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-900">
                        {str(Prescription__Prescription.medicine(p))}
                      </td>
                      <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                        {str(Prescription__Prescription.dosage(p))}
                      </td>
                      <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                        {str(string_of_int(Prescription__Prescription.days(p)))}
                      </td>
                    </tr>
                  }, prescriptions)->React.array} </tbody>
              </table>
            </div>
          </div>
        </div>}
  </div>
}

@react.component
export make = (~id, ~facilityId, ~patientId, ~consultationId, ~dailyRound) => {
  <div className=" px-4 py-5sm:px-6 max-w-5xl mx-auto mt-4">
    <div>
      <Link
        className="btn btn-default bg-white"
        href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`}>
        {str("Go back to Consultation")}
      </Link>
    </div>
    <div>
      <div
        className="bg-white px-2 md:px-6 py-5 border-b border-gray-200 sm:px-6 max-w-5xl mx-auto border mt-4 shadow rounded-lg">
        <div className="text-5xl"> {str("Consultation Update")} </div>
        <div>
          <CriticalCare__PageTitle title="Neurological Monitoring" />
          {renderCriticalCare(CriticalCare__DailyRound.neurologicalMonitoring(dailyRound))}
        </div>
        <div>
          <CriticalCare__PageTitle title="Medicines" />
          {renderPrescription(CriticalCare__DailyRound.medicine(dailyRound))}
        </div>
      </div>
    </div>
  </div>
}
