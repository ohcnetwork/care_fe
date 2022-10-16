import React from "react";

export default function CollapseV2(props: {
  children: JSX.Element | JSX.Element[];
  opened: boolean;
  className?: string;
}) {
  const content = React.useRef<HTMLDivElement>(null);

  return (
    <div
      className={`transition-[height] ease-in-out duration-300 overflow-hidden ${props.className}`}
      ref={content}
      style={
        props.opened
          ? {
              height: content.current ? content.current.scrollHeight : "0px",
            }
          : { height: "0px" }
      }
    >
      {props.children}
    </div>
  );
}
