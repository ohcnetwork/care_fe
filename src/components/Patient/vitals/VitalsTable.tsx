import { t } from "i18next";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VitalsTableProps {
  vitals: {
    bodyTemperature: string | undefined;
    heartRate: string | undefined;
    diastolicBloodPressure: string | undefined;
    systolicBloodPressure: string | undefined;
    oxygenSaturation: string | undefined;
    respiratoryRate: string | undefined;
  }[];
}

export function VitalsTable({ vitals }: VitalsTableProps) {
  return (
    <Table className="border-separate border-spacing-y-0.5">
      <TableHeader>
        <TableRow className="rounded-md overflow-hidden bg-gray-100">
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("temperature")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("heart_rate")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("diastolic_blood_pressure")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("systolic_blood_pressure")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("oxygen_saturation")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("respiratory_rate")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vitals.map((vital, idx) => (
          <TableRow
            className={`rounded-md overflow-hidden bg-gray-50`}
            key={idx}
          >
            <TableCell className="font-medium ">
              {vital.bodyTemperature}
            </TableCell>
            <TableCell className="font-medium">{vital.heartRate}</TableCell>
            <TableCell className="font-medium">
              {vital.diastolicBloodPressure}
            </TableCell>
            <TableCell className="font-medium">
              {vital.systolicBloodPressure}
            </TableCell>
            <TableCell className="font-medium">
              {vital.oxygenSaturation}
            </TableCell>
            <TableCell className="font-medium">
              {vital.respiratoryRate}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
