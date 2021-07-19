let str = React.string
open CriticalCare__Types

@react.component
let make = (~nursingCare, ~renderLine) => {
  <div> {Js.Array.map(nursing => {
      renderLine(
        NursingCare.procedureString(NursingCare.procedure(nursing)),
        NursingCare.description(nursing),
      )
    }, nursingCare)->React.array} </div>
}
