let str = React.string

@react.component
let make = (~prescriptions) => {
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
