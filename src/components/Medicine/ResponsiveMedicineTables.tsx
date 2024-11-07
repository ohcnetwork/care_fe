import { useEffect, useState } from "react";

import AccordionV2 from "@/components/Common/AccordionV2";

import { classNames } from "@/Utils/utils";

function getWindowSize() {
  const { innerWidth, innerHeight } = window;
  return { innerWidth, innerHeight };
}

export default function ResponsiveMedicineTable(props: {
  theads: Array<string>;
  list: Array<any>;
  objectKeys: Array<string>;
  fieldsToDisplay: Array<number>;
  actions?: (item: any) => JSX.Element;
  actionLabel?: string;
  maxWidthColumn?: number;
  onClick?: (item: any) => void;
}) {
  const [windowSize, setWindowSize] = useState(getWindowSize());
  useEffect(() => {
    function handleWindowResize() {
      setWindowSize(getWindowSize());
    }

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);
  return (
    <>
      {windowSize.innerWidth > 1024 ? (
        <table className="min-w-full">
          <thead>
            <tr>
              {props.theads.map((item) => {
                return (
                  <th className="whitespace-nowrap border-b border-secondary-200 bg-secondary-50 px-6 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wider text-secondary-800">
                    {item}
                  </th>
                );
              })}
              {props.actions && (
                <th className="border-b border-secondary-200 bg-secondary-50 px-6 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wider text-secondary-800">
                  {props.actionLabel || ""}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {props.list?.map?.((med: any, index: number) => (
              <tr
                className={classNames(
                  "bg-white",
                  props.onClick && "cursor-pointer hover:bg-secondary-200",
                )}
                key={index}
                onClick={() => props.onClick && props.onClick(med)}
              >
                {props.objectKeys.map((key, idx) => {
                  if (
                    props.maxWidthColumn !== undefined &&
                    idx === props.maxWidthColumn
                  ) {
                    return (
                      <td className="w-full px-6 py-4 text-sm font-medium leading-5 text-secondary-900">
                        {med[key]}
                      </td>
                    );
                  }

                  return (
                    <td className="px-6 py-4 text-sm leading-5 text-secondary-900">
                      {med[key]}
                    </td>
                  );
                })}
                {props.actions && (
                  <td className="px-6">{props.actions(med)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="rounded-md shadow-sm">
          {props.list?.map?.((med: any, index: number) => (
            <AccordionV2
              title={
                <div className="grid">
                  <div className="flex flex-col">
                    <h3 className="w-full overflow-hidden text-ellipsis text-left text-sm font-medium">
                      {med[props.objectKeys[0]]}
                    </h3>
                  </div>
                  <div className="mt-2 flex w-full gap-[160px]">
                    {props.fieldsToDisplay?.map((i) => (
                      <div>
                        <h4 className="text-base font-semibold">
                          {props.theads[i]}
                        </h4>
                        {med[props.objectKeys[i]]}
                      </div>
                    ))}
                  </div>
                </div>
              }
              className={
                props.list.length - 1 === index
                  ? "bg-white p-5"
                  : "border-b border-b-secondary-400 bg-white p-5"
              }
              key={index}
            >
              <div className="mt-3 flex w-full flex-col border-t border-t-secondary-400">
                <div className="mt-3 grid w-full grid-cols-2 gap-3">
                  {props.objectKeys.map((key, i) => {
                    if (i !== 0 && i !== props.objectKeys.length - 1)
                      return (
                        <div>
                          <h4 className="text-base font-semibold">
                            {props.theads[i]}
                          </h4>{" "}
                          <p>{med[key]}</p>
                        </div>
                      );

                    if (i === props.objectKeys.length - 1)
                      return (
                        <div className="col-span-2">
                          <h4 className="text-base font-semibold">
                            {props.theads[i]}
                          </h4>{" "}
                          <p>{med[key]}</p>
                        </div>
                      );
                  })}
                </div>
              </div>
            </AccordionV2>
          ))}
        </div>
      )}
    </>
  );
}
