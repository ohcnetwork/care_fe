import { Fragment } from "react/jsx-runtime";

import { HumanBodyPaths, HumanBodyRegion } from "@/common/constants";

type Props = {
  regionColor: (region: HumanBodyRegion) => string;
  regionLabelClassName: (region: HumanBodyRegion) => string;
  regionText: (region: HumanBodyRegion) => string;
  onPartSelect: (region: HumanBodyRegion) => void;
};

export default function HumanBodyChart({
  regionLabelClassName,
  regionColor,
  regionText,
  onPartSelect,
}: Props) {
  const getTitle = (text: string) => text.split(/(?=[A-Z])/).join(" ");

  return (
    <div className="relative flex flex-col items-start gap-2 lg:flex-row">
      {[HumanBodyPaths.anterior, HumanBodyPaths.posterior].map((paths, i) => (
        <div
          className="flex flex-1 flex-col gap-4 rounded-xl border-2 border-secondary-300 p-2"
          key={i}
        >
          <h2 className="text-center text-xl font-bold">
            {i === 0 ? "Front" : "Back"}
          </h2>
          <div className="flex flex-wrap justify-center gap-2 border-b-2 border-secondary-200 py-4">
            {paths.map((path, j) => (
              <button
                key={j}
                className={`px-2 py-1 text-sm ${regionLabelClassName(path.region)} rounded-md transition-all hover:border-red-300 hover:bg-red-200`}
                onClick={() => onPartSelect(path.region)}
              >
                {getTitle(
                  `${path.region}`.replace(
                    new RegExp(Object.keys(HumanBodyPaths)[i], "i"),
                    "",
                  ),
                )}
                {parseInt(regionText(path.region))
                  ? ` | ${regionText(path.region)}`
                  : null}
              </button>
            ))}
          </div>
          <svg
            className="h-screen py-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 344.7 932.661"
          >
            {paths.map((path, j) => {
              const value = regionText(path.region);
              return (
                <Fragment key={j}>
                  {value && (
                    <text
                      offset="50%"
                      textAnchor="middle"
                      transform={path.transform}
                      fill="white"
                      className="text-4xl font-black"
                    >
                      {value}
                    </text>
                  )}
                  <path
                    d={path.d}
                    //ref={pathRef}
                    transform={path.transform}
                    className={
                      "cursor-pointer transition-all hover:fill-red-300"
                    }
                    style={{ fill: regionColor(path.region) }}
                    fill="currentColor"
                    id={`pain-chart-${path.region}`}
                    onClick={() => onPartSelect(path.region)}
                  >
                    <title> {getTitle(path.region)} </title>
                  </path>
                </Fragment>
              );
            })}
          </svg>
        </div>
      ))}
    </div>
  );
}
