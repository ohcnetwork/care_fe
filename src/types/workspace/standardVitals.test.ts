import assert from "node:assert/strict";
import { test } from "node:test";

import type { ObservationPlotConfig } from "@/types/emr/observation/observation";

import { standardVitalRows } from "./standardVitals";

const loinc = (code: string, display: string) => ({
  system: "http://loinc.org",
  code,
  display,
});

test("default vitals keep only standard vital signs and merge SpO2 aliases", () => {
  const plots: ObservationPlotConfig = [
    {
      id: "primary-parameters",
      name: "Primary Parameters",
      groups: [
        {
          title: "Blood Pressure",
          codes: [loinc("8480-6", "Systolic"), loinc("8462-4", "Diastolic")],
        },
        { title: "Pulse", codes: [loinc("8867-4", "Pulse")] },
        { title: "Temperature", codes: [loinc("8310-5", "Temperature")] },
        { title: "GRBS", codes: [loinc("2339-0", "GRBS")] },
        { title: "Body height", codes: [loinc("3137-7", "Height")] },
        { title: "Body weight", codes: [loinc("29463-7", "Weight")] },
        {
          title: "Respiratory Rate",
          codes: [loinc("9279-1", "Respiratory Rate")],
        },
        {
          title: "SpO2",
          codes: [
            loinc("2708-6", "SpO2"),
            loinc("59408-5", "SpO2 (pulse oximetry)"),
            loinc("20564-1", "Oxygen saturation in blood"),
          ],
        },
        { title: "FiO2", codes: [loinc("3151-8", "FiO2")] },
        { title: "Girth", codes: [loinc("8280-0", "Girth")] },
      ],
    },
    {
      id: "ventilation",
      name: "Respiratory Support",
      groups: [{ title: "Resp Rate", codes: [loinc("19834-1", "RR")] }],
    },
  ];

  const rows = standardVitalRows(plots);

  assert.deepEqual(
    rows.map((row) => row.code.display),
    [
      "Systolic",
      "Diastolic",
      "Pulse",
      "Temperature",
      "Respiratory Rate",
      "SpO2",
    ],
  );
  assert.deepEqual(
    rows.at(-1)?.codes.map((code) => code.code),
    ["2708-6", "59408-5", "20564-1"],
  );
});

test("default vitals skip vitals the deployment does not chart", () => {
  const rows = standardVitalRows([
    {
      id: "primary-parameters",
      name: "Primary Parameters",
      groups: [
        { title: "Pulse", codes: [loinc("8867-4", "Heart rate")] },
        { title: "SpO2", codes: [loinc("59408-5", "SpO2")] },
        { title: "Unnamed", codes: [loinc("8310-5", "")] },
      ],
    },
  ]);

  assert.deepEqual(
    rows.map((row) => [row.code.display, row.codes.length]),
    [
      ["Heart rate", 1],
      ["SpO2", 1],
    ],
  );
  assert.deepEqual(standardVitalRows([]), []);
});
