let str = React.string;

[@genType]
[@react.component]
let make = (~show, ~setShow, ~children) => {
  <Transition show={Some(show)}>
    <div className="inset-0 overflow-hidden fixed z-40">
      <div className="absolute inset-0 overflow-hidden">
        <Transition
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0">
          <div
            className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={_ => setShow(false)}
          />
        </Transition>
        <section className="absolute inset-y-0 max-w-full right-0 flex">
          <Transition
            enter="transform transition ease-in-out duration-500 sm:duration-700"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-500 sm:duration-700"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full">
            <div className="w-screen max-w-sm overflow-y-auto"> children </div>
          </Transition>
        </section>
      </div>
    </div>
  </Transition>;
};
