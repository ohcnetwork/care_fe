import { ReactElement, useState } from "react";
import { OXYGEN_TYPES } from "../../Common/constants";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import DialogModal from "../Common/Dialog";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { OxygenDetails } from "./OxygenDetails";
import { OxygenTypeCard } from "./OxygenTypeCard";

export const FacilityOxygenInformation = ({
  facilityId,
  facilityData,
  facilityFetch,
}: any) => {
  const [oxygenDetailsModalOpen, setOxygenDetailsModalOpen] = useState(false);

  let capacityList: ReactElement | null = null;
  const totalOxygen =
    facilityData?.oxygen_capacity +
    facilityData?.type_b_cylinders +
    facilityData?.type_c_cylinders +
    facilityData?.type_d_cylinders;

  if (totalOxygen === 0) {
    capacityList = (
      <h5 className="mt-4 flex w-full items-center justify-center rounded-lg bg-white p-4 text-xl font-bold text-gray-500 shadow">
        No Oxygen Types Found
      </h5>
    );
  } else {
    const totalCapacity = totalOxygen;
    const totalExpectedCapacity =
      facilityData?.expected_oxygen_requirement +
      facilityData?.expected_type_b_cylinders +
      facilityData?.expected_type_c_cylinders +
      facilityData?.expected_type_d_cylinders;

    capacityList = (
      <div className="mt-4 grid w-full gap-7 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <OxygenTypeCard
          label="Total Oxygen"
          used={totalExpectedCapacity}
          total={totalCapacity}
          handleUpdate={() => {
            return;
          }}
        />
        {facilityData?.oxygen_capacity !== 0 && (
          <OxygenTypeCard
            facilityId={facilityId}
            oxygen_type={Number(OXYGEN_TYPES[0].id)}
            label={OXYGEN_TYPES[0].text}
            used={facilityData?.expected_oxygen_requirement}
            total={facilityData?.oxygen_capacity}
            handleUpdate={() => {
              facilityFetch();
            }}
            facilityData={facilityData}
          />
        )}
        {facilityData?.type_b_cylinders !== 0 && (
          <OxygenTypeCard
            facilityId={facilityId}
            oxygen_type={Number(OXYGEN_TYPES[1].id)}
            label={OXYGEN_TYPES[1].text}
            used={facilityData?.expected_type_b_cylinders}
            total={facilityData?.type_b_cylinders}
            handleUpdate={() => {
              facilityFetch();
            }}
            facilityData={facilityData}
          />
        )}
        {facilityData?.type_c_cylinders !== 0 && (
          <OxygenTypeCard
            facilityId={facilityId}
            oxygen_type={Number(OXYGEN_TYPES[2].id)}
            label={OXYGEN_TYPES[2].text}
            used={facilityData?.expected_type_c_cylinders}
            total={facilityData?.type_c_cylinders}
            handleUpdate={() => {
              facilityFetch();
            }}
            facilityData={facilityData}
          />
        )}

        {facilityData?.type_d_cylinders !== 0 && (
          <OxygenTypeCard
            facilityId={facilityId}
            oxygen_type={Number(OXYGEN_TYPES[3].id)}
            label={OXYGEN_TYPES[3].text}
            used={facilityData?.expected_type_d_cylinders}
            total={facilityData?.type_d_cylinders}
            handleUpdate={() => facilityFetch()}
            facilityData={facilityData}
          />
        )}
      </div>
    );
  }

  return (
    <section id="facility-oxygen-capacity-details">
      <div className="mt-5 rounded bg-white p-3 shadow-sm md:p-6">
        <div className="justify-between md:flex md:pb-2">
          <div className="mb-2 text-xl font-semibold">
            Oxygen Supply and Consumption{" "}
          </div>
          <ButtonV2
            id="facility-add-oxygentype"
            className="w-full md:w-auto"
            onClick={() => setOxygenDetailsModalOpen(true)}
            authorizeFor={NonReadOnlyUsers}
          >
            <CareIcon
              icon="l-book-medical"
              className="mr-2 text-lg text-white"
            />
            Add Oxygen Details
          </ButtonV2>
        </div>
        <div>{capacityList}</div>
      </div>

      {oxygenDetailsModalOpen && (
        <DialogModal
          show={oxygenDetailsModalOpen}
          onClose={() => setOxygenDetailsModalOpen(false)}
          title="Add Oxygen Details"
          className="max-w-md md:min-w-[600px]"
        >
          <OxygenDetails
            facilityId={facilityId}
            facilityData={facilityData}
            handleClose={() => setOxygenDetailsModalOpen(false)}
            handleUpdate={() => facilityFetch()}
          />
        </DialogModal>
      )}
    </section>
  );
};
