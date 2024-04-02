type reactClass
module DialogModal = {
  @module("./Dialog.tsx") @react.component
  external make: (
    ~title: React.element,
    ~show: bool,
    ~onClose: unit => unit,
    ~className: string,
    ~children: React.element,
  ) => React.element = "default"
}

@react.component
let make = (
  ~title: React.element,
  ~show: bool,
  ~onClose: unit => unit,
  ~className: string,
  ~children: React.element,
) => <DialogModal title show onClose className> {children} </DialogModal>