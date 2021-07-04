let str = React.string

open MaterialUi

@react.component
let make = (~checked, ~onChange) => {
  <div
    className="flex flex-row font-semibold leading-relaxed items-center justify-between px-4 py-2 border rounded border-gray-500">
    <div> {str("The patient is on prone position")} </div> <div> <Switch checked onChange /> </div>
  </div>
}
