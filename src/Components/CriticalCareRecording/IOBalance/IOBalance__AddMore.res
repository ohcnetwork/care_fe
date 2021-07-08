let str = React.string
open CriticalCare__Types

type slider_type = IOBalance.slider_type

@react.component
let make = (~sliders: array<slider_type>, ~addSlider) => {
    let (showDropdown, setShowDropdown) = React.useState(_ => false)

    <div className={sliders->Belt.Array.length == 0 ? "hidden" : "relative inline-block text-left p-2"}>
        <>
            <button
                type_="button"
                className="px-20 inline-flex justify-center w-full rounded-md border border-blue-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-blue-700 hover:bg-gray-100 focus:outline-none"
                onClick={(_) => setShowDropdown(prev => !prev)}>
                {str("Add More")} <div className="px-2" /> <i className="fas fa-sort-down" />
            </button>
        </>
        <div className={showDropdown ? "m-2 origin-top-right absolute right-0 mt-2 rounded-md shadow-lg w-full ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10" : "hidden"}>
            <div className="grid grid-cols-1 justify-items-start">
                {sliders->Belt.Array.map(slider => 
                     <div onClick={_ => addSlider(slider)} className="p-2 bg-white flex w-full hover:bg-gray-200">
                        <span className="px-2 py-1">
                            {str(slider.name)}
                        </span>
                    </div>
                )->React.array}
            </div>
        </div>
    </div>
}