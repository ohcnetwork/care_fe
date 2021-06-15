let str = React.string

let options :array<Options.t> = [
    {
        name: "loc",
        value: "alert",
        label: "Alert",
    },
    {
        name: "loc",
        value: "drowsy",
        label: "Drowsy",
    },
    {
        name: "loc",
        value: "stuporous",
        label: "Stuporous",
    },
    {
        name: "loc",
        value: "comatosed",
        label: "Comatosed",
    },
    {
        name: "loc",
        value: "restless",
        label: "Restless",
    }

]


@react.component
let make = () => {
    <div>
        {str("placeholder text")}
        <CriticalCare__RadioButton options={options} align="flex" />
    </div>
}
