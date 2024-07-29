let str = React.string
open CriticalCare__Types

@react.component
let make = (~pressureSoreParameter) => {
  <table
    className="text-left px-4 py-2 border bg-secondary-100 m-1 rounded-lg shadow md:w-1/2 w-full">
    <tr>
      <th className="text-left border p-2 w-1/2"> {str("Part")} </th>
      <th> {str("Push Score")} </th>
    </tr>
    {Js.Array.map(pressure => {
      <tr>
        <td className="text-left border p-2 w-1/2">
          {str(PressureSore.regionToString(PressureSore.region(pressure)))}
        </td>
        <td className="text-left border p-2 w-1/2">
          {React.float(PressureSore.calculateScore(pressure))}
        </td>
      </tr>
    }, pressureSoreParameter)->React.array}
  </table>
}
