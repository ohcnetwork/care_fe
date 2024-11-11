import { useEffect, useRef, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { classNames } from "@/Utils/utils";

export function PrescriptionMultiDropdown(props: {
  options: string[];
  selectedValues: string[];
  setSelectedValues: (value: any) => void;
  placeholder?: string;
  type?: "string" | "number";
  min?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const { options, selectedValues, setSelectedValues } = props;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

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
      <div className="my-2 flex flex-wrap gap-1">
        {selectedValues.length > 0 &&
          selectedValues.map((selectedValue, i) => {
            return (
              <div
                key={i}
                className="inline-flex gap-2 rounded-lg border border-primary-600 bg-primary-100 px-3 py-1 text-primary-900"
              >
                {selectedValue}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedValues(
                      selectedValues.filter((v) => v !== selectedValue),
                    );
                  }}
                >
                  <CareIcon icon="l-times" className="text-lg" />
                </button>
              </div>
            );
          })}
      </div>

      <input
        placeholder={props.placeholder}
        className="cui-input-base py-2"
        onClick={() => setOpen(!open)}
        value={value}
        onChange={(e) => setValue(e.target.value)}
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
        {options
          .filter((o) => o.toLowerCase().includes(value.toLowerCase()))
          .map((option, i) => {
            return (
              <button
                type="button"
                id="investigation-group"
                key={i}
                className={classNames(
                  "block w-full px-4 py-2 text-left text-sm leading-5 text-secondary-700 hover:text-secondary-900 focus:text-secondary-900 focus:outline-none",
                  selectedValues.includes(option)
                    ? "bg-primary-100 hover:bg-primary-200"
                    : "hover:bg-secondary-100 focus:bg-secondary-100",
                )}
                onClick={() => {
                  setSelectedValues(
                    selectedValues.includes(option)
                      ? selectedValues.filter((v) => v !== option)
                      : [...selectedValues, option],
                  );
                }}
              >
                {option}
              </button>
            );
          })}
      </div>
    </div>
  );
}
