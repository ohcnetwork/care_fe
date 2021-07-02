let str = React.string
open CriticalCare__Types


@react.component
// ~setSlider, ~removeSlider
let make = (~title, ~sliders) => {
    let (state, setState) = React.useState(_ => "50")
    <div>
        <h4 className={title->Js.String2.length === 0 ? "hidden" : ""}>{str(title)}</h4>
        {
            sliders->Belt.Array.map((slider) => 
            <div className="flex items-center">
                <input type_="checkbox" className="mr-4" checked={slider["checked"]} />
                {slider["checked"] ?
                    <Slider
                        title={slider["name"]}
                        start={slider["start"]}
                        end={slider["end"]}
                        interval={slider["interval"]}
                        step={slider["step"]}
                        value={slider["value"]}
                        setValue={s => setState(_prev => s)}
                        getLabel={_ => ("Normal", "#ff0000")}
                    /> :
                    <h1 className="text-lg font-sans">{str(slider["name"])}</h1>
                }

            </div>)->React.array
        }
    </div>
}
