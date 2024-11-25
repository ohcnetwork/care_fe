import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import PaginatedList from "@/CAREUI/misc/PaginatedList";

import CircularProgress from "@/components/Common/CircularProgress";

import routes from "@/Utils/request/api";

import { PatientProps } from ".";
import { SampleTestCard } from "../SampleTestCard";
import { SampleTestModel } from "../models";

export const SampleTestHistory = (props: PatientProps) => {
  const { facilityId, id } = props;
  const [_selectedStatus, setSelectedStatus] = useState<{
    status: number;
    sample: SampleTestModel | null;
  }>({ status: 0, sample: null });
  const [_showAlertMessage, setShowAlertMessage] = useState(false);

  const confirmApproval = (status: number, sample: SampleTestModel) => {
    setSelectedStatus({ status, sample });
    setShowAlertMessage(true);
  };

  const { t } = useTranslation();

  return (
    <div className="mt-4 px-3 md:px-0">
      <div>
        <div className="flex justify-between items-center">
          <h2 className="my-4 ml-0 text-2xl font-semibold leading-tight">
            {t("sample_test_history")}
          </h2>
        </div>
      </div>

      <PaginatedList
        route={routes.sampleTestList}
        pathParams={{ patientId: id }}
        perPage={5}
      >
        {(_, query) => (
          <div>
            <PaginatedList.WhenLoading>
              <CircularProgress />
            </PaginatedList.WhenLoading>
            <PaginatedList.WhenEmpty className="py-2">
              <div className="h-full space-y-2 rounded-lg bg-white p-7 shadow">
                <div className="flex w-full items-center justify-center text-xl font-bold text-secondary-500">
                  {t("no_records_found")}
                </div>
              </div>
            </PaginatedList.WhenEmpty>
            <PaginatedList.Items<SampleTestModel>>
              {(item) => (
                <SampleTestCard
                  refetch={query.refetch}
                  itemData={item}
                  handleApproval={confirmApproval}
                  facilityId={facilityId}
                  patientId={id}
                />
              )}
            </PaginatedList.Items>
            <div className="flex w-full items-center justify-center">
              <PaginatedList.Paginator hideIfSinglePage />
            </div>
          </div>
        )}
      </PaginatedList>
    </div>
  );
};
