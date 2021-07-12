let str = React.string


type unit_type = {
    field: string,
    value: float
}

type unit_section_type = {
    units: array<unit_type>,
    params: array<string>
}

let findAndReplace = (index, f, array) =>
  array |> Array.mapi((i, item) => i == index ? f(item) : item)

type action =
  | UpdateField(string, int)
  | UpdateValue(float, int)
  | DeleteUnit(int)
  | AddUnit

let changeField = (field, t) => {...t, field: field}
let changeValue = (value, t) => {...t, value: value}

let reducer = (state, action) => {
  switch action {
    | UpdateField(field, index) => {
      let new_units = state.units |> findAndReplace(index, changeField(field))
      let new_params = state.params->Js.Array2.filter(param => param !== field)
      {units: new_units, params: new_params}
    }
    | UpdateValue(value, index) => {
      let new_units = state.units |> findAndReplace(index, changeValue(value))
      {...state, units: new_units}
    }
    | AddUnit => {
      let new_units = state.units |> Js.Array.concat([{field: "", value: 0.0}])
      {...state, units: new_units}
    }
    | DeleteUnit(index) => {
      let new_units = state.units |> Js.Array.filteri((_, i) => i != index)
      {...state, units: new_units}
    }
  }
}

let getField = (t) => t.field
let getValue = (t) => t.value

let showUnit = (item, params, index, send) =>
  <div className="flex justify-between items-center" key={index |> string_of_int}>
    <div className="m-1 rounded-md shadow-sm w-4/6">
      <IOBalance__UnitPicker
        id={"field" ++ (index->string_of_int)}
        value={item.field}
        updateCB={field => UpdateField(field, index)->send}
        placeholder="Select a Param"
        selectables=params
      />
    </div>
    <div className="m-1 rounded-md shadow-sm w-1/6">
      <input
        id={"value" ++ (index->string_of_int)}
        className="appearance-none h-10 mt-1 block w-full border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white focus:border-gray-600"
        placeholder="Value"
        onChange={e => UpdateValue(ReactEvent.Form.target(e)["value"], index)->send}
        value={item.value->Belt.Float.toString}
        type_="number"
        required=true
      />
    </div>
    <div
      onClick={_ => index->DeleteUnit->send}
      className="appearance-none h-10 mt-1 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white focus:border-gray-600 text-gray-600 font-bold">
      {"x"->str}
    </div>
  </div>

@react.component
let make = (~name, ~units, ~params, ~selectCB) => {
  let send = action => reducer({units: units, params: params}, action) |> selectCB
  let showAdd = !(params->Array.length === 0 || (units->Array.length > 0 ? (units[units->Array.length - 1].field === "") : false))

  <div
    className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6 max-w-3xl mx-auto border mt-4">
    <h3 className={name === "" ? "hidden" : "text-lg leading-6 font-medium text-gray-900"}> {name->str} </h3>
    <div className="flex justify-between mt-4">
      <div className="m-1 rounded-md shadow-sm w-8/12">
        <label htmlFor="Field" className="block text-sm font-medium leading-5 text-gray-700">
          {"Field"->str}
        </label>
      </div>
      <div className="m-1 rounded-md shadow-sm w-2/12">
        <label htmlFor="Value" className="block text-sm font-medium leading-5 text-gray-700">
          {"Value"->str}
        </label>
      </div>
      <div className="m-1 rounded-md shadow-sm w-1/12">
        <label htmlFor="Value" className="block text-sm font-medium leading-5 text-gray-700">
          {"x"->str}
        </label>
      </div>
    </div>
    {units
    |> Array.mapi((index, item) => showUnit(item, params, index, send))
    |> React.array}
    <div className={showAdd ? "m-1 rounded-md shadow-sm bg-gray-200 rounded" : "hidden"}>
      <button
        type_="button"
        onClick={_ => AddUnit->send}
        className="w-full font-bold block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900">
        {"+ Add a field" |> str}
      </button>
    </div>
  </div>
}
