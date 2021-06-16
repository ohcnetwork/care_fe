let str = React.string


@react.component
let make = (~options, ~align) => {
    <div className="w-1/2 flex justify-center">
        {options|>Array.map((x) => {
            <>
                <label className="flex items-center justify-center mr-6">
                    <input className="mr-2" type_="radio" name={Options.name(x)} value={Options.value(x)} id={Options.value(x)} />
                    {str({Options.label(x)})}
                </label>
            </>
        })
        |> React.array }
    </div>
}
