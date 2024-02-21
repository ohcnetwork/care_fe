type reactClass
module CareIcon = {
  @module("../../CAREUI/icons/CareIcon.tsx") @react.component
  external make: (
        ~icon: option<string>, 
        ~className: option<string>, 
        ~onClick: option<ReactEvent.Mouse.t => unit>, 
        ~id: option<string>
    ) => React.element = "default"
}

@react.component
let make = (
    ~icon = ?,
    ~className = ?,
    ~onClick = ?,
    ~id = ?,
) => <CareIcon icon className onClick id />

