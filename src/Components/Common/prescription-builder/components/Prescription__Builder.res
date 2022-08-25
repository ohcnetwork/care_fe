let str = React.string

let medicines = %raw(`require("../assets/medicines.json")`)
let dosages = ["od", "hs", "bd", "tid", "qid", "q4h", "qod", "qwk", "sos"]
type prescriptions = array<Prescription__Prescription.t>

let findAndReplace = (index, f, array) =>
  array |> Array.mapi((i, prescription) => i == index ? f(prescription) : prescription)

type action =
  | UpdateMedicine(string, int)
  | UpdateDosage(string, int)
  | UpdateDays(int, int)
  | DeletePescription(int)
  | AddPescription

let reducer = (prescriptions, action) =>
  switch action {
  | UpdateMedicine(medicine, index) =>
    prescriptions |> findAndReplace(index, Prescription__Prescription.updateMedicine(medicine))

  | UpdateDosage(dosage, index) =>
    prescriptions |> findAndReplace(index, Prescription__Prescription.updateDosage(dosage))

  | UpdateDays(days, index) =>
    prescriptions |> findAndReplace(index, Prescription__Prescription.updateDays(days |> abs))

  | AddPescription => prescriptions |> Js.Array.concat([Prescription__Prescription.empty()])

  | DeletePescription(index) => prescriptions |> Js.Array.filteri((_, i) => i != index)
  }

let showPrescriptionForm = (item, index, send) =>
  <div className="flex justify-between items-center" key={index |> string_of_int}>
    <div className="m-1 rounded-md shadow-sm w-4/6">
      <Prescription__Picker
        id={"medicine" ++ (index |> string_of_int)}
        value={item |> Prescription__Prescription.medicine}
        updateCB={medicine => send(UpdateMedicine(medicine, index))}
        placeholder="Select a Medicine"
        selectables=medicines
      />
    </div>
    <div className="m-1 rounded-md shadow-sm w-1/6">
      <Prescription__Picker
        id={"dosage" ++ (index |> string_of_int)}
        value={item |> Prescription__Prescription.dosage}
        updateCB={dosage => send(UpdateDosage(dosage, index))}
        placeholder="Dosage"
        selectables=dosages
      />
    </div>
    <div className="m-1 rounded-md shadow-sm w-1/6">
      <input
        id={"days" ++ (index |> string_of_int)}
        className="appearance-none h-10 mt-1 block w-full border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white focus:border-gray-600"
        placeholder="Days"
        onChange={e => send(UpdateDays(ReactEvent.Form.target(e)["value"], index))}
        value={item |> Prescription__Prescription.days |> string_of_int}
        type_="number"
        required=true
      />
    </div>
    <div
      onClick={_ => send(DeletePescription(index))}
      className="appearance-none h-10 mt-1 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white focus:border-gray-600 text-gray-600 font-bold">
      {"x" |> str}
    </div>
  </div>

@react.component
let make = (~prescriptions, ~selectCB) => {
  let send = action => reducer(prescriptions, action) |> selectCB
  <div
    className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6 max-w-5xl mx-auto border mt-4">
    <h3 className="text-lg leading-6 font-medium text-gray-900"> {"Prescription" |> str} </h3>
    <div className="flex justify-between mt-4">
      <div className="m-1 rounded-md shadow-sm w-4/6">
        <label htmlFor="Medicine" className="block text-sm font-medium leading-5 text-gray-700">
          {"Medicine" |> str}
        </label>
      </div>
      <div className="m-1 rounded-md shadow-sm w-1/6">
        <label htmlFor="Dosage" className="block text-sm font-medium leading-5 text-gray-700">
          {"Dosage" |> str}
        </label>
      </div>
      <div className="m-1 rounded-md shadow-sm w-1/6">
        <label htmlFor="Days" className="block text-sm font-medium leading-5 text-gray-700">
          {"Days" |> str}
        </label>
      </div>
    </div>
    {prescriptions
    |> Array.mapi((index, item) => showPrescriptionForm(item, index, send))
    |> React.array}
    <div className="m-1 rounded-md shadow-sm bg-gray-200 rounded">
      <button
        type_="button"
        onClick={_ => send(AddPescription)}
        className="w-full font-bold block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900">
        {"+ Add medicine" |> str}
      </button>
    </div>
  </div>
}
