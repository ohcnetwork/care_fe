type reactClass;
module Transition = {
  [@bs.module "./Transition.tsx"]
  [@react.component]
  external make:
    (
      ~show: option(bool),
      ~enter: string,
      ~enterFrom: string,
      ~enterTo: string,
      ~leave: string,
      ~leaveFrom: string,
      ~leaveTo: string,
      ~children: 'a
    ) =>
    React.element =
    "default";
};

[@react.component]
let make = (  
  ~show=None,
  ~enter="",
  ~enterFrom="",
  ~enterTo="",
  ~leave="",
  ~leaveFrom="",
  ~leaveTo="",
  ~children
) => {
  <Transition
    show
    enter
    enterFrom
    enterTo
    leave
    leaveFrom
    leaveTo
  >children</Transition>;
};