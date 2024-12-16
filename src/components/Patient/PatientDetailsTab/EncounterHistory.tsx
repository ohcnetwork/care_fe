import { Link } from "raviger";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import PaginatedList from "@/CAREUI/misc/PaginatedList";

import { Button } from "@/components/ui/button";

import CircularProgress from "@/components/Common/CircularProgress";
import Loading from "@/components/Common/Loading";
import { ConsultationCard } from "@/components/Facility/ConsultationCard";
import { ConsultationModel } from "@/components/Facility/models";

import useAuthUser from "@/hooks/useAuthUser";

import { triggerGoal } from "@/Integrations/Plausible";
import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

import { PatientProps } from ".";
import { PatientModel } from "../models";

const EncounterHistory = (props: PatientProps) => {
  const { patientData: initialPatientData, facilityId, id } = props;
  const [patientData, setPatientData] =
    useState<PatientModel>(initialPatientData);
  const authUser = useAuthUser();

  useEffect(() => {
    setPatientData(initialPatientData);
  }, [initialPatientData]);

  const { t } = useTranslation();

  const { loading: isLoading, refetch } = useTanStackQueryInstead(
    routes.getPatient,
    {
      pathParams: {
        id,
      },
      onResponse: ({ res, data }) => {
        if (res?.ok && data) {
          setPatientData(data);
        }
        triggerGoal("Patient Profile Viewed", {
          facilityId: facilityId,
          userId: authUser.id,
        });
      },
    },
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <PaginatedList
      route={routes.getConsultationList}
      query={{ patient: id }}
      perPage={5}
    >
      {(_) => (
        <div className="mt-8">
          <PaginatedList.WhenLoading>
            <CircularProgress />
          </PaginatedList.WhenLoading>
          <PaginatedList.WhenEmpty className="py-2">
            <div className="h-full space-y-2 rounded-lg bg-white px-7 py-12 border border-secondary-300">
              <div className="flex w-full items-center justify-center text-lg text-secondary-600">
                {t("no_consultation_history")}
              </div>
              <div className="flex w-full items-center justify-center pt-4">
                <Button variant="outline_primary" asChild>
                  <Link
                    href={`/facility/${facilityId}/patient/${id}/consultation`}
                  >
                    <span className="flex w-full items-center justify-start gap-2">
                      <CareIcon icon="l-chat-bubble-user" className="text-xl" />
                      {t("add_consultation")}
                    </span>
                  </Link>
                </Button>
              </div>
            </div>
          </PaginatedList.WhenEmpty>
          <PaginatedList.Items<ConsultationModel>>
            {(item) => (
              <ConsultationCard
                itemData={item}
                isLastConsultation={
                  !!patientData.last_consultation &&
                  item.id === patientData.last_consultation.id
                }
                refetch={refetch}
              />
            )}
          </PaginatedList.Items>
          <div className="flex w-full items-center justify-center">
            <PaginatedList.Paginator hideIfSinglePage />
          </div>
        </div>
      )}
    </PaginatedList>
  );
};

export default EncounterHistory;
