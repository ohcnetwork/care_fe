import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from "@material-ui/core";
import { useEffect, useState } from "react";

function getWindowSize() {
  const { innerWidth, innerHeight } = window;
  return { innerWidth, innerHeight };
}

export default function ResponsiveMedicineTable(props: {
  theads: Array<string>;
  list: Array<any>;
  objectKeys: Array<string>;
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
      {windowSize.innerWidth > 768 ? (
        <table className="min-w-full">
          <thead>
            <tr>
              {props.theads.map((item) => {
                return (
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-800 uppercase tracking-wider">
                    {item}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {props.list.map((med: any, index: number) => (
              <tr className="bg-white" key={index}>
                {props.objectKeys.map((key, idx) => {
                  if (idx === 0)
                    return (
                      <td className="px-6 py-4 whitespace-nowrap text-sm leading-5 font-medium text-gray-900">
                        {med[key]}
                      </td>
                    );
                  else
                    return (
                      <td className="px-6 py-4 whitespace-nowrap text-sm leading-5 text-gray-900">
                        {med[key]}
                      </td>
                    );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="rounded-md shadow-sm">
          {props.list.map((med: any, index: number) => (
            <Accordion elevation={0} key={index}>
              <AccordionSummary
                className="overflow-hidden"
                expandIcon={
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
                }
                aria-controls={`panel${index + 1}a-content`}
                id={`panel${index + 1}a-header`}
              >
                <div className="flex flex-col">
                  <h4 className="font-semibold text-base">{props.theads[0]}</h4>{" "}
                  <h3 className="text-sm font-normal overflow-hidden text-ellipsis w-full">
                    {med[props.objectKeys[0]]}
                  </h3>
                </div>
              </AccordionSummary>
              <AccordionDetails className="border-t border-t-gray-400">
                <div className="flex flex-col w-full">
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {props.objectKeys.map((key, i) => {
                      if (i !== 0 && i !== props.objectKeys.length - 1)
                        return (
                          <div>
                            <h4 className="font-semibold text-base">
                              {props.theads[i]}
                            </h4>{" "}
                            <p>{med[key]}</p>
                          </div>
                        );

                      if (i === props.objectKeys.length - 1)
                        return (
                          <div className="col-span-2">
                            <h4 className="font-semibold text-base">
                              {props.theads[i]}
                            </h4>{" "}
                            <p>{med[key]}</p>
                          </div>
                        );
                    })}
                  </div>
                </div>
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      )}
    </>
  );
}
