import { Info } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Code } from "@/types/base/code/code";

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
              <div className="flex items-center justify-center space-x-1">
                <span className="text-sm font-medium">
                  {code.display || ""}
                </span>
                <Popover>
                  <PopoverTrigger>
                    <Info className="size-4 text-gray-500 hover:text-gray-700 cursor-pointer" />
                  </PopoverTrigger>
                  <PopoverContent
                    className="max-w-fit w-[calc(100vw-2rem)] sm:max-w-fit sm:w-auto break-words"
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    collisionPadding={16}
                  >
                    <div className="space-y-2">
                      <div className="text-xs">
                        {code.display} ({code.code})
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
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
