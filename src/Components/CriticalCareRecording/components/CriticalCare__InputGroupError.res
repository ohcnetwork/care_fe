let str = React.string

@react.component
let make = (~message, ~active) =>
  if active {
    <div
      className="mt-1 px-1 py-px rounded text-xs font-semibold inline-flex items-center text-red-600 bg-red-100">
      <span className="mr-2"> <i className="fas fa-exclamation-triangle" /> </span>
      <span> {message |> str} </span>
    </div>
  } else {
    React.null
  }
