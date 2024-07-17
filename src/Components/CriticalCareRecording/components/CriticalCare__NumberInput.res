let str = React.string

@react.component
let make = (~labels) => {
  <div>
    {labels
    |> Array.map(x => {
      <div className="grid grid-cols-2 my-4">
        <div> {str(x)} </div>
        <div>
          <input
            className="w-84 border-2 rounded border-secondary-400 p-1"
            type_="number"
            name={x}
            id={x}
          />
        </div>
      </div>
    })
    |> React.array}
  </div>
}
