import dayjs from "dayjs";
import { ChevronRight } from "lucide-react";
import { Link } from "raviger";

import { cn } from "@/lib/utils";

import { formatName } from "@/Utils/utils";
import { PrescritionList } from "@/types/emr/prescription/prescription";

export function PrescriptionRow({
  prescription,
  className,
}: {
  prescription: PrescritionList;
  className?: string;
}) {
  return (
    <Link
      href={`/patient/records/prescriptions/${prescription.id}`}
      className={cn(
        "flex items-center gap-2.5 rounded-2xl border bg-white p-4 hover:border-gray-300",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-bold text-gray-900">
          {formatName(prescription.prescribed_by)}
        </span>
        <span className="truncate text-xs text-gray-600">
          {[
            dayjs(prescription.created_date).format("DD MMM YYYY"),
            prescription.encounter?.facility?.name,
            prescription.name,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
      <ChevronRight
        className="size-4.25 shrink-0 text-gray-600"
        strokeWidth={2.1}
        aria-hidden
      />
    </Link>
  );
}
