import * as Notification from "../../Utils/Notifications.js";

import AuthorizeFor, { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import {
  CapacityModal,
  DoctorModal,
  FacilityModel,
  PatientStatsModel,
} from "./models";
import {
  DOCTOR_SPECIALIZATION,
  FACILITY_FEATURE_TYPES,
  USER_TYPES,
  getBedTypes,
} from "../../Common/constants";
import DropdownMenu, { DropdownItem } from "../Common/components/Menu";
import {
  deleteFacility,
  getPermittedFacility,
  getTriageInfo,
  listCapacity,
  listDoctor,
} from "../../Redux/actions";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { lazy, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BedCapacity } from "./BedCapacity";
import BedTypeCard from "./BedTypeCard";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import Chip from "../../CAREUI/display/Chip";
import ConfirmDialog from "../Common/ConfirmDialog";
import ContactLink from "../Common/components/ContactLink";
import CoverImageEditModal from "./CoverImageEditModal";
import DialogModal from "../Common/Dialog";
import { DoctorCapacity } from "./DoctorCapacity";
import { DoctorIcon } from "../TeleIcu/Icons/DoctorIcon";
import DoctorsCountCard from "./DoctorsCountCard";
import Page from "../Common/components/Page";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import Table from "../Common/components/Table";

import { navigate } from "raviger";
import useConfig from "../../Common/hooks/useConfig";
import { useMessageListener } from "../../Common/hooks/useMessageListener";
import { useTranslation } from "react-i18next";
import useAuthUser from "../../Common/hooks/useAuthUser.js";

const Loading = lazy(() => import("../Common/Loading"));

export const getFacilityFeatureIcon = (featureId: number) => {
  const feature = FACILITY_FEATURE_TYPES.find((f) => f.id === featureId);
  if (!feature?.icon) return null;
  return typeof feature.icon === "string" ? (
    <CareIcon className={`care-l-${feature.icon} text-lg`} />
  ) : (
    feature.icon
  );
};

export const FacilityHome = (props: any) => {
  const { t } = useTranslation();
  const { facilityId } = props;
  const dispatch: any = useDispatch();
  const [facilityData, setFacilityData] = useState<FacilityModel>({});
  const [capacityData, setCapacityData] = useState<Array<CapacityModal>>([]);
  const [doctorData, setDoctorData] = useState<Array<DoctorModal>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editCoverImage, setEditCoverImage] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [patientStatsData, setPatientStatsData] = useState<
    Array<PatientStatsModel>
  >([]);
  const [bedCapacityModalOpen, setBedCapacityModalOpen] = useState(false);
  const [doctorCapacityModalOpen, setDoctorCapacityModalOpen] = useState(false);
  const authUser = useAuthUser();
  const config = useConfig();

  useMessageListener((data) => console.log(data));

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const facilityRes = await dispatch(getPermittedFacility(facilityId));
      if (facilityRes) {
        const [capacityRes, doctorRes, triageRes] = await Promise.all([
          dispatch(listCapacity({}, { facilityId })),
          dispatch(listDoctor({}, { facilityId })),
          dispatch(getTriageInfo({ facilityId })),
        ]);
        if (!status.aborted) {
          setIsLoading(false);
          if (!facilityRes.data) {
            Notification.Error({
              msg: "Something went wrong..!",
            });
          } else {
            setFacilityData(facilityRes.data);
            if (capacityRes && capacityRes.data) {
              setCapacityData(capacityRes.data.results);
            }
            if (doctorRes && doctorRes.data) {
              setDoctorData(doctorRes.data.results);
              // calculating total doctors count
              let totalCount = 0;
              doctorRes.data.results.map((doctor: DoctorModal) => {
                if (doctor.count) {
                  totalCount += doctor.count;
                }
              });
              setTotalDoctors(totalCount);
            }
            if (
              triageRes &&
              triageRes.data &&
              triageRes.data.results &&
              triageRes.data.results.length
            ) {
              setPatientStatsData(triageRes.data.results);
            }
          }
        }
      } else {
        navigate("/not-found");
        setIsLoading(false);
      }
    },
    [dispatch, facilityId]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData]
  );

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
  };

  const handleDeleteSubmit = async () => {
    const res = await dispatch(deleteFacility(facilityId));
    if (res?.status === 204) {
      Notification.Success({
        msg: "Facility deleted successfully",
      });
    } else {
      Notification.Error({
        msg: "Error while deleting Facility: " + (res?.data?.detail || ""),
      });
    }
    navigate("/facility");
  };

  if (isLoading) {
    return <Loading />;
  }
  let capacityList: any = null;
  let totalBedCount = 0;
  let totalOccupiedBedCount = 0;
  if (!capacityData || !capacityData.length) {
    capacityList = (
      <h5 className="mt-4 flex w-full items-center justify-center rounded-lg bg-white p-4 text-xl font-bold text-gray-500 shadow">
        No Bed Types Found
      </h5>
    );
  } else {
    capacityData.forEach((x) => {
      totalBedCount += x.total_capacity ? x.total_capacity : 0;
      totalOccupiedBedCount += x.current_capacity ? x.current_capacity : 0;
    });

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
        {getBedTypes(config).map((x) => {
          const res = capacityData.find((data) => {
            return data.room_type === x.id;
          });
          if (
            res &&
            res.current_capacity !== undefined &&
            res.total_capacity !== undefined
          ) {
            const removeCurrentBedType = (bedTypeId: number | undefined) => {
              setCapacityData((state) =>
                state.filter((i) => i.id !== bedTypeId)
              );
            };
            return (
              <BedTypeCard
                facilityId={facilityId}
                bedCapacityId={res.id}
                key={`bed_${res.id}`}
                room_type={res.room_type}
                label={x.text}
                used={res.current_capacity}
                total={res.total_capacity}
                lastUpdated={res.modified_date}
                removeBedType={removeCurrentBedType}
                handleUpdate={async () => {
                  const capacityRes = await dispatch(
                    listCapacity({}, { facilityId })
                  );
                  if (capacityRes && capacityRes.data) {
                    setCapacityData(capacityRes.data.results);
                  }
                }}
              />
            );
          }
        })}
      </div>
    );
  }

  let doctorList: any = null;
  if (!doctorData || !doctorData.length) {
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

        {doctorData.map((data: DoctorModal) => {
          const removeCurrentDoctorData = (doctorId: number | undefined) => {
            setDoctorData((state) =>
              state.filter((i: DoctorModal) => i.id !== doctorId)
            );
          };

          return (
            <DoctorsCountCard
              facilityId={facilityId}
              key={`bed_${data.id}`}
              handleUpdate={async () => {
                const doctorRes = await dispatch(
                  listDoctor({}, { facilityId })
                );
                if (doctorRes && doctorRes.data) {
                  setDoctorData(doctorRes.data.results);
                  // update total doctors count
                  let totalCount = 0;
                  doctorRes.data.results.map((doctor: DoctorModal) => {
                    if (doctor.count) {
                      totalCount += doctor.count;
                    }
                  });
                  setTotalDoctors(totalCount);
                }
              }}
              {...data}
              removeDoctor={removeCurrentDoctorData}
            />
          );
        })}
      </div>
    );
  }

  const stats: (string | JSX.Element)[][] = [];
  for (let i = 0; i < patientStatsData.length; i++) {
    const temp: (string | JSX.Element)[] = [];
    temp.push(String(patientStatsData[i].entry_date) || "0");
    temp.push(String(patientStatsData[i].num_patients_visited) || "0");
    temp.push(String(patientStatsData[i].num_patients_home_quarantine) || "0");
    temp.push(String(patientStatsData[i].num_patients_isolation) || "0");
    temp.push(String(patientStatsData[i].num_patient_referred) || "0");
    temp.push(
      String(patientStatsData[i].num_patient_confirmed_positive) || "0"
    );
    temp.push(
      <ButtonV2
        variant="secondary"
        ghost
        border
        onClick={() =>
          navigate(`/facility/${facilityId}/triage/${patientStatsData[i].id}`)
        }
        authorizeFor={NonReadOnlyUsers}
      >
        Edit
      </ButtonV2>
    );
    stats.push(temp);
  }

  const hasCoverImage = !!facilityData.read_cover_image_url;

  const StaffUserTypeIndex = USER_TYPES.findIndex((type) => type === "Staff");
  const hasPermissionToEditCoverImage =
    !(authUser.user_type as string).includes("ReadOnly") &&
    USER_TYPES.findIndex((type) => type == authUser.user_type) >=
      StaffUserTypeIndex;

  const editCoverImageTooltip = hasPermissionToEditCoverImage && (
    <div className="absolute right-0 top-0 z-10 flex h-48 w-full flex-col items-center justify-center bg-black text-sm text-gray-300 opacity-0 transition-[opacity] hover:opacity-60 md:h-[88px]">
      <i className="fa-solid fa-pen" />
      <span className="mt-2">{`${hasCoverImage ? "Edit" : "Upload"}`}</span>
    </div>
  );

  const CoverImage = () => (
    <img
      src={`${facilityData.read_cover_image_url}?imgKey=${imageKey}`}
      alt={facilityData.name}
      className="h-full w-full object-cover"
    />
  );

  return (
    <Page
      title={facilityData.name || "Facility"}
      crumbsReplacements={{ [facilityId]: { name: facilityData.name } }}
      focusOnLoad={true}
      backUrl="/facility"
    >
      <ConfirmDialog
        title={`Delete ${facilityData.name}`}
        description={
          <span>
            Are you sure you want to delete <strong>{facilityData.name}</strong>
          </span>
        }
        action="Delete"
        variant="danger"
        show={openDeleteDialog}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteSubmit}
      />
      <CoverImageEditModal
        open={editCoverImage}
        onSave={() =>
          facilityData.read_cover_image_url
            ? setImageKey(Date.now())
            : window.location.reload()
        }
        onClose={() => setEditCoverImage(false)}
        onDelete={() => window.location.reload()}
        facility={facilityData}
      />
      {hasCoverImage ? (
        <div
          className={`group relative h-48 w-full text-clip rounded-t bg-gray-200 opacity-100 transition-all duration-200 ease-in-out md:h-0 md:opacity-0 ${
            hasPermissionToEditCoverImage && "cursor-pointer"
          }`}
          onClick={() =>
            hasPermissionToEditCoverImage && setEditCoverImage(true)
          }
        >
          <CoverImage />
          {editCoverImageTooltip}
        </div>
      ) : (
        <div
          className={`group relative z-0 flex w-full shrink-0 items-center justify-center self-stretch bg-gray-300 md:hidden ${
            hasPermissionToEditCoverImage && "cursor-pointer"
          }`}
          onClick={() =>
            hasPermissionToEditCoverImage && setEditCoverImage(true)
          }
        >
          <i
            className="fas fa-hospital block p-10 text-4xl text-gray-500"
            aria-hidden="true"
          ></i>
          {editCoverImageTooltip}
        </div>
      )}
      <div
        className={`bg-white ${
          hasCoverImage ? "rounded-b lg:rounded-t" : "rounded"
        } p-3 shadow-sm transition-all duration-200 ease-in-out md:p-6`}
      >
        <div className="justify-between gap-2 lg:flex">
          <div className="flex-col justify-between md:flex">
            <div className="flex flex-1 flex-col gap-10">
              <div className="flex items-center gap-4">
                <div
                  className={`group relative hidden h-[88px] w-[88px] text-clip rounded transition-all duration-200 ease-in-out md:flex ${
                    hasPermissionToEditCoverImage && "cursor-pointer"
                  }`}
                  onClick={() =>
                    hasPermissionToEditCoverImage && setEditCoverImage(true)
                  }
                >
                  {hasCoverImage ? (
                    <CoverImage />
                  ) : (
                    <div className="flex h-[88px] w-full items-center justify-center bg-gray-200 font-medium text-gray-700">
                      <svg
                        className="h-8 w-8 fill-current text-gray-500"
                        viewBox="0 0 40 32"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M18.5 6C18.5 5.4475 18.95 5 19.5 5H20.5C21.05 5 21.5 5.4475 21.5 6V7.5H23C23.55 7.5 24 7.95 24 8.5V9.5C24 10.05 23.55 10.5 23 10.5H21.5V12C21.5 12.55 21.05 13 20.5 13H19.5C18.95 13 18.5 12.55 18.5 12V10.5H17C16.45 10.5 16 10.05 16 9.5V8.5C16 7.95 16.45 7.5 17 7.5H18.5V6ZM25.5 0C27.9875 0 30 2.015 30 4.5V5H35.5C37.9875 5 40 7.0125 40 9.5V27.5C40 29.9875 37.9875 32 35.5 32H4.49875C2.01188 32 0 29.9875 0 27.5V9.5C0 7.0125 2.015 5 4.5 5H10V4.5C10 2.015 12.0125 0 14.5 0H25.5ZM30 8V29H35.5C36.3312 29 37 28.3313 37 27.5V21H33.5C32.6688 21 32 20.3313 32 19.5C32 18.6688 32.6688 18 33.5 18H37V15H33.5C32.6688 15 32 14.3313 32 13.5C32 12.6688 32.6688 12 33.5 12H37V9.5C37 8.66875 36.3312 8 35.5 8H30ZM3 9.5V12H6.5C7.33125 12 8 12.6688 8 13.5C8 14.3313 7.33125 15 6.5 15H3V18H6.5C7.33125 18 8 18.6688 8 19.5C8 20.3313 7.33125 21 6.5 21H3V27.5C3 28.3313 3.67125 29 4.49875 29H10V8H4.5C3.67188 8 3 8.66875 3 9.5ZM13 29H17V25C17 23.3438 18.3438 22 20 22C21.6562 22 23 23.3438 23 25V29H27V4.5C27 3.67188 26.3312 3 25.5 3H14.5C13.6688 3 13 3.67188 13 4.5V29Z" />
                      </svg>
                    </div>
                  )}
                  {editCoverImageTooltip}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{facilityData.name}</h1>
                  {facilityData?.modified_date && (
                    <RecordMeta
                      className="mt-1 text-sm text-gray-700"
                      prefix={t("updated")}
                      time={facilityData?.modified_date}
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-1 items-center">
                <div className="mb-6 grid  w-full grid-cols-1 gap-4 md:mb-0 lg:grid-cols-2">
                  <div className="flex-col justify-between md:flex lg:flex-1 ">
                    <div className="mb-10">
                      <h1 className="text-base font-semibold text-[#B9B9B9]">
                        Address
                      </h1>
                      <p className="text-base font-medium">
                        {facilityData.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <h1 className="text-base font-semibold text-[#B9B9B9]">
                          Phone Number
                        </h1>
                        <ContactLink tel={String(facilityData.phone_number)} />
                      </div>
                    </div>
                  </div>
                  <div className="min-w-[300px] flex-col md:flex lg:flex-1">
                    <div className="mb-10">
                      <h1 className="text-base font-semibold text-[#B9B9B9]">
                        Local Body
                      </h1>
                      <p className="w-2/3 text-base font-medium md:w-full">
                        {facilityData?.local_body_object?.name}
                      </p>
                    </div>
                    <div className="flex flex-col gap-10 md:flex-row">
                      <div>
                        <h1 className="text-base font-semibold text-[#B9B9B9]">
                          Ward
                        </h1>
                        <p className="text-base font-medium">
                          {facilityData?.ward_object?.number +
                            ", " +
                            facilityData?.ward_object?.name}
                        </p>
                      </div>
                      <div>
                        <h1 className="text-base font-semibold text-[#B9B9B9]">
                          District
                        </h1>
                        <p className="text-base font-medium">
                          {facilityData?.district_object?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-10 flex items-center gap-3">
              <div>
                {facilityData.features?.some((feature) =>
                  FACILITY_FEATURE_TYPES.some((f) => f.id === feature)
                ) && (
                  <h1 className="text-lg font-semibold">Available features</h1>
                )}
                <div className="mt-5 flex flex-wrap gap-2">
                  {facilityData.features?.map(
                    (feature: number, i: number) =>
                      FACILITY_FEATURE_TYPES.some((f) => f.id === feature) && (
                        <Chip
                          key={i}
                          size="large"
                          text={
                            FACILITY_FEATURE_TYPES.filter(
                              (f) => f.id === feature
                            )[0]?.name
                          }
                          startIcon={
                            FACILITY_FEATURE_TYPES.filter(
                              (f) => f.id === feature
                            )[0]?.icon
                          }
                        />
                      )
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col justify-between">
            <div className="w-full md:w-auto">
              <DropdownMenu
                id="manage-facility-dropdown"
                title="Manage Facility"
                icon={<CareIcon className="care-l-setting text-lg" />}
              >
                <DropdownItem
                  id="update-facility"
                  onClick={() => navigate(`/facility/${facilityId}/update`)}
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon className="care-l-edit-alt text-lg" />}
                >
                  Update Facility
                </DropdownItem>
                <DropdownItem
                  id="configure-facility"
                  onClick={() =>
                    navigate(`/facility/${facilityId}/middleware/update`)
                  }
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon className="care-l-setting text-lg" />}
                >
                  Configure Facility
                </DropdownItem>
                <DropdownItem
                  id="inventory-management"
                  onClick={() => navigate(`/facility/${facilityId}/inventory`)}
                  icon={<CareIcon className="care-l-clipboard-alt w-5 " />}
                >
                  Inventory Management
                </DropdownItem>
                <DropdownItem
                  id="location-management"
                  onClick={() => navigate(`/facility/${facilityId}/location`)}
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon className="care-l-location-point text-lg" />}
                >
                  Location Management
                </DropdownItem>
                <DropdownItem
                  onClick={() =>
                    navigate(`/facility/${facilityId}/resource/new`)
                  }
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon className="care-l-gold text-lg" />}
                >
                  Resource Request
                </DropdownItem>
                <DropdownItem
                  onClick={() => navigate(`/facility/${facilityId}/assets/new`)}
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon className="care-l-plus-circle text-lg" />}
                >
                  Create Asset
                </DropdownItem>
                <DropdownItem
                  onClick={() => navigate(`/assets?facility=${facilityId}`)}
                  icon={<CareIcon className="care-l-medkit text-lg" />}
                >
                  View Assets
                </DropdownItem>
                <DropdownItem
                  onClick={() => navigate(`/facility/${facilityId}/users`)}
                  icon={<CareIcon className="care-l-users-alt text-lg" />}
                >
                  View Users
                </DropdownItem>
                <DropdownItem
                  variant="danger"
                  onClick={() => setOpenDeleteDialog(true)}
                  className="flex items-center gap-3"
                  icon={<CareIcon className="care-l-trash-alt text-lg" />}
                  authorizeFor={AuthorizeFor(["DistrictAdmin", "StateAdmin"])}
                >
                  Delete Facility
                </DropdownItem>
              </DropdownMenu>
            </div>
            <div className="flex flex-col justify-end">
              <ButtonV2
                variant="primary"
                ghost
                border
                className="mt-2 flex w-full flex-row justify-center md:w-auto"
                onClick={() => navigate(`/facility/${facilityId}/cns`)}
              >
                <CareIcon className="care-l-monitor-heart-rate text-lg" />
                <span>Central Nursing Station</span>
              </ButtonV2>
              <ButtonV2
                variant="primary"
                ghost
                border
                className="mt-2 flex w-full flex-row justify-center md:w-auto"
                onClick={() => navigate(`/facility/${facilityId}/patient`)}
                authorizeFor={NonReadOnlyUsers}
              >
                <CareIcon className="care-l-plus text-lg" />
                <span className="text-sm">Add Details of a Patient</span>
              </ButtonV2>
              <ButtonV2
                variant="primary"
                ghost
                border
                className="mt-2 flex w-full flex-row justify-center md:w-auto"
                onClick={() => navigate(`/patients?facility=${facilityId}`)}
              >
                <CareIcon className="care-l-user-injured text-lg" />
                <span>View Patients</span>
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded bg-white p-3 shadow-sm md:p-6">
        <h1 className="mb-6 text-xl font-bold">Oxygen Information</h1>
        <div className="overflow-x-auto overflow-y-hidden">
          <Table
            headings={[
              "",
              "Oxygen capacity",
              "Type B cylinder",
              "Type C cylinder",
              "Type D cylinder",
            ]}
            rows={[
              [
                "Capacity",
                String(facilityData.oxygen_capacity),
                String(facilityData.type_b_cylinders),
                String(facilityData.type_c_cylinders),
                String(facilityData.type_d_cylinders),
              ],
              [
                "Daily Expected Consumption",
                String(facilityData.expected_oxygen_requirement),
                String(facilityData.expected_type_b_cylinders),
                String(facilityData.expected_type_c_cylinders),
                String(facilityData.expected_type_d_cylinders),
              ],
            ]}
          />
        </div>
      </div>
      <div className="mt-5 rounded bg-white p-3 shadow-sm md:p-6">
        <div className="justify-between md:flex  md:border-b md:pb-2">
          <div className="mb-2 text-xl font-semibold">Bed Capacity</div>
          <ButtonV2
            className="w-full md:w-auto"
            onClick={() => setBedCapacityModalOpen(true)}
            authorizeFor={NonReadOnlyUsers}
          >
            <i className="fas fa-bed mr-2 text-white" />
            Add More Bed Types
          </ButtonV2>
        </div>
        <div>{capacityList}</div>
      </div>
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
      <div className="mt-5 rounded bg-white p-3 shadow-sm md:p-6">
        <div className="-my-2 py-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="justify-between md:flex md:pb-2">
            <div className="mb-2 text-xl font-bold">Corona Triage</div>
            <ButtonV2
              className="w-full md:w-auto"
              onClick={() => navigate(`/facility/${facilityId}/triage`)}
              authorizeFor={NonReadOnlyUsers}
            >
              <i className="fas fa-notes-medical mr-2 text-white" />
              Add Triage
            </ButtonV2>
          </div>
          <div className="mt-4 overflow-x-auto overflow-y-hidden">
            <Table
              rows={stats}
              headings={[
                "Date",
                "Total Triaged",
                "Advised Home Quarantine",
                "Suspects Isolated",
                "Referred",
                "Confirmed positives",
                "Actions",
              ]}
            />
            {stats.length === 0 && (
              <>
                <hr />
                <div className="mt-3 flex min-w-[1000px] items-center justify-center rounded-sm border border-[#D2D6DC] p-4 text-xl font-bold text-gray-600">
                  No Data Found
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {bedCapacityModalOpen && (
        <DialogModal
          show={bedCapacityModalOpen}
          onClose={() => setBedCapacityModalOpen(false)}
          title="Add Bed Capacity"
          className="max-w-md md:min-w-[600px]"
        >
          <BedCapacity
            facilityId={facilityId}
            handleClose={() => setBedCapacityModalOpen(false)}
            handleUpdate={async () => {
              const capacityRes = await dispatch(
                listCapacity({}, { facilityId })
              );
              if (capacityRes && capacityRes.data) {
                setCapacityData(capacityRes.data.results);
              }
            }}
          />
        </DialogModal>
      )}
      {doctorCapacityModalOpen && (
        <DialogModal
          show={doctorCapacityModalOpen}
          onClose={() => setDoctorCapacityModalOpen(false)}
          title="Add Doctor Capacity"
          className="max-w-md md:min-w-[600px]"
        >
          <DoctorCapacity
            facilityId={facilityId}
            handleClose={() => setDoctorCapacityModalOpen(false)}
            handleUpdate={async () => {
              const doctorRes = await dispatch(listDoctor({}, { facilityId }));
              if (doctorRes && doctorRes.data) {
                setDoctorData(doctorRes.data.results);
                // update total doctors count
                setTotalDoctors(
                  doctorRes.data.results.reduce(
                    (acc: number, doctor: DoctorModal) =>
                      acc + (doctor.count || 0),
                    0
                  )
                );
              }
            }}
          />
        </DialogModal>
      )}
    </Page>
  );
};
