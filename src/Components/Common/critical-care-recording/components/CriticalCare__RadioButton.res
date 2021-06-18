let str = React.string

let horizontal_div_classes = "flex flex-wrap w-full justify-between "
let vertical_div_classes = "my-3"

let horizontal_label_classes = "flex flex-wrap items-center justify-center mr-6"
let vertical_label_classes = "my-1 block"

@react.component
let make = (~options, ~horizontal) => {
    <div className={horizontal ? horizontal_div_classes : vertical_div_classes}>
        {options|>Array.map((x) => {
            <>
                <label className={horizontal ? horizontal_label_classes : vertical_label_classes}>
                    <input className="mr-2" type_="radio" name={Options.name(x)} value={Options.value(x)} id={Options.value(x)} />
                    {str({Options.label(x)})}
                </label>
            </>
        })
        |> React.array }
    </div>
}
