let str = React.string
open CriticalCare__Types

@react.component
let make = (~painParameter) => {
  <table
    className="text-left px-4 py-2 border bg-secondary-100 m-1 rounded-lg shadow md:w-1/2 w-full">
    <tr>
      <th className="text-left border p-2 w-1/2"> {str("Part")} </th>
      <th> {str("Scale")} </th>
    </tr>
    {Js.Array.map(pain => {
      <tr>
        <td className="text-left border p-2 w-1/2">
          {str(Pain.regionToString(Pain.region(pain)))}
        </td>
        <td className="text-left border p-2 w-1/2"> {React.int(Pain.scale(pain))} </td>
      </tr>
    }, painParameter)->React.array}
  </table>
}
