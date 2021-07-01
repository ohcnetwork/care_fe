let str = React.string

let checkBoxSliderConfig = [
    {
        "checkboxTitle":"Nasal Prongs"
        "title":"Oxygen Level (l/m)",
        "start":"0",
        "end":"50",
        "interval":"5",
        "step":1.0
    },
    {
        "checkboxTitle":"Simple Face Mask"
        "title":"Oxygen Level (l/m)",
        "start":"0",
        "end":"50",
        "interval":"5",
        "step":1.0
    }
]

let sliderConfig = [
    {
        "title":"FiO2 (%)",
        "start":"20",
        "end":"100",
        "interval":"10",
        "step":1.0
    },
    {
        "title":"SPO2 (%)",
        "start":"0",
        "end":"100",
        "interval":"10",
        "step":1.0
    }
]

module ShowOnChecked = {
@react.component
let make = (~title,~children) => {
    let (checked,setChecked) = React.useState(_ => false)
    let handleChange = (e) => setChecked(prev =>  !prev)
    Js.log(checked)
    <>
        <label htmlFor={title} className="mb-6 block" >
            <input type_="checkbox" className="mr-6 inline-block" id={title} name={title} value={title} checked onChange={handleChange}/>
            {str(title)}
        </label>
        {checked ? children : React.null}
    </>
}}

@react.component
let make = () =>{
    let (active,setActive) = React.useState(_ => "")
    let (slider,setSlider) = React.useState(_ => "")
    let handleChange = (opt) => setActive(_ => opt)

    <div>
        <h4 className="mb-4" >{str("Oxygen Modality")}</h4>
        <div className={`ml-6`}>
                {checkBoxSliderConfig|>Array.map((option) => {
                    <div>
                        <ShowOnChecked title={option["checkboxTitle"]} >
                            <Slider
                                title={option["title"]}
                                start={option["start"]}
                                end={option["end"]}
                                interval={option["interval"]}
                                step={option["step"]}
                                value={slider}
                                setValue={(s) => setSlider(_ => s)}
                                getLabel={_=>("Normal","#ff0000")}
                            />
                        </ShowOnChecked>
                    </div>
                })|>React.array
                }
        </div>
        <div className={`ml-6`}>
            <label htmlFor={"Non-Rebreathing Mask"} className="mb-6 block" >
                <input type_="checkbox" className="mr-6 inline-block" id={"Non-Rebreathing Mask"} name={"Non-Rebreathing Mask"} value={"Non-Rebreathing Mask"} />
                {str("Non-Rebreathing Mask")}
            </label>
            <label htmlFor={"High Flow Nasal Cannula"} className="mb-6 block" >
                <input type_="checkbox" className="mr-6 inline-block" id={"High Flow Nasal Cannula"} name={"High Flow Nasal Cannula"} value={"High Flow Nasal Cannula"} />
                {str("High Flow Nasal Cannula")}
            </label>
        </div>
        <div className={`ml-6`}>
                {sliderConfig|>Array.map((option) => {
                    <Slider
                        title={option["title"]}
                        start={option["start"]}
                        end={option["end"]}
                        interval={option["interval"]}
                        step={option["step"]}
                        value={slider}
                        setValue={(s) => setSlider(_ => s)}
                        getLabel={_=>("Normal","#ff0000")}
                    />
                })|>React.array
                }
        </div>
    </div>
}