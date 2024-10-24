import { useRef, useState } from "react";

export default function AccordionV2(props: {
  children: JSX.Element | JSX.Element[];
  expandIcon?: JSX.Element;
  title: JSX.Element | JSX.Element[] | string;
  className?: string;
  expanded?: boolean;
}) {
  const [toggle, setToggle] = useState(props.expanded as boolean);
  const contentEl = useRef<HTMLDivElement>(null);

  return (
    <div className={props.className}>
      <div className="flex justify-between">
        <button
          type="button"
          className="grid w-full justify-start"
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
              ? "rotate-180 transition-all duration-300 ease-in-out"
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
              className="h-5 w-5"
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
        className={`transition-all duration-500 ease-in-out ${
          toggle ? "overflow-visible" : "h-0 overflow-hidden"
        }`}
        ref={contentEl}
      >
        {props.children}
      </div>
    </div>
  );
}
