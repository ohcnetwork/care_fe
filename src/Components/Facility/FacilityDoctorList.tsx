import { useState } from "react";
import { DOCTOR_SPECIALIZATION } from "../../Common/constants";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import ButtonV2 from "../Common/components/ButtonV2";
import DialogModal from "../Common/Dialog";
import { DoctorCapacity } from "./DoctorCapacity";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import { DoctorModal } from "./models";
import DoctorsCountCard from "./DoctorsCountCard";
import { DoctorIcon } from "../TeleIcu/Icons/DoctorIcon";

export const FacilityDoctorList = (props: any) => {
  const [doctorCapacityModalOpen, setDoctorCapacityModalOpen] = useState(false);
  const [totalDoctors, setTotalDoctors] = useState(0);

  const doctorQuery = useQuery(routes.listDoctor, {
    pathParams: { facilityId: props.facilityId },
    onResponse: ({ res, data }) => {
      if (res?.ok && data) {
        let totalCount = 0;
        [data].map((doctor: DoctorModal) => {
          if (doctor.count) {
            totalCount += doctor.count;
          }
        });
        setTotalDoctors(totalCount);
      }
    },
  });

  let doctorList: any = null;
  if (!doctorQuery.data || !doctorQuery.data.results.length) {
    doctorList = (
      <h5 className="flex w-full items-center justify-center rounded-lg bg-white p-4 text-xl font-bold text-gray-500 shadow">
        No Doctors Found
      </h5>
    );
  } else {
    doctorList = (
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Total Doctors Count Card */}
        <div className="w-full">
          <div className="flex h-full flex-col rounded-sm border border-primary-500 bg-primary-100 shadow-sm">
            <div className="flex flex-1 items-center justify-start gap-3 px-4 py-6">
              <div className="rounded-full bg-primary-500 p-4">
                <DoctorIcon className="h-5 w-5 fill-current text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-[#808080]">
                  Total Doctors
                </div>
                <h2 className="mt-2 text-xl font-bold">{totalDoctors}</h2>
              </div>
            </div>
          </div>
        </div>

        {doctorQuery.data.results.map((data: DoctorModal) => {
          const removeCurrentDoctorData = (doctorId: number | undefined) => {
            if (doctorQuery.data !== undefined) {
              doctorQuery.data?.results.filter(
                (i: DoctorModal) => i.id !== doctorId
              );
              doctorQuery.refetch();
            }
          };

          return (
            <DoctorsCountCard
              facilityId={props.facilityId}
              key={`bed_${data.id}`}
              handleUpdate={async () => {
                doctorQuery.refetch();
              }}
              {...data}
              removeDoctor={removeCurrentDoctorData}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="mt-5 rounded bg-white p-3 shadow-sm md:p-6">
        <div className="justify-between md:flex md:pb-2">
          <div className="mb-2 text-xl font-bold">Doctors List</div>
          <ButtonV2
            className="w-full md:w-auto"
            onClick={() => setDoctorCapacityModalOpen(true)}
            disabled={doctorList.length === DOCTOR_SPECIALIZATION.length}
            authorizeFor={NonReadOnlyUsers}
          >
            <i className="fas fa-user-md mr-2 text-white" />
            Add Doctor Types
          </ButtonV2>
        </div>
        <div className="mt-4">{doctorList}</div>
      </div>

      {doctorCapacityModalOpen && (
        <DialogModal
          show={doctorCapacityModalOpen}
          onClose={() => setDoctorCapacityModalOpen(false)}
          title="Add Doctor Capacity"
          className="max-w-md md:min-w-[600px]"
        >
          <DoctorCapacity
            facilityId={props.facilityId}
            handleClose={() => setDoctorCapacityModalOpen(false)}
            handleUpdate={async () => {
              doctorQuery.refetch();
            }}
          />
        </DialogModal>
      )}
    </div>
  );
};
