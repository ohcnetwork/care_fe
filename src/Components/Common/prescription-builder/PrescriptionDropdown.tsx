import { useEffect, useRef, useState } from "react";
import { Tooltip } from "@material-ui/core";
import { classNames } from "../../../Utils/utils";

export function PrescriptionDropdown(props: {
  options: string[] | number[];
  tips?: any;
  value: string | number;
  setValue: (value: any) => void;
  placeholder?: string;
  type?: "string" | "number";
  min?: number;
  className?: string;
}) {
  const { options, tips, value, setValue } = props;
  const [open, setOpen] = useState(false);

  function useOutsideAlerter(ref: any) {
    useEffect(() => {
      function handleClickOutside(event: any) {
        if (ref.current && !ref.current.contains(event.target)) {
          setOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref]);
  }

  const dropRef = useRef(null);
  useOutsideAlerter(dropRef);

  return (
    <div className="w-full relative">
      <input
        type={props.type}
        placeholder={props.placeholder}
        className={
          "w-full relative focus:ring-primary-500 focus:border-primary-500 border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white " +
          (props.className || "")
        }
        onClick={() => setOpen(!open)}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        min={props.min}
      />
      <div
        ref={dropRef}
        className={classNames(
          "absolute z-40 top-[calc(100%+10px)] left-0 w-full rounded-md shadow-lg bg-white max-h-[300px] overflow-auto",
          !open && "hidden"
        )}
      >
        {options.map((option, i) => {
          return (
            <div className="flex justify-between">
              <button
                type="button"
                key={i}
                className="w-full block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900"
                onClick={() => {
                  setValue(option);
                  setOpen(false);
                }}
              >
                {option}
              </button>

              {tips && tips[option] && (
                <Tooltip
                  title={
                    <span className="text-sm font-semibold">
                      {tips[option]}
                    </span>
                  }
                  placement="right-start"
                  arrow
                  onClick={(event) => event.stopPropagation()}
                  enterTouchDelay={0}
                >
                  <button
                    onClick={(event) => event.preventDefault()}
                    className="rounded px-4"
                  >
                    <i className="fa-solid fa-circle-info"></i>
                  </button>
                </Tooltip>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
