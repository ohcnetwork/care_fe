import { useState } from "react";

export default function ReadMore(props: { text: string; minChars: number }) {
  const [isExpanded, setExpanded] = useState(false);
  return (
    <>
      <div className="relative">
        <div>
          <p className="break-words">
            {!isExpanded && props.text.length > props.minChars
              ? props.text.slice(0, props.minChars) + "..."
              : props.text}
          </p>
        </div>
        {props.text.length > props.minChars && (
          <div
            className={
              isExpanded
                ? "absolute bottom-0 h-16 w-full"
                : "absolute bottom-0 h-16 w-full bg-gradient-to-t from-white"
            }
          ></div>
        )}
      </div>
      {props.text.length > props.minChars && (
        <button
          className="m-0 w-full bg-white p-0 text-left font-bold text-blue-500"
          onClick={(_) => setExpanded(!isExpanded)}
        >
          {isExpanded ? "Read Less" : "Read More"}
        </button>
      )}
    </>
  );
}
