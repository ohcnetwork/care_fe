import { useState } from "react";

import BodySiteSelector3D from "@/components/BodySite/BodySiteSelector3D";
import { ClinicalUseCase } from "@/components/BodySite/bodySiteRegions";

import { Code } from "@/types/base/code/code";

type Demo = "single" | "multi" | "im-injection";

export default function BodySitePreview() {
  const [demo, setDemo] = useState<Demo>("single");
  const [singleValue, setSingleValue] = useState<Code | null>(null);
  const [multiValue, setMultiValue] = useState<Code[]>([]);
  const [injectionValue, setInjectionValue] = useState<Code | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Body Site Selector
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          Click any region, type to search, switch between 2D and 3D, or
          navigate with the keyboard (Tab to focus, arrow keys to cycle, Enter
          to select).
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["single", "Single select"],
              ["multi", "Multi-select (wound mapping)"],
              ["im-injection", "IM injection sites only"],
            ] as Array<[Demo, string]>
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setDemo(k)}
              className={
                "rounded-md border px-3 py-1.5 text-xs font-medium " +
                (demo === k
                  ? "bg-sky-600 text-white border-sky-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {demo === "single" && (
          <BodySiteSelector3D
            value={singleValue}
            onSelect={setSingleValue}
            height={640}
          />
        )}
        {demo === "multi" && (
          <BodySiteSelector3D
            multiple
            value={multiValue}
            onSelect={setMultiValue}
            height={640}
          />
        )}
        {demo === "im-injection" && (
          <BodySiteSelector3D
            value={injectionValue}
            onSelect={setInjectionValue}
            useCase={"im-injection" as ClinicalUseCase}
            height={640}
          />
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-medium text-gray-900 mb-2">
              Selected SNOMED CT code
            </h2>
            <pre className="rounded bg-gray-50 p-3 text-xs text-gray-800 overflow-auto max-h-64">
              {JSON.stringify(
                demo === "single"
                  ? singleValue
                  : demo === "multi"
                    ? multiValue
                    : injectionValue,
                null,
                2,
              )}
            </pre>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-medium text-gray-900 mb-2">Tips</h2>
            <ul className="text-sm text-gray-700 space-y-1.5 list-disc pl-4">
              <li>2D mode is default — faster on low-end devices</li>
              <li>3D mode rotates with drag, scroll to zoom</li>
              <li>Type a region name (RUQ, deltoid, biceps) to find it fast</li>
              <li>Multi-select: click again to deselect</li>
              <li>Mode preference persists across page loads</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
