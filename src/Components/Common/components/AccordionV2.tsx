import React, { useState } from "react";

export default function AccordionV2(props: {
  children: JSX.Element | JSX.Element[];
  expandIcon?: JSX.Element;
  title: JSX.Element | JSX.Element[] | string;
  className?: string;
  expanded?: boolean;
}) {
  const [toggle, setToggle] = useState(props.expanded as boolean);
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
          <>{props.title}</>
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
          {props.expandIcon ? (
            props.expandIcon
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          )}
        </button>
      </div>
      <div
        className="transition-[height] ease-in-out duration-300 overflow-hidden"
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
        {props.children}
      </div>
    </div>
  );
}

// interface Props {
//   children: JSX.Element | JSX.Element[];
// }

// export class AccordionSummaryV2 extends React.Component<Props> {
//   static displayName = "AccordionSummaryV2";
//   render() {
//     return <>{this.props.children}</>;
//   }
// }
// export class AccordionDetailsV2 extends React.Component<Props> {
//   static displayName = "AccordionDetailsV2";
//   render() {
//     return <>{this.props.children}</>;
//   }
// }
