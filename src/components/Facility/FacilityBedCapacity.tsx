import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";
import { BedCapacity } from "@/components/Facility/BedCapacity";
import BedTypeCard from "@/components/Facility/BedTypeCard";

import { BED_TYPES } from "@/common/constants";

import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

export const FacilityBedCapacity = (props: any) => {
  const { t } = useTranslation();

  const [bedCapacityModalOpen, setBedCapacityModalOpen] = useState(false);

  const capacityQuery = useQuery(routes.getCapacity, {
    pathParams: { facilityId: props.facilityId },
  });

  let capacityList: any = null;
  if (!capacityQuery.data || !capacityQuery.data.results.length) {
    capacityList = (
      <h5 className="mt-4 flex w-full items-center justify-center rounded-lg bg-white p-4 text-xl font-bold text-secondary-500 shadow">
        No Bed Types Found
      </h5>
    );
  } else {
    const totalBedCount = capacityQuery.data.results.reduce(
      (acc, x) => acc + (x.total_capacity ? x.total_capacity : 0),
      0,
    );
    const totalOccupiedBedCount = capacityQuery.data.results.reduce(
      (acc, x) => acc + (x.current_capacity ? x.current_capacity : 0),
      0,
    );

    capacityList = (
      <div className="mt-4 grid w-full gap-7 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <BedTypeCard
          label="Total Beds"
          used={totalOccupiedBedCount}
          total={totalBedCount}
          handleUpdate={() => {
            return;
          }}
        />
        {BED_TYPES.map((x) => {
          const res = capacityQuery.data?.results.find((data) => {
            return data.room_type === x;
          });
          if (
            res &&
            res.current_capacity !== undefined &&
            res.total_capacity !== undefined
          ) {
            const removeCurrentBedType = (bedTypeId: number | undefined) => {
              if (capacityQuery.data !== undefined) {
                capacityQuery.data.results.filter((i) => i.id !== bedTypeId);
                capacityQuery.refetch();
              }
            };
            return (
              <BedTypeCard
                facilityId={props.facilityId}
                bedCapacityId={res.id}
                key={`bed_${res.id}`}
                room_type={res.room_type}
                label={t(`bed_type__${x}`)}
                used={res.current_capacity}
                total={res.total_capacity}
                lastUpdated={res.modified_date}
                removeBedType={removeCurrentBedType}
                handleUpdate={() => {
                  capacityQuery.refetch();
                }}
              />
            );
          }
        })}
      </div>
    );
  }

  return (
    <section id="facility-bed-capacity-details">
      <div className="mt-5 rounded bg-white p-3 shadow-sm md:p-6">
        <div className="justify-between md:flex md:pb-2">
          <div className="mb-2 text-xl font-semibold">Bed Capacity</div>
          <ButtonV2
            id="facility-add-bedtype"
            className="w-full md:w-auto"
            onClick={() => setBedCapacityModalOpen(true)}
            authorizeFor={NonReadOnlyUsers}
          >
            <CareIcon icon="l-bed" className="mr-2 text-lg text-white" />
            Add More Bed Types
          </ButtonV2>
        </div>
        <div>{capacityList}</div>
      </div>

      {bedCapacityModalOpen && (
        <DialogModal
          show={bedCapacityModalOpen}
          onClose={() => setBedCapacityModalOpen(false)}
          title="Add Bed Capacity"
          className="max-w-md md:min-w-[600px]"
        >
          <BedCapacity
            facilityId={props.facilityId}
            handleClose={() => setBedCapacityModalOpen(false)}
            handleUpdate={async () => {
              capacityQuery.refetch();
            }}
          />
        </DialogModal>
      )}
    </section>
  );
};
