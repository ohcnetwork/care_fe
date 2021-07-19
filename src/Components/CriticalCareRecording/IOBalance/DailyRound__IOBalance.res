let str = React.string
open CriticalCare__Types

@react.component
let make = (~ioBalance, ~title, ~renderOptionalDescription) => {
  <div>
    <div>
      {title("Infusions")}
      <table
        className="text-left px-4 py-2 border bg-gray-100 m-1 rounded-lg shadow md:w-1/2 w-full">
        <tr>
          <th className="text-left border p-2 w-1/2"> {str("Name")} </th>
          <th className="text-left border p-2 w-1/2"> {str("Quantity")} </th>
        </tr>
        {Js.Array.map(
          item =>
            <tr>
              <td className="text-left border p-2 w-1/2"> {str(IOBalance.name(item))} </td>
              <td className="text-left border p-2 w-1/2">
                {React.float(IOBalance.quantity(item))}
              </td>
            </tr>,
          IOBalance.infusions(ioBalance),
        )->React.array}
      </table>
    </div>
    <div>
      {title("IV Fluid")}
      <table
        className="text-left px-4 py-2 border bg-gray-100 m-1 rounded-lg shadow md:w-1/2 w-full">
        <tr>
          <th className="text-left border p-2 w-1/2"> {str("Name")} </th>
          <th className="text-left border p-2 w-1/2"> {str("Quantity")} </th>
        </tr>
        {Js.Array.map(
          item =>
            <tr>
              <td className="text-left border p-2 w-1/2"> {str(IOBalance.name(item))} </td>
              <td className="text-left border p-2 w-1/2">
                {React.float(IOBalance.quantity(item))}
              </td>
            </tr>,
          IOBalance.ivFluid(ioBalance),
        )->React.array}
      </table>
    </div>
    <div>
      {title("Feed")}
      <table
        className="text-left px-4 py-2 border bg-gray-100 m-1 rounded-lg shadow md:w-1/2 w-full">
        <tr>
          <th className="text-left border p-2 w-1/2"> {str("Name")} </th>
          <th className="text-left border p-2 w-1/2"> {str("Quantity")} </th>
        </tr>
        {Js.Array.map(
          item =>
            <tr>
              <td className="text-left border p-2 w-1/2"> {str(IOBalance.name(item))} </td>
              <td className="text-left border p-2 w-1/2">
                {React.float(IOBalance.quantity(item))}
              </td>
            </tr>,
          IOBalance.feed(ioBalance),
        )->React.array}
      </table>
    </div>
    <div>
      {title("Output")}
      <table
        className="text-left px-4 py-2 border bg-gray-100 m-1 rounded-lg shadow md:w-1/2 w-full">
        <tr>
          <th className="text-left border p-2 w-1/2"> {str("Name")} </th>
          <th className="text-left border p-2 w-1/2"> {str("Quantity")} </th>
        </tr>
        {Js.Array.map(
          item =>
            <tr>
              <td className="text-left border p-2 w-1/2"> {str(IOBalance.name(item))} </td>
              <td className="text-left border p-2 w-1/2">
                {React.float(IOBalance.quantity(item))}
              </td>
            </tr>,
          IOBalance.output(ioBalance),
        )->React.array}
      </table>
    </div>
    {renderOptionalDescription(
      "Total Intake Calculated",
      IOBalance.total_intake_calculated(ioBalance),
    )}
    {renderOptionalDescription(
      "Total Output Calculated",
      IOBalance.total_output_calculated(ioBalance),
    )}
  </div>
}
