let str = React.string

let ventilationInterfaceOptions = [
  {
	  "name":"Invasive (IV)",
	  "value":"iv"
  },
  {
	  "name":"Non-Invasive (NIV)",
	  "value":"niv"
	},
	  {
	  "name":"None",
	  "value":"none"
 }
]

@react.component
let make = ()=>{
  let (ventilationInterface,setVentilationInterface) = React.useState(_ => "iv")
  let handleChange = (opt) => setVentilationInterface(_ => opt)

  let editor = switch ventilationInterface {
  | "iv" => <CriticalCare__VentilatorParametersEditor__Invasive/>
  | "niv" =>  <CriticalCare__VentilatorParametersEditor__NonInvasive/>
  | "none" => <CriticalCare__VentilatorParametersEditor__None/>
  | "" => <CriticalCare__VentilatorParametersEditor__Invasive/>
  }

  <div>
    <CriticalCare__PageTitle title="Ventilator Parameters" />
    <form className="p-6">
      <div className="mb-6">
        <h4>{str("Ventilation Interface")}</h4>
        <div>
            <div className="flex items-center py-4 mb-4">
              {ventilationInterfaceOptions|>Array.map((option) => {
                  <div key={option["value"]} className="mr-4"  >
                      <label onClick={(_) => handleChange(option["value"])} >
                          <input 
                            className="mr-2" 
                            type_="radio" 
                            name="ventilationInterface"
                            value={option["value"]} 
                            id={option["value"]}
                            checked={option["value"]===ventilationInterface}
                          />
                          {str({option["name"]})}
                      </label>
                  </div>
              })
              |> React.array }
            </div>
            {editor}
        </div>
      </div>
      <input type_="submit" className="text-white py-3 text-xl w-full bg-blue-500 hover:bg-blue-600 cursor-pointer my-10 rounded"/>
    </form>
  </div>
}