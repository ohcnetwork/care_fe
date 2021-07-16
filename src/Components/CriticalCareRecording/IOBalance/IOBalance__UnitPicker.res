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

let renderSelectables = (selections, updateCB, setSearchTerm) =>
  selections |> Array.mapi((index, selection) =>
    <button
      type_="button"
      key={index |> string_of_int}
      onClick={_ => {
        setSearchTerm(_ => selection)
        updateCB(selection)
      }}
      className="w-full block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900">
      {selection |> str}
    </button>
  )

let searchResult = (searchInput, updateCB, selectables, setSearchTerm) => {
  // Remove all excess space characters from the user input.
  let normalizedString =
    searchInput
    |> Js.String.trim
    |> Js.String.replaceByRe(Js.Re.fromStringWithFlags("\\s+", ~flags="g"), " ")
  switch normalizedString {
  | "" => []
  | searchString =>
    let matchingSelections = search(searchString, selectables)
    renderSelectables(matchingSelections, updateCB, setSearchTerm)
  }
}

let renderDropdown = results =>
  <div className="origin-top-left absolute z-40 left-0 mt-2 w-full rounded-md shadow-lg ">
    <div className="rounded-md bg-white shadow-xs">
      <div className="py-1 max-height-dropdown"> {results |> React.array} </div>
    </div>
  </div>

@react.component
let make = (~id, ~value, ~updateCB, ~placeholder, ~selectables) => {
  let (searchTerm, setSearchTerm) = React.useState(_ => value)
  let (showDropdown, setShowDropdown) = React.useState(_ => true)
  let results = searchResult(searchTerm, updateCB, selectables, setSearchTerm)

  React.useEffect1(() => {
    let curriedFunction = onWindowClick(showDropdown, setShowDropdown)

    let removeEventListener = () => Window.removeEventListener("click", curriedFunction, window)

    if showDropdown {
      Window.addEventListener("click", curriedFunction, window)
      Some(removeEventListener)
    } else {
      removeEventListener()
      None
    }
  }, [showDropdown])

  <div className="relative inline-block text-left w-full">
    <input
      id
      autoFocus={true}
      value={searchTerm}
      autoComplete="false"
      onClick={_ => setShowDropdown(_ => !showDropdown)}
      onChange={e => setSearchTerm(_ => ReactEvent.Form.target(e)["value"])}
      className="appearance-none h-10 mt-1 block w-full border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white focus:border-gray-600"
      placeholder
      required=true
    />
    {results |> Array.length == 0
      ? switch showDropdown {
        | true => renderDropdown(renderSelectables(selectables, updateCB, setSearchTerm))
        | false => React.null
        }
      : switch showDropdown {
        | true => renderDropdown(results)
        | false => React.null
        }}
  </div>
}
