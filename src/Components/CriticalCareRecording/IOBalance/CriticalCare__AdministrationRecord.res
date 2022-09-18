module AdministrationRecord = {
  @react.component @module("./AdministrationRecord")
  external make: (
    ~items: array<CriticalCare__Types.IOBalance.item>,
    ~setItems: Js.Array.t<CriticalCare__Types.IOBalance.item> => unit,
    ~consultationID: string,
  ) => React.element = "default"
}

@react.component
let make = (~items, ~setItems, ~consultationID) =>
  <AdministrationRecord items={items} setItems={setItems} consultationID={consultationID} />
