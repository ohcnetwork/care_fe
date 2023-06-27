let str = React.string

@react.component
let make = (~checked, ~onChange) => {
  <div
    className="flex flex-row font-semibold leading-relaxed items-center justify-between px-4 py-2 border rounded border-gray-500">
    <div> {str("The patient is on prone position")} </div>
    <div>
      <div className="relative" onClick={_ => onChange(!checked)} >
        <input
          type_="checkbox"
          id="toggle"
          className="sr-only"
          checked
          // onChange
        />
        <div
          className={"block w-14 h-8 rounded-full " ++ (
            checked ? "bg-green-300" : "bg-gray-400"
          )}
        />
        <div
          className="transition duration-150 ease-in-out dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full checked:bg-green-300"
        />
      </div> 
    </div>
  </div>
}
