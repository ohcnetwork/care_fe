import { useEffect, useRef, useState } from "react";

export default function CollapseV2(props: {
  children: JSX.Element | JSX.Element[];
  opened: boolean;
  className?: string;
}) {
  const content = useRef<HTMLDivElement>(null);
  const [innerDivState, setInnerDivState] = useState(false);
  const [outerDivState, setOuterDivState] = useState(false);

  useEffect(() => {
    if (props.opened) {
      setOuterDivState(props.opened);
      setTimeout(() => {
        setInnerDivState(props.opened);
      }, 1);
    } else {
      setInnerDivState(props.opened);
      setTimeout(() => {
        setOuterDivState(props.opened);
      }, 300);
    }
  }, [props.opened]);

  return (
    <div
      className="transition-all duration-300 ease-in-out"
      style={
        outerDivState
          ? {
              display: "block",
            }
          : { display: "none" }
      }
    >
      <div
        className={`transition-all duration-300 ease-in-out ${
          props.className ? props.className : ""
        }`}
        ref={content}
        style={
          innerDivState
            ? {
                maxHeight: content.current?.scrollHeight,
              }
            : { maxHeight: "0px" }
        }
      >
        {props.children}
      </div>
    </div>
  );
}
