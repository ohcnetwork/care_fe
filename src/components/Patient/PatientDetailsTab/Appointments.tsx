import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PatientProps } from "@/components/Patient/PatientDetailsTab";

import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";
import useFilters from "@/hooks/useFilters";
import { APPOINTMENT_STATUS_COLORS } from "@/types/scheduling/schedule";
import scheduleApi from "@/types/scheduling/scheduleApi";
import { MoreVertical } from "lucide-react";

export const Appointments = (props: PatientProps) => {
  const { patientData, facilityId } = props;
  const patientId = patientData.id;
  const { t } = useTranslation();

  const { qParams, Pagination, resultsPerPage } = useFilters({
    disableCache: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["patient-appointments", patientId, qParams],
    queryFn: query(scheduleApi.appointments.getAppointments, {
      pathParams: { patientId },
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
      },
    }),
  });

  const appointments = data?.results;
  const page = qParams.page ?? 1;
  const startIndex = (page - 1) * resultsPerPage;
  const totalColumns = facilityId ? 6 : 4;

  return (
    <div className="mt-4 px-3 md:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h2 className="text-2xl font-semibold leading-tight text-center sm:text-left">
          {t("appointments")}
        </h2>
        {facilityId && (
          <Button variant="outline_primary" asChild>
            <Link
              href={`/facility/${facilityId}/patient/${patientId}/book-appointment`}
              className="flex items-center justify-center w-full sm:w-auto"
            >
              <CareIcon icon="l-plus" className="mr-2" />
              {t("schedule_appointment")}
            </Link>
          </Button>
        )}
      </div>

      <div className="">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="bg-gray-200 !border-b-10 border-gray-50">
              <TableHead className="w-10 rounded-tl-md text-center border-r-2 border-gray-50">
                #
              </TableHead>
              <TableHead className="text-left border-r-2 border-gray-50">
                {t("appointment_type")}
              </TableHead>
              <TableHead className="text-center border-r-2 border-gray-50">
                {t("date_and_time")}
              </TableHead>
              <TableHead className="text-center border-r-2 border-gray-50">
                {t("status")}
              </TableHead>
              <TableHead className="text-center rounded-tr-md">
                {t("settings")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={totalColumns} className="text-center py-4">
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : appointments && appointments.length ? (
              [...appointments, ...appointments, ...appointments].map(
                (appointment, index) => (
                  <TableRow
                    key={appointment.id}
                    className="border-b-10 border-gray-50 bg-white"
                  >
                    <TableCell className="rounded-l-md p-4 text-center text-muted-foreground border-r-2 border-gray-50">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="p-4 text-center font-medium flex items-center justify-between border-r-2 border-gray-50">
                      <Link
                        href={`/facility/${facilityId}/patient/${patientData.id}/appointments/${appointment.id}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {appointment.token_slot.availability.name}
                      </Link>
                      {facilityId && (
                        <Button variant="outline" asChild>
                          <Link
                            href={`/facility/${facilityId}/patient/${patientData.id}/appointments/${appointment.id}`}
                          >
                            {t("view_details")}
                          </Link>
                        </Button>
                      )}
                    </TableCell>

                    <TableCell className="p-4 text-center border-r-2 border-gray-50">
                      {formatDateTime(appointment.token_slot.start_datetime)}
                    </TableCell>
                    <TableCell className="p-4 text-center border-r-2 border-gray-50">
                      <Badge
                        variant={APPOINTMENT_STATUS_COLORS[appointment.status]}
                      >
                        {t(appointment.status)}
                      </Badge>
                    </TableCell>

                    <TableCell className="rounded-r-md p-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="size-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {facilityId && (
                            <DropdownMenuItem>
                              <Link
                                href={`/facility/${facilityId}/patient/${patientData.id}/appointments/${appointment.id}`}
                              >
                                {t("view")}
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ),
              )
            ) : (
              <TableRow>
                <TableCell colSpan={totalColumns} className="text-center py-4">
                  {t("no_appointments")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Pagination totalCount={data?.count ?? 0} />
      </div>
    </div>
  );
};
