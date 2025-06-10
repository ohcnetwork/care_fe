import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Code } from "@/types/questionnaire/code";

export interface VitalsObservation {
  value: string | undefined;
  unit: string | undefined;
}
interface VitalsTableProps {
  vitals: Record<string, VitalsObservation>[];
  vitalCodes?: Code[];
}

export function VitalsTable({ vitals, vitalCodes }: VitalsTableProps) {
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
          {vitalCodes?.map((code) => (
            <TableHead
              key={code.code}
              className="h-auto  py-1 px-2  text-gray-600 text-center"
            >
              {code.display || ""}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {vitals.map((vital, idx) => (
          <TableRow
            className={`rounded-md overflow-hidden bg-gray-50`}
            key={idx}
          >
            {vitalCodes?.map((code) => (
              <TableCell key={code.code} className="font-medium text-center">
                {getVitalValue(vital, code.display || "")}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
