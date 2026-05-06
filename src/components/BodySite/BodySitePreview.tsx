import { useState } from "react";

import BodySiteSelector3D from "@/components/BodySite/BodySiteSelector3D";

import { Code } from "@/types/base/code/code";

export default function BodySitePreview() {
  const [value, setValue] = useState<Code | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          3D Body Site Selector — Preview
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Drag to rotate. Scroll to zoom. Click a region to select.
        </p>
        <BodySiteSelector3D value={value} onSelect={setValue} height={640} />
        <pre className="mt-4 rounded-md bg-white p-4 text-xs text-gray-800 shadow-sm overflow-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    </div>
  );
}
