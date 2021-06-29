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
  let (ventilationInterface,setVentilationInterface) = React.useState(_ => "")
  let handleChange = (opt) => setVentilationInterface(_ => opt)
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
                          />
                          {str({option["name"]})}
                      </label>
                  </div>
              })
              |> React.array }
            </div>
            <CriticalCare__VentilatorParametersEditor__Invasive/>
        </div>
      </div>
      <input type_="submit" className="text-white h-10 w-full bg-blue-500 my-10 rounded"/>
    </form>
  </div>
}