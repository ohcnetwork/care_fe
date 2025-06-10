import { useTranslation } from "react-i18next";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VitalsObservation {
  value: string | undefined;
  unit: string | undefined;
}
interface VitalsTableProps {
  vitals: {
    bodyTemperature: VitalsObservation;
    heartRate: VitalsObservation;
    diastolicBloodPressure: VitalsObservation;
    systolicBloodPressure: VitalsObservation;
    oxygenSaturation: VitalsObservation;
    respiratoryRate: VitalsObservation;
  }[];
}

export function VitalsTable({ vitals }: VitalsTableProps) {
  const { t } = useTranslation();
  const getVitalValue = (
    vital: VitalsTableProps["vitals"][number],
    field: keyof VitalsTableProps["vitals"][number],
  ) => {
    return vital[field]?.value
      ? `${vital[field].value} ${vital[field].unit || ""}`
      : "-";
  };
  return (
    <Table className="border-separate border-spacing-y-0.5">
      <TableHeader>
        <TableRow className="rounded-md overflow-hidden bg-gray-100">
          <TableHead className="h-auto  py-1 px-2  text-gray-600 text-center">
            {t("temperature")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600 text-center">
            {t("heart_rate")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600 text-center">
            {t("systolic_blood_pressure")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600 text-center">
            {t("diastolic_blood_pressure")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600 text-center">
            {t("oxygen_saturation")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600 text-center">
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
            <TableCell className="font-medium text-center">
              {getVitalValue(vital, "bodyTemperature")}
            </TableCell>
            <TableCell className="font-medium text-center">
              {getVitalValue(vital, "heartRate")}
            </TableCell>
            <TableCell className="font-medium text-center">
              {getVitalValue(vital, "systolicBloodPressure")}
            </TableCell>
            <TableCell className="font-medium text-center">
              {getVitalValue(vital, "diastolicBloodPressure")}
            </TableCell>
            <TableCell className="font-medium text-center">
              {getVitalValue(vital, "oxygenSaturation")}
            </TableCell>
            <TableCell className="font-medium text-center">
              {getVitalValue(vital, "respiratoryRate")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
