let str = React.string

let divClasses = isIsHorizontal => {
  isIsHorizontal ? "flex flex-wrap w-full" : "my-3"
}

let labelClasses = ishorizontal => {
  ishorizontal ? "flex flex-wrap items-center justify-center mr-20 mt-2" : "my-1 block"
}

@react.component
let make = (
  ~options,
  ~ishorizontal=true,
  ~defaultChecked="",
  ~onChange: ReactEvent.Form.t => unit,
) => {
  <div className={divClasses(ishorizontal)}> {Js.Array.mapi((x, i) => {
      <div key={`${Options.name(x)}_${string_of_int(i)}`}>
        <label className={labelClasses(ishorizontal)}>
          <input
            className="mr-2"
            type_="radio"
            name={Options.name(x)}
            value={Options.value(x)}
            id={Options.value(x)}
            onChange
            defaultChecked={Options.value(x) === defaultChecked}
          />
          {str({Options.label(x)})}
        </label>
      </div>
    }, options)->React.array} </div>
}
