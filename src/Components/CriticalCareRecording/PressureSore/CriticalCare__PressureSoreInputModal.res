@val external innerWidth: int = "window.innerWidth"

let str = React.string
open CriticalCare__Types

type position = {
  "x": int,
  "y": int,
}

type part = PressureSore.part

@react.component
let make = (~show: bool, ~hideModal: ReactEvent.Mouse.t => unit, ~position: position, ~part: part, ~updatePart: part => unit) => {

  let (state, setState) = React.useState(_ => part)
  let (pushScore, setPushScore) = React.useState(_ => 0.0)

  React.useEffect2(() => {
    setState(_ => part)
    None
  }, (part, show))

  React.useEffect1(() => {
    let areaIntervalPoints = [0.0, 0.3, 0.6, 1.0, 2.2, 3.0, 4.0, 8.0, 12.0, 24.0]
    let exudateAmounts = ["None", "Light", "Moderate", "Heavy"]
    let tissueTypes = ["Closed", "Epithelial", "Granulation", "Slough", "Necrotic"]

    let area = state.length *. state.width
    let areaScore = areaIntervalPoints->Belt.Array.getIndexBy(interval => interval >= area)->Belt.Option.getWithDefault(10)->float_of_int
    let exudateScore = exudateAmounts->Belt.Array.getIndexBy(amount => amount == state.exudate_amount->PressureSore.extrudateAmountToString)->Belt.Option.getWithDefault(0)->float_of_int
    let tissueScore = tissueTypes->Belt.Array.getIndexBy(tissue => tissue == state.tissue_type->PressureSore.tissueTypeToString)->Belt.Option.getWithDefault(0)->float_of_int

    let score = areaScore +. exudateScore +. tissueScore
    Js.log4(area, areaScore, exudateScore, tissueScore)
    setPushScore(_ => score)
    None
  }, [state])

  let ref = React.useRef(Js.Nullable.null)
  let handleClickOutside = %raw(`
    function (event, ref, hideModal) {
      if (ref.current && !ref.current.contains(event.target)) {
        hideModal(event)
      }
    }
  `)

  <div 
    hidden={!show} 
    onClick={e => handleClickOutside(e, ref, hideModal)} 
    className="fixed w-full inset-0 z-40 overflow-y-auto"
  >
    <div
      className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div
          ref={ReactDOM.Ref.domRef(ref)}
          style={ReactDOMStyle.make(
            ~position={innerWidth >= 640 ? "absolute" : ""},
            ~left= `${position["x"]->Belt.Int.toString}px`,
            ~top=`${position["y"]->Belt.Int.toString}px`,
            ()
          )}
          className="transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-fit">
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <div className="flex gap-2">
                <span>{str("Region: ")}</span>
                <span className="text-black">{str(PressureSore.regionToString(state.region))}</span>
              </div>
              <div className="sm:flex gap-2 mt-2">
                <div>
                  <label className="block font-medium text-black">{str("Width")}</label>
                  <input
                    type_="number"
                    value={state.width->Belt.Float.toString}
                    step={0.1}
                    placeholder="Width (cm)"
                    className="border border-gray-300 rounded-md w-full px-2 py-1"
                    onChange={e => {
                      let value = ReactEvent.Form.target(e)["value"]->Belt.Float.fromString
                      switch value {
                      | Some(value) => setState(prev => {...prev, width: value})
                      | None => setState(prev => {...prev, width: 0.0})
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block font-medium text-black">{str("Height")}</label>
                  <input
                    type_="number"
                    value={state.length->Belt.Float.toString}
                    step={0.1}
                    placeholder="Length (cm)"
                    className="border border-gray-300 rounded-md w-full px-2 py-1"
                    onChange={e => {
                      let value = ReactEvent.Form.target(e)["value"]->Belt.Float.fromString
                      switch value {
                      | Some(value) => setState(prev => {...prev, length: value})
                      | None => setState(prev => {...prev, length: 0.0})
                      }
                    }}
                  />
                </div>
              </div>
              <div className="sm:flex gap-2 mt-2">
                  <CriticalCare__Dropdown
                    id="exudate-amount"
                    label="Exudate amount"
                    value={state.exudate_amount->PressureSore.encodeExudateAmount}
                    updateCB=(value => setState(prev => {...prev, exudate_amount: value->PressureSore.decodeExtrudateAmount}))
                    placeholder="Exudate amount"
                    selectables=["None", "Light", "Moderate", "Heavy"]
                  />
                  <CriticalCare__Dropdown
                    id="tissue-type"
                    label="Tissue type"
                    value={state.tissue_type->PressureSore.encodeTissueType}
                    updateCB=(value => setState(prev => {...prev, tissue_type: value->PressureSore.decodeTissueType}))
                    placeholder="Tissue type"
                    selectables=["Closed", "Epithelial", "Granulation", "Slough", "Necrotic"]
                  />
              </div>
              
              <div className="mt-2">
                <label className="block font-medium text-black">{str("Description")}</label>
                <textarea
                  placeholder="Description"
                  value={state.description}
                  onChange={e => {
                    let value = ReactEvent.Form.target(e)["value"]
                    setState(prev => {...prev, description: value})
                  }}
                  className="border border-gray-300 rounded-md px-2 py-1 w-full"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex gap-2">
            <span>{str("Push Score: ")}</span>
            <span className="text-black">{str(pushScore->Belt.Float.toString)}</span>
          </div>
          <div className="sm:flex sm:flex-row-reverse">
            <button
              type_="button"
              onClick=(e => {
                updatePart(state)
                hideModal(e)
              })
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm">
              {str("Apply")}
            </button>
            <button
              type_="button"
              onClick={hideModal}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              {str("Cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

}
