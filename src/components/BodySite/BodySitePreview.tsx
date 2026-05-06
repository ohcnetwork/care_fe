import { useState } from "react";

import BodySiteSelector3D from "@/components/BodySite/BodySiteSelector3D";

import { Code } from "@/types/base/code/code";

export default function BodySitePreview() {
  const [value, setValue] = useState<Code | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          3D Body Site Selector
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Click any region, type to search, use the view buttons to see the
          back, or navigate with the keyboard (Tab to focus, arrow keys to
          cycle, Enter to select).
        </p>

        <BodySiteSelector3D value={value} onSelect={setValue} height={640} />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-medium text-gray-900 mb-2">
              Selected SNOMED CT code
            </h2>
            {value ? (
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Display</dt>
                  <dd className="font-medium text-gray-900">{value.display}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Code</dt>
                  <dd className="font-mono text-gray-900">{value.code}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">System</dt>
                  <dd className="font-mono text-gray-700 break-all">
                    {value.system}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-500">No region selected yet.</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-medium text-gray-900 mb-2">
              Raw payload
            </h2>
            <pre className="rounded bg-gray-50 p-3 text-xs text-gray-800 overflow-auto max-h-48">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
