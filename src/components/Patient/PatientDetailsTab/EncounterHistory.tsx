import React from "react";
import { useTranslation } from "react-i18next";

import PaginatedList from "@/CAREUI/misc/PaginatedList";

import CircularProgress from "@/components/Common/CircularProgress";
import { ConsultationCard } from "@/components/Facility/ConsultationCard";
import { ConsultationModel } from "@/components/Facility/models";
import { PatientProps } from "@/components/Patient/PatientDetailsTab";

import routes from "@/Utils/request/api";

const EncounterHistory = (props: PatientProps) => {
  const { patientData, id, refetch } = props;

  const { t } = useTranslation();

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
            <div className="h-full space-y-2 rounded-lg bg-white p-7 border border-secondary-300">
              <div className="flex w-full items-center justify-center text-xl text-secondary-600">
                {t("no_consultation_history")}
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
