let str = React.string

@react.component
let make = (~options, ~align) => {
    <div className={align}>
        {options|>Array.map((x) => {
            <>
            <input type_="radio" name={Options.name(x)} value={Options.value(x)} />
            <label>{str({Options.label(x)})}</label>
            </>
        })}
    </div>
}
