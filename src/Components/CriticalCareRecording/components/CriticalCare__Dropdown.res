let str = React.string

open Webapi.Dom

let onWindowClick = (showDropdown, setShowDropdown, _event) =>
  if showDropdown {
    setShowDropdown(_ => false)
  } else {
    ()
  }

let toggleDropdown = (setShowDropdown, event) => {
  event |> ReactEvent.Mouse.stopPropagation
  setShowDropdown(showDropdown => !showDropdown)
}

let search = (searchString, selectables) =>
  (selectables |> Js.Array.filter(selection =>
    selection
    |> String.lowercase_ascii
    |> Js.String.includes(searchString |> String.lowercase_ascii) && selection != searchString
  ))->Belt.SortArray.stableSortBy((x, y) => String.compare(x, y))

let renderSelectables = (selections, updateCB) =>
  selections |> Array.mapi((index, selection) =>
    <button
      type_="button"
      key={index |> string_of_int}
      onClick={_ => updateCB(selection)}
      className="w-full block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900">
      {selection |> str}
    </button>
  )

let searchResult = (searchInput, updateCB, selectables) => {
  // Remove all excess space characters from the user input.
  let normalizedString =
    searchInput
    |> Js.String.trim
    |> Js.String.replaceByRe(Js.Re.fromStringWithFlags("\\s+", ~flags="g"), " ")
  switch normalizedString {
  | "" => []
  | searchString =>
    let matchingSelections = search(searchString, selectables)
    renderSelectables(matchingSelections, updateCB)
  }
}

let renderDropdown = results =>
  <div className="origin-top-left absolute z-40 left-0 mt-2 w-full rounded-md shadow-lg ">
    <div className="rounded-md bg-white ring-1 ring-black ring-opacity-5">
      <div className="py-1 max-height-dropdown"> {results |> React.array} </div>
    </div>
  </div>

@react.component
let make = (~id, ~value, ~updateCB, ~placeholder, ~selectables, ~label="", ~disabled=false) => {
  let results = searchResult(value, updateCB, selectables)
  let (showDropdown, setShowDropdown) = React.useState(_ => false)
  React.useEffect1(() => {
    let curriedFunction = onWindowClick(showDropdown, setShowDropdown)

    let removeEventListener = () => Window.removeEventListener(window, "click", curriedFunction)

    if showDropdown {
      Window.addEventListener(window, "click", curriedFunction)
      Some(removeEventListener)
    } else {
      removeEventListener()
      None
    }
  }, [showDropdown])

  <div className="relative inline-block text-left w-full">
    <label className="block font-medium text-black" hidden={label == ""}>{str(label)}</label>
    <input
      id
      value
      autoComplete="off"
      onClick={_ => setShowDropdown(_ => !showDropdown)}
      onChange={e => updateCB(ReactEvent.Form.target(e)["value"])}
      className="appearance-none h-10 mt-1 block w-full border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white focus:ring-primary-500"
      disabled
      placeholder
      required=true
    />
    {results |> Array.length == 0
      ? switch showDropdown {
        | true => renderDropdown(renderSelectables(selectables, updateCB))
        | false => React.null
        }
      : switch showDropdown {
        | true => renderDropdown(results)
        | false => React.null
        }}
  </div>
}
