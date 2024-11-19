import { useEffect, useRef, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { classNames } from "@/Utils/utils";

export function PrescriptionDropdown(props: {
  options: string[] | number[];
  tips?: any;
  value: string | number;
  setValue: (value: any) => void;
  placeholder?: string;
  type?: "string" | "number";
  min?: number;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
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
    <div className="relative w-full">
      <input
        type={props.type}
        placeholder={props.placeholder}
        className={`cui-input-base relative py-2 ${props.className}`}
        onClick={() => setOpen(!open)}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        min={props.min}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
      />
      <div
        ref={dropRef}
        className={classNames(
          "absolute left-0 top-[calc(100%+10px)] z-40 max-h-[300px] w-full overflow-auto rounded-md bg-white shadow-lg",
          !open && "hidden",
        )}
      >
        {options.map((option, i) => {
          return (
            <div className="flex justify-between" key={i}>
              <button
                id="frequency-interval"
                type="button"
                key={i}
                className="block w-full px-4 py-2 text-left text-sm leading-5 text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900 focus:bg-secondary-100 focus:text-secondary-900 focus:outline-none"
                onClick={() => {
                  setValue(option);
                  setOpen(false);
                }}
              >
                {option}
              </button>

              {tips && tips[option] && (
                <button
                  onClick={(event) => event.preventDefault()}
                  className="tooltip rounded px-4"
                >
                  <span className="tooltip-text tooltip-right">
                    {tips[option]}
                  </span>
                  <CareIcon icon="l-info-circle" className="text-lg" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
