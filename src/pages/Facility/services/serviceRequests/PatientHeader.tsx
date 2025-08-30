import { Trans, useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";

import { formatPatientAge } from "@/Utils/utils";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PatientRead } from "@/types/emr/patient/patient";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";
import dayjs from "dayjs";
import { ChevronDown } from "lucide-react";
import { PatientInfoHoverCard } from "./PatientInfoHoverCard";

export function PatientHeader({
  patient,
  facilityId,
  actions,
  className,
  isPatientPage = false,
}: {
  patient: PatientRead;
  facilityId?: string;
  actions?: React.ReactNode;
  className?: string;
  isPatientPage?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Card
      className={cn(
        "p-2 rounded-none shadow-none border-none md:p-4 flex flex-col md:flex-row md:justify-between bg-transparent gap-6",
        className,
      )}
    >
      <div className="flex flex-col md:flex-row gap-4 xl:gap-8 xl:items-center">
        <Drawer>
          <DrawerTrigger
            disabled={isPatientPage}
            className="lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background "
          >
            <PatientInfoHoverCardTigger
              patient={patient}
              disabled={isPatientPage}
            />
          </DrawerTrigger>
          <DrawerContent className="flex flex-col p-4 gap-4">
            <PatientInfoHoverCard
              patient={patient}
              facilityId={facilityId || ""}
            />
          </DrawerContent>
        </Drawer>
        <Popover>
          <PopoverTrigger
            disabled={isPatientPage}
            className="hidden lg:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-10 focus-visible:ring-offset-background"
          >
            <PatientInfoHoverCardTigger
              patient={patient}
              disabled={isPatientPage}
            />
          </PopoverTrigger>
          <PopoverContent
            className="flex flex-col border border-gray-200 shadow-lg p-4 rounded-md gap-4 w-100"
            side="bottom"
            align="start"
          >
            <PatientInfoHoverCard
              patient={patient}
              facilityId={facilityId || ""}
            />
          </PopoverContent>
        </Popover>
        <div className="flex flex-wrap xl:gap-5 gap-2">
          {patient.instance_identifiers?.map((identifier) => (
            <div
              key={identifier.config.id}
              className="flex flex-col gap-1 items-start md:hidden xl:flex"
            >
              <span className="text-xs text-gray-700 md:w-auto">
                {identifier.config.config.display}:{" "}
              </span>
              <span className="text-sm font-semibold">{identifier.value}</span>
            </div>
          ))}
          {patient.instance_tags?.length > 0 && (
            <div className="flex flex-col gap-1 items-start">
              <span className="text-xs text-gray-700">
                {t("patient_tags")}:
              </span>
              <div className="flex flex-wrap gap-2 text-sm whitespace-nowrap">
                <>
                  {patient.instance_tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="capitalize"
                      title={tag.description}
                    >
                      {getTagHierarchyDisplay(tag)}
                    </Badge>
                  ))}
                </>
              </div>
            </div>
          )}
        </div>
      </div>
      {actions}
    </Card>
  );
}

const PatientInfoHoverCardTigger = ({
  patient,
  disabled = false,
}: {
  patient: PatientRead;
  disabled?: boolean;
}) => {
  const { t } = useTranslation();

  return (
    <div
      data-slot="patient-info-hover-card-trigger"
      className={cn(
        "flex w-fit gap-3 items-center rounded-md ",
        !disabled && "hover:bg-gray-50 active:bg-gray-50 cursor-pointer",
      )}
    >
      <div className="size-12">
        <Avatar name={patient.name} />
      </div>

      <div className="flex flex-col">
        <div className="flex flex-row gap-2 items-center">
          <h5
            className={cn(
              "text-lg font-semibold whitespace-nowrap",
              !disabled && "underline",
            )}
          >
            {patient.name}
          </h5>
          {!disabled && <ChevronDown size={16} />}
        </div>
        <span className="flex flex-start text-gray-700">
          {formatPatientAge(patient, true)}, {t(`GENDER__${patient.gender}`)}
        </span>
      </div>
    </div>
  );
};

export const PatientDeceasedInfo = ({ patient }: { patient: PatientRead }) => {
  const { t } = useTranslation();

  if (!patient.deceased_datetime) return null;

  return (
    <Card className="p-2 items-center rounded-sm shadow-sm border-red-400 bg-red-100 md:p-4 flex flex-wrap justify-center gap-4">
      <Badge variant="danger" className="rounded-sm items-center px-1.5">
        {t("deceased")}
      </Badge>
      <div className="text-sm font-semibold text-red-950">
        <Trans
          i18nKey="passed_away_on"
          values={{
            date: dayjs(patient.deceased_datetime).format("MMMM DD, YYYY"),
            time: dayjs(patient.deceased_datetime).format("hh:mm A"),
          }}
        ></Trans>
      </div>
    </Card>
  );
};
