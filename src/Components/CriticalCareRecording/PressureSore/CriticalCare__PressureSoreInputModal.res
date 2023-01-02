@val external innerWidth: int = "window.innerWidth"
@val external innerHeight: int = "window.innerHeight"

let str = React.string
open CriticalCare__Types

type position = {"x": int, "y": int}

type part = PressureSore.part

@react.component
let make = (
  ~show: bool,
  ~modalRef: ReactDOM.domRef,
  ~previewMode: bool,
  ~hideModal: ReactEvent.Mouse.t => unit,
  ~position: position,
  ~part: part,
  ~updatePart: part => unit,
) => {
  let (state, setState) = React.useState(_ => part)
  let (pushScore, setPushScore) = React.useState(_ => 0.0)

  React.useEffect2(() => {
    setState(_ => part)
    None
  }, (part, show))

  React.useEffect1(() => {
    let score = PressureSore.calculatePushScore(
      state.length,
      state.width,
      state.exudate_amount,
      state.tissue_type,
    )
    setPushScore(_ => score)
    None
  }, [state])

  let handleClickOutside = %raw(`
    function (event, ref, hideModal) {
      if (ref.current && !ref.current.contains(event.target)) {
        hideModal(event)
      }
    }
  `)

  let getModalPosition = React.useMemo(() => {
    () => {
      let modalWidth = 350
      let modalHeight = 352
      
      {
        "top": (
          innerHeight - position["y"] < modalHeight ? position["y"] - modalHeight : position["y"]
        )->Belt.Int.toString ++ "px",
        "left": (
          innerWidth - position["x"] < modalWidth ? position["x"] - modalWidth : position["x"]
        )->Belt.Int.toString ++ "px",
      }
    }
  })

  <div
    hidden={!show}
    onClick={e => handleClickOutside(e, modalRef, hideModal)}
    className={previewMode && innerWidth > 720 ? "" : "fixed w-full inset-0 z-40 overflow-y-auto"}>
    <div
      hidden={!show}
      className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div
        ref={modalRef}
        style={ReactDOMStyle.make(
          ~position={innerWidth >= 720 ? "absolute" : ""},
          ~left=getModalPosition()["left"],
          ~top=getModalPosition()["top"],
          (),
        )}
        className="transform max-w-[350px] rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-fit">
        <div className="bg-white px-4 pt-2 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <div className="flex gap-2 justify-center">
                <span> {str("Region: ")} </span>
                <span className="text-black">
                  {str(PressureSore.regionToString(state.region))}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <div>
                  <label className="block font-medium text-black text-left"> {str("Width")} </label>
                  <input
                    type_="number"
                    value={state.width->Belt.Float.toString}
                    step={0.1}
                    placeholder="Width (cm)"
                    className="border border-gray-300 rounded-md w-full px-2 py-1"
                    disabled={previewMode}
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
                  <label className="block font-medium text-black text-left">
                    {str("Height")}
                  </label>
                  <input
                    type_="number"
                    value={state.length->Belt.Float.toString}
                    step={0.1}
                    placeholder="Length (cm)"
                    className="border border-gray-300 rounded-md w-full px-2 py-1"
                    disabled={previewMode}
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
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <CriticalCare__Dropdown
                  id="exudate-amount"
                  label="Exudate amount"
                  value={state.exudate_amount->PressureSore.encodeExudateAmount}
                  updateCB={value =>
                    setState(prev => {
                      ...prev,
                      exudate_amount: value->PressureSore.decodeExtrudateAmount,
                    })}
                  placeholder="Exudate amount"
                  selectables=["None", "Light", "Moderate", "Heavy"]
                  disabled={previewMode}
                />
                <CriticalCare__Dropdown
                  id="tissue-type"
                  label="Tissue type"
                  value={state.tissue_type->PressureSore.encodeTissueType}
                  updateCB={value =>
                    setState(prev => {...prev, tissue_type: value->PressureSore.decodeTissueType})}
                  placeholder="Tissue type"
                  selectables=["Closed", "Epithelial", "Granulation", "Slough", "Necrotic"]
                  disabled={previewMode}
                />
              </div>
              <div className="mt-2">
                <label className="block font-medium text-black text-left">
                  {str("Description")}
                </label>
                <textarea
                  placeholder="Description"
                  value={state.description}
                  onChange={e => {
                    let value = ReactEvent.Form.target(e)["value"]
                    setState(prev => {...prev, description: value})
                  }}
                  className="border border-gray-300 rounded-md px-2 py-1 w-full"
                  disabled={previewMode}
                />
              </div>
            </div>
          </div>
        </div>
        <div
          className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex gap-2 w-full justify-center sm:justify-start items-center">
            <span> {str("Push Score: ")} </span>
            <span className="text-black"> {str(pushScore->Belt.Float.toString)} </span>
          </div>
          <div className="flex flex-col-reverse sm:flex-row-reverse w-full gap-2">
            {!previewMode
              ? <button
                  type_="button"
                  onClick={e => {
                    updatePart(state)
                    hideModal(e)
                  }}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm">
                  {str("Apply")}
                </button>
              : React.null}
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
