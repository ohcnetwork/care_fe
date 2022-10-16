import React, { useState } from "react";

export default function AccordionTW(props: {
  children: JSX.Element[];
  expandIcon: JSX.Element;
  className?: string;
}) {
  const [toggle, setToggle] = useState(false);
  const contentEl = React.useRef<HTMLDivElement>(null);

  return (
    <div className={props.className}>
      <div className="flex justify-between">
        <button
          type="button"
          className="w-full grid justify-start"
          onClick={() => {
            setToggle((prev) => !prev);
          }}
        >
          {React.Children.map(props.children, (child) => {
            if (child.type.displayName === "AccordionSummaryTW") {
              return child;
            }
          })}
        </button>
        <button
          type="button"
          className={
            toggle
              ? "transition-all rotate-180 duration-300 ease-in-out"
              : "transition"
          }
          onClick={() => {
            setToggle((prev) => !prev);
          }}
        >
          {props.expandIcon}
        </button>
      </div>
      <div
        className="transition-all ease-in-out duration-300 overflow-hidden"
        ref={contentEl}
        style={
          toggle
            ? {
                height: contentEl.current
                  ? contentEl.current.scrollHeight
                  : "0px",
              }
            : { height: "0px" }
        }
      >
        {React.Children.map(props.children, (child) => {
          if (child.type.displayName === "AccordionDetailsTW") {
            return child;
          }
        })}
      </div>
    </div>
  );
}

interface Props {
  children: JSX.Element | JSX.Element[];
}

export class AccordionSummaryTW extends React.Component<Props> {
  static displayName = "AccordionSummaryTW";
  render() {
    return <>{this.props.children}</>;
  }
}
export class AccordionDetailsTW extends React.Component<Props> {
  static displayName = "AccordionDetailsTW";
  render() {
    return <>{this.props.children}</>;
  }
}
