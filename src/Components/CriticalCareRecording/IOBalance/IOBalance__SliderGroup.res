let str = React.string
open CriticalCare__Types

type slider_type = IOBalance.slider_type

@react.component
let make = (~title, ~sliders, ~moreSliders, ~changeFieldValue, ~changeVisibility, ~addSlider) => {
    <div>
        <h4 className={title->Js.String2.length === 0 ? "hidden" : ""}>{str(title)}</h4>
        {
            sliders->Belt.Array.map((slider: slider_type) => 
            <div className="flex items-center">
                <input 
                    type_="checkbox"
                    className="mr-4"
                    checked={slider.checked}
                    onChange={(event) => changeVisibility(slider.name, ReactEvent.Synthetic.currentTarget(event)["checked"])}
                />
                {slider.checked ?
                    <Slider
                        title={slider.name}
                        start={slider.start}
                        end={slider.end}
                        interval={slider.interval}
                        step={slider.step}
                        value={slider.value}
                        setValue={s => changeFieldValue(slider.name, s)}
                        getLabel={_ => ("Normal", "#ff0000")}
                    /> :
                    <h1 className="text-lg font-sans">{str(slider.name)}</h1>
                }
            </div>)->React.array
        }

        <IOBalance__AddMore sliders={moreSliders} addSlider={addSlider} />
    </div>
}
