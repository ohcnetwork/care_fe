let str = React.string

@react.component
let make = (~ioBalance) => {
  <div
    className="border rounded-lg bg-white shadow h-full hover:border-primary-500 text-black mt-4 p-4">
    <h3> {str("I/O Balance")} </h3>
    <div>
      <span className="font-semibold leading-relaxed my-2 block"> {str("Infusions: ")} </span>
      <table className="text-left border">
        <tr>
          <th className="text-left border p-2"> {str("Name")} </th>
          <th className="text-left border p-2"> {str("Quantity")} </th>
        </tr>
        {Js.Array.map(
          item =>
            <tr>
              <td className="text-left border p-2"> {str(CriticalCare__IOBalance.name(item))} </td>
              <td className="text-left border p-2">
                {React.float(CriticalCare__IOBalance.quantity(item))}
              </td>
            </tr>,
          CriticalCare__IOBalance.infusions(ioBalance),
        )->React.array}
      </table>
    </div>
    <div>
      <span className="font-semibold leading-relaxed my-2 block"> {str("IV Fluid: ")} </span>
      <table className="text-left border">
        <tr>
          <th className="text-left border p-2"> {str("Name")} </th>
          <th className="text-left border p-2"> {str("Quantity")} </th>
        </tr>
        {Js.Array.map(
          item =>
            <tr>
              <td className="text-left border p-2"> {str(CriticalCare__IOBalance.name(item))} </td>
              <td className="text-left border p-2">
                {React.float(CriticalCare__IOBalance.quantity(item))}
              </td>
            </tr>,
          CriticalCare__IOBalance.ivFluid(ioBalance),
        )->React.array}
      </table>
    </div>
    <div>
      <span className="font-semibold leading-relaxed my-2 block"> {str("Feed: ")} </span>
      <table className="text-left border">
        <tr>
          <th className="text-left border p-2"> {str("Name")} </th>
          <th className="text-left border p-2"> {str("Quantity")} </th>
        </tr>
        {Js.Array.map(
          item =>
            <tr>
              <td className="text-left border p-2"> {str(CriticalCare__IOBalance.name(item))} </td>
              <td className="text-left border p-2">
                {React.float(CriticalCare__IOBalance.quantity(item))}
              </td>
            </tr>,
          CriticalCare__IOBalance.feed(ioBalance),
        )->React.array}
      </table>
    </div>
    <div>
      <span className="font-semibold leading-relaxed my-2 block"> {str("Output: ")} </span>
      <table className="text-left border">
        <tr>
          <th className="text-left border p-2"> {str("Name")} </th>
          <th className="text-left border p-2"> {str("Quantity")} </th>
        </tr>
        {Js.Array.map(
          item =>
            <tr>
              <td className="text-left border p-2"> {str(CriticalCare__IOBalance.name(item))} </td>
              <td className="text-left border p-2">
                {React.float(CriticalCare__IOBalance.quantity(item))}
              </td>
            </tr>,
          CriticalCare__IOBalance.output(ioBalance),
        )->React.array}
      </table>
    </div>
    <div className="my-2">
      <span className="font-semibold leading-relaxed"> {str("Total Intake Calculated: ")} </span>
      {switch CriticalCare__IOBalance.total_intake_calculated(ioBalance) {
      | Some(data) => React.float(data)
      | None => React.null
      }}
    </div>
    <div className="my-2">
      <span className="font-semibold leading-relaxed"> {str("Total Output Calculated: ")} </span>
      {switch CriticalCare__IOBalance.total_output_calculated(ioBalance) {
      | Some(data) => React.float(data)
      | None => React.null
      }}
    </div>
  </div>
}
