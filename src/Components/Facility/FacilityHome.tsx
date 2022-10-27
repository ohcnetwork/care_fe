import { navigate } from "raviger";
import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import loadable from "@loadable/component";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import {
  BED_TYPES,
  DOCTOR_SPECIALIZATION,
  FACILITY_FEATURE_TYPES,
  USER_TYPES,
} from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getPermittedFacility,
  deleteFacility,
  getTriageInfo,
  listCapacity,
  listDoctor,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import BedTypeCard from "./BedTypeCard";
import DoctorsCountCard from "./DoctorsCountCard";
import {
  CapacityModal,
  DoctorModal,
  FacilityModel,
  PatientStatsModel,
} from "./models";
import moment from "moment";
import { RoleButton } from "../Common/RoleButton";
import CoverImageEditModal from "./CoverImageEditModal";
import DropdownMenu, { DropdownItem } from "../Common/components/Menu";
import Table from "../Common/components/Table";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export const FacilityHome = (props: any) => {
  const { facilityId } = props;
  const dispatch: any = useDispatch();
  const [facilityData, setFacilityData] = useState<FacilityModel>({});
  const [capacityData, setCapacityData] = useState<Array<CapacityModal>>([]);
  const [doctorData, setDoctorData] = useState<Array<DoctorModal>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editCoverImage, setEditCoverImage] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const [patientStatsData, setPatientStatsData] = useState<
    Array<PatientStatsModel>
  >([]);

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

  const state: any = useSelector((state) => state);
  const { currentUser } = state;

  if (isLoading) {
    return <Loading />;
  }
  let capacityList: any = null;
  if (!capacityData || !capacityData.length) {
    capacityList = (
      <h5 className="text-xl text-gray-500 font-bold flex items-center justify-center bg-white rounded-lg shadow p-4 w-full">
        No Bed Types Found
      </h5>
    );
  } else {
    capacityList = BED_TYPES.map((x) => {
      const res = capacityData.find((data) => {
        return data.room_type === x.id;
      });
      if (res) {
        const removeCurrentBedType = (bedTypeId: number | undefined) => {
          setCapacityData((state) => state.filter((i) => i.id !== bedTypeId));
        };
        return (
          <BedTypeCard
            facilityId={facilityId}
            key={`bed_${res.id}`}
            {...res}
            removeBedType={removeCurrentBedType}
          />
        );
      }
    });
  }

  let doctorList: any = null;
  if (!doctorData || !doctorData.length) {
    doctorList = (
      <h5 className="text-xl text-gray-500 font-bold flex items-center justify-center bg-white rounded-lg shadow p-4 w-full">
        No Doctors Found
      </h5>
    );
  } else {
    doctorList = doctorData.map((data: DoctorModal) => {
      const removeCurrentDoctorData = (doctorId: number | undefined) => {
        setDoctorData((state) =>
          state.filter((i: DoctorModal) => i.id !== doctorId)
        );
      };

      return (
        <DoctorsCountCard
          facilityId={facilityId}
          key={`bed_${data.id}`}
          {...data}
          removeDoctor={removeCurrentDoctorData}
        />
      );
    });
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
      <RoleButton
        className="btn btn-default"
        handleClickCB={() =>
          navigate(`/facility/${facilityId}/triage/${patientStatsData[i].id}`)
        }
        disableFor="readOnly"
        buttonType="html"
      >
        Edit
      </RoleButton>
    );
    stats.push(temp);
  }

  const hasCoverImage = !!facilityData.read_cover_image_url;

  const StaffUserTypeIndex = USER_TYPES.findIndex((type) => type === "Staff");
  const hasPermissionToEditCoverImage =
    !(currentUser.data.user_type as string).includes("ReadOnly") &&
    USER_TYPES.findIndex((type) => type == currentUser.data.user_type) >=
      StaffUserTypeIndex;

  const editCoverImageTooltip = hasPermissionToEditCoverImage && (
    <div className="transition-[opacity] flex flex-col justify-center items-center bg-black opacity-0 h-48 md:h-[88px] w-full absolute top-0 right-0 hover:opacity-60 z-10 text-gray-300 text-sm">
      <i className="fa-solid fa-pen" />
      <span className="mt-2">{`${hasCoverImage ? "Edit" : "Upload"}`}</span>
    </div>
  );

  const CoverImage = () => (
    <img
      src={`${facilityData.read_cover_image_url}?imgKey=${imageKey}`}
      alt={facilityData.name}
      className="w-full h-full object-cover"
    />
  );

  return (
    <div className="px-2 pb-2">
      <PageTitle
        title={facilityData.name || "Facility"}
        crumbsReplacements={{ [facilityId]: { name: facilityData.name } }}
      />
      <Dialog
        maxWidth={"md"}
        open={openDeleteDialog}
        onClose={handleDeleteClose}
      >
        <DialogTitle className="flex justify-center bg-red-100">
          Are you sure you want to delete {facilityData.name || "Facility"}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You will not be able to access this facility after it is deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <div className="flex flex-col md:flex-row gap-2 w-full justify-between">
            <button
              onClick={handleDeleteClose}
              className="btn btn-primary w-full md:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSubmit}
              id="facility-delete-confirm"
              className="btn btn-danger w-full md:w-auto"
            >
              Delete
            </button>
          </div>
        </DialogActions>
      </Dialog>
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
      {hasCoverImage && (
        <div
          className={`group relative overflow-clip w-full rounded-t bg-gray-200 h-48 md:h-0 opacity-100 md:opacity-0 transition-all duration-200 ease-in-out ${
            hasPermissionToEditCoverImage && "cursor-pointer"
          }`}
          onClick={() =>
            hasPermissionToEditCoverImage && setEditCoverImage(true)
          }
        >
          <CoverImage />
          {editCoverImageTooltip}
        </div>
      )}
      <div
        className={`bg-white ${
          hasCoverImage ? "rounded-b lg:rounded-t" : "rounded"
        } p-3 md:p-6 shadow-sm transition-all duration-200 ease-in-out`}
      >
        <div className="lg:flex justify-between gap-2">
          <div className="md:flex flex-col justify-between">
            <div className="flex flex-col flex-1 gap-10">
              <div className="flex gap-4 items-center">
                <div
                  className={`group relative h-[88px] w-[88px] hidden md:flex transition-all duration-200 ease-in-out rounded overflow-clip ${
                    hasPermissionToEditCoverImage && "cursor-pointer"
                  }`}
                  onClick={() =>
                    hasPermissionToEditCoverImage && setEditCoverImage(true)
                  }
                >
                  {hasCoverImage ? (
                    <CoverImage />
                  ) : (
                    <div className="h-[88px] w-full bg-gray-200 text-gray-700 flex items-center justify-center font-medium">
                      <svg
                        className="w-8 h-8 fill-current text-gray-500"
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
                  <p className="mt-1 text-sm text-gray-700">
                    Last updated:{" "}
                    {facilityData?.modified_date &&
                      moment(facilityData?.modified_date).fromNow()}
                  </p>
                </div>
              </div>
              <div className="flex items-center flex-1">
                <div className="grid grid-cols-1  lg:grid-cols-2 gap-4 mb-6 md:mb-0 w-full">
                  <div className="md:flex flex-col justify-between lg:flex-1 ">
                    <div className="mb-10">
                      <h1 className="font-semibold text-[#B9B9B9] text-base">
                        Address
                      </h1>
                      <p className="font-medium text-base">
                        {facilityData.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <h1 className="text-base font-semibold text-[#B9B9B9]">
                          Phone Number
                        </h1>
                        <a
                          href={`tel:${facilityData.phone_number}`}
                          className="text-base font-medium flex items-center gap-2 border-b border-[#0038FF] text-[#0038FF]"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M11.9601 7.66668C11.8134 7.66668 11.6601 7.62001 11.5134 7.58668C11.2164 7.52123 10.9245 7.43434 10.6401 7.32668C10.3308 7.21417 9.99083 7.22001 9.68561 7.34309C9.38038 7.46616 9.13146 7.69777 8.98673 7.99335L8.84007 8.29335C8.19074 7.93213 7.59406 7.4835 7.06673 6.96001C6.54325 6.43269 6.09462 5.83601 5.7334 5.18668L6.0134 5.00001C6.30898 4.85529 6.54059 4.60637 6.66366 4.30114C6.78674 3.99592 6.79258 3.65596 6.68007 3.34668C6.57422 3.06163 6.48736 2.76988 6.42007 2.47335C6.38673 2.32668 6.36007 2.17335 6.34007 2.02001C6.25911 1.55043 6.01315 1.12518 5.64648 0.82084C5.27981 0.516505 4.81653 0.353086 4.34007 0.360014H2.34007C2.05275 0.357316 1.76823 0.416556 1.50587 0.533701C1.24351 0.650845 1.00947 0.823144 0.819687 1.03887C0.629901 1.25459 0.488824 1.50868 0.406059 1.78382C0.323295 2.05897 0.300787 2.34872 0.340067 2.63335C0.695226 5.42627 1.97075 8.02127 3.96517 10.0084C5.95958 11.9956 8.55921 13.2617 11.3534 13.6067H11.6067C12.0983 13.6074 12.573 13.427 12.9401 13.1C13.151 12.9114 13.3195 12.6801 13.4344 12.4216C13.5493 12.163 13.608 11.883 13.6067 11.6V9.60001C13.5986 9.13694 13.4299 8.69105 13.1296 8.33846C12.8293 7.98587 12.4159 7.74843 11.9601 7.66668V7.66668ZM12.2934 11.6667C12.2933 11.7613 12.273 11.8549 12.2339 11.9411C12.1948 12.0273 12.1378 12.1042 12.0667 12.1667C11.9922 12.231 11.9051 12.279 11.811 12.3077C11.7169 12.3364 11.6178 12.3452 11.5201 12.3333C9.02333 12.0132 6.70422 10.871 4.92854 9.08687C3.15286 7.30274 2.02167 4.97824 1.7134 2.48001C1.70279 2.38236 1.71209 2.28357 1.74074 2.18961C1.76938 2.09565 1.81678 2.00847 1.88007 1.93335C1.94254 1.86223 2.01944 1.80524 2.10565 1.76616C2.19186 1.72708 2.28541 1.7068 2.38007 1.70668H4.38007C4.5351 1.70323 4.68648 1.75393 4.80816 1.85006C4.92984 1.94619 5.01421 2.08173 5.04673 2.23335C5.0734 2.41557 5.10673 2.59557 5.14673 2.77335C5.22375 3.12478 5.32624 3.47013 5.4534 3.80668L4.52007 4.24001C4.44026 4.27663 4.36848 4.32864 4.30884 4.39308C4.2492 4.45751 4.20287 4.53309 4.17251 4.61548C4.14216 4.69786 4.12838 4.78543 4.13197 4.87316C4.13555 4.96089 4.15643 5.04704 4.1934 5.12668C5.15287 7.18185 6.8049 8.83388 8.86007 9.79335C9.02237 9.86003 9.20443 9.86003 9.36673 9.79335C9.44988 9.76361 9.52628 9.71765 9.59151 9.65814C9.65675 9.59863 9.70951 9.52675 9.74673 9.44668L10.1601 8.51335C10.5047 8.6366 10.8565 8.73901 11.2134 8.82001C11.3912 8.86001 11.5712 8.89335 11.7534 8.92001C11.905 8.95254 12.0406 9.0369 12.1367 9.15858C12.2328 9.28027 12.2835 9.43165 12.2801 9.58668L12.2934 11.6667ZM13.5734 0.786681C13.5058 0.623781 13.3763 0.49433 13.2134 0.426681C13.1333 0.39252 13.0472 0.3744 12.9601 0.373347H10.2934C10.1166 0.373347 9.94702 0.443585 9.822 0.568609C9.69697 0.693633 9.62673 0.863203 9.62673 1.04001C9.62673 1.21682 9.69697 1.38639 9.822 1.51142C9.94702 1.63644 10.1166 1.70668 10.2934 1.70668H11.3467L9.1534 3.90668C9.02923 4.03159 8.95954 4.20056 8.95954 4.37668C8.95954 4.5528 9.02923 4.72177 9.1534 4.84668C9.27831 4.97085 9.44728 5.04054 9.6234 5.04054C9.79952 5.04054 9.96849 4.97085 10.0934 4.84668L12.2934 2.65335V3.70668C12.2934 3.88349 12.3636 4.05306 12.4887 4.17809C12.6137 4.30311 12.7833 4.37335 12.9601 4.37335C13.1369 4.37335 13.3064 4.30311 13.4315 4.17809C13.5565 4.05306 13.6267 3.88349 13.6267 3.70668V1.04001C13.6257 0.952896 13.6076 0.866829 13.5734 0.786681V0.786681Z"
                              fill="#0038FF"
                            />
                          </svg>
                          {facilityData.phone_number}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="lg:flex-1 min-w-[300px] md:flex flex-col">
                    <div className="mb-10">
                      <h1 className="text-base font-semibold text-[#B9B9B9]">
                        Local Body
                      </h1>
                      <p className="text-base font-medium w-2/3 md:w-full">
                        {facilityData?.local_body_object?.name}
                      </p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-10">
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
            <div className="flex items-center gap-3 mt-10">
              <div>
                {facilityData.features?.some((feature) =>
                  FACILITY_FEATURE_TYPES.some((f) => f.id === feature)
                ) && (
                  <h1 className="text-lg font-semibold">Available features</h1>
                )}
                <div className="flex gap-2 flex-wrap mt-5">
                  {facilityData.features?.map(
                    (feature, i) =>
                      FACILITY_FEATURE_TYPES.some((f) => f.id === feature) && (
                        <div
                          key={i}
                          className=" bg-[#F0FFF9] text-primary-500 font-medium px-4 py-3 rounded border border-primary-500 text-sm"
                        >
                          <i
                            className={`fas fa-${
                              FACILITY_FEATURE_TYPES.filter(
                                (f) => f.id === feature
                              )[0]?.icon
                            }`}
                          />{" "}
                          &nbsp;
                          {
                            FACILITY_FEATURE_TYPES.filter(
                              (f) => f.id === feature
                            )[0]?.name
                          }
                        </div>
                      )
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between mt-4">
            <div className="w-full md:w-auto">
              <DropdownMenu
                title="Manage Facility"
                icon={
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 21 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18.8999 11.66C18.7396 11.4775 18.6512 11.2429 18.6512 11C18.6512 10.7571 18.7396 10.5225 18.8999 10.34L20.1799 8.90002C20.3209 8.74269 20.4085 8.54472 20.4301 8.33452C20.4516 8.12433 20.4061 7.9127 20.2999 7.73002L18.2999 4.27002C18.1948 4.08754 18.0348 3.94289 17.8426 3.8567C17.6505 3.77051 17.4361 3.74718 17.2299 3.79002L15.3499 4.17002C15.1107 4.21945 14.8616 4.17961 14.6498 4.05802C14.4379 3.93643 14.2779 3.7415 14.1999 3.51002L13.5899 1.68002C13.5228 1.4814 13.395 1.30888 13.2245 1.18686C13.0541 1.06484 12.8495 0.999476 12.6399 1.00002H8.6399C8.42183 0.988635 8.20603 1.04894 8.02546 1.17173C7.84489 1.29452 7.70948 1.47304 7.6399 1.68002L7.0799 3.51002C7.0019 3.7415 6.84187 3.93643 6.63001 4.05802C6.41815 4.17961 6.16911 4.21945 5.9299 4.17002L3.9999 3.79002C3.80445 3.7624 3.6052 3.79324 3.42724 3.87866C3.24929 3.96407 3.1006 4.10025 2.9999 4.27002L0.999896 7.73002C0.891056 7.91067 0.842118 8.1211 0.860079 8.33124C0.878039 8.54138 0.961979 8.74046 1.0999 8.90002L2.3699 10.34C2.53022 10.5225 2.61863 10.7571 2.61863 11C2.61863 11.2429 2.53022 11.4775 2.3699 11.66L1.0999 13.1C0.961979 13.2596 0.878039 13.4587 0.860079 13.6688C0.842118 13.8789 0.891056 14.0894 0.999896 14.27L2.9999 17.73C3.10499 17.9125 3.26502 18.0571 3.45715 18.1433C3.64928 18.2295 3.86372 18.2529 4.0699 18.21L5.9499 17.83C6.18911 17.7806 6.43815 17.8204 6.65001 17.942C6.86187 18.0636 7.0219 18.2585 7.0999 18.49L7.7099 20.32C7.77948 20.527 7.91489 20.7055 8.09546 20.8283C8.27603 20.9511 8.49183 21.0114 8.7099 21H12.7099C12.9195 21.0006 13.1241 20.9352 13.2945 20.8132C13.465 20.6912 13.5928 20.5186 13.6599 20.32L14.2699 18.49C14.3479 18.2585 14.5079 18.0636 14.7198 17.942C14.9316 17.8204 15.1807 17.7806 15.4199 17.83L17.2999 18.21C17.5061 18.2529 17.7205 18.2295 17.9126 18.1433C18.1048 18.0571 18.2648 17.9125 18.3699 17.73L20.3699 14.27C20.4761 14.0873 20.5216 13.8757 20.5001 13.6655C20.4785 13.4553 20.3909 13.2573 20.2499 13.1L18.8999 11.66ZM17.4099 13L18.2099 13.9L16.9299 16.12L15.7499 15.88C15.0297 15.7328 14.2805 15.8551 13.6445 16.2238C13.0085 16.5925 12.53 17.1819 12.2999 17.88L11.9199 19H9.3599L8.9999 17.86C8.76975 17.1619 8.29128 16.5725 7.6553 16.2038C7.01932 15.8351 6.27012 15.7128 5.5499 15.86L4.3699 16.1L3.0699 13.89L3.8699 12.99C4.36185 12.44 4.63383 11.7279 4.63383 10.99C4.63383 10.2521 4.36185 9.54004 3.8699 8.99002L3.0699 8.09002L4.3499 5.89002L5.5299 6.13002C6.25012 6.27724 6.99932 6.1549 7.6353 5.78622C8.27128 5.41753 8.74975 4.82818 8.9799 4.13002L9.3599 3.00002H11.9199L12.2999 4.14002C12.53 4.83818 13.0085 5.42753 13.6445 5.79622C14.2805 6.1649 15.0297 6.28724 15.7499 6.14002L16.9299 5.90002L18.2099 8.12002L17.4099 9.02002C16.9235 9.56878 16.6549 10.2767 16.6549 11.01C16.6549 11.7433 16.9235 12.4513 17.4099 13ZM10.6399 7.00002C9.84877 7.00002 9.07541 7.23461 8.41761 7.67414C7.75982 8.11366 7.24713 8.73838 6.94438 9.46928C6.64163 10.2002 6.56241 11.0045 6.71675 11.7804C6.8711 12.5563 7.25206 13.269 7.81147 13.8284C8.37088 14.3879 9.08361 14.7688 9.85954 14.9232C10.6355 15.0775 11.4397 14.9983 12.1706 14.6955C12.9015 14.3928 13.5262 13.8801 13.9658 13.2223C14.4053 12.5645 14.6399 11.7911 14.6399 11C14.6399 9.93915 14.2185 8.92174 13.4683 8.17159C12.7182 7.42144 11.7008 7.00002 10.6399 7.00002ZM10.6399 13C10.2443 13 9.85765 12.8827 9.52876 12.663C9.19986 12.4432 8.94351 12.1308 8.79214 11.7654C8.64076 11.3999 8.60116 10.9978 8.67833 10.6098C8.7555 10.2219 8.94598 9.86551 9.22568 9.5858C9.50539 9.3061 9.86175 9.11562 10.2497 9.03845C10.6377 8.96128 11.0398 9.00088 11.4053 9.15226C11.7707 9.30363 12.0831 9.55998 12.3028 9.88888C12.5226 10.2178 12.6399 10.6045 12.6399 11C12.6399 11.5304 12.4292 12.0392 12.0541 12.4142C11.679 12.7893 11.1703 13 10.6399 13Z"
                      fill="white"
                    />
                  </svg>
                }
              >
                <DropdownItem>
                  <RoleButton
                    id="update-facility"
                    className="flex gap-3 items-center"
                    handleClickCB={() =>
                      navigate(`/facility/${facilityId}/update`)
                    }
                    disableFor="readOnly"
                    buttonType="html"
                  >
                    <i className="fas fa-pencil-alt text-primary-500"></i>
                    Update Facility
                  </RoleButton>
                </DropdownItem>
                <DropdownItem>
                  <button
                    className="flex gap-3 items-center"
                    onClick={() =>
                      navigate(`/facility/${facilityId}/inventory`)
                    }
                  >
                    <i className="fas fa-dolly-flatbed text-primary-500"></i>
                    Inventory Management
                  </button>
                </DropdownItem>
                <DropdownItem>
                  <RoleButton
                    className="flex gap-3 items-center"
                    handleClickCB={() =>
                      navigate(`/facility/${facilityId}/location`)
                    }
                    disableFor="readOnly"
                    buttonType="html"
                  >
                    <i className="fas fa-map-marker-alt text-primary-500"></i>
                    Location Management
                  </RoleButton>
                </DropdownItem>
                <DropdownItem>
                  <RoleButton
                    className="flex gap-3 items-center"
                    handleClickCB={() =>
                      navigate(`/facility/${facilityId}/resource/new`)
                    }
                    disableFor="readOnly"
                    buttonType="html"
                  >
                    <i className="fas fa-dolly-flatbed text-primary-500"></i>
                    Resource Request
                  </RoleButton>
                </DropdownItem>
                <DropdownItem>
                  <RoleButton
                    className="flex gap-3 items-center"
                    handleClickCB={() =>
                      navigate(`/facility/${facilityId}/assets/new`)
                    }
                    disableFor="readOnly"
                    buttonType="html"
                  >
                    <i className="fas fa-plus-circle text-primary-500"></i>
                    Create Asset
                  </RoleButton>
                </DropdownItem>
                <DropdownItem>
                  <button
                    className="flex gap-3 items-center"
                    onClick={() => navigate(`/assets?facility=${facilityId}`)}
                  >
                    <i className="fas fa-boxes text-primary-500"></i>
                    View Assets
                  </button>
                </DropdownItem>
                <DropdownItem>
                  <button
                    className="flex gap-3 items-center"
                    onClick={() => navigate(`/facility/${facilityId}/users`)}
                  >
                    <i className="fas fa-users text-primary-500"></i>
                    View Users
                  </button>
                </DropdownItem>
                {currentUser.data.user_type === "DistrictAdmin" ||
                currentUser.data.user_type === "StateAdmin" ? (
                  <DropdownItem activeColor="#C81E1E">
                    <button
                      id="facility-delete"
                      className="text-[#C81E1E] flex gap-3 items-center"
                      onClick={() => setOpenDeleteDialog(true)}
                    >
                      <i className="fas fa-trash text-[#C81E1E]"></i>
                      Delete Facility
                    </button>
                  </DropdownItem>
                ) : (
                  <></>
                )}
              </DropdownMenu>
            </div>
            <div className="flex flex-col justify-end">
              <RoleButton
                className="btn-secondary mt-2 w-full md:w-auto"
                handleClickCB={() =>
                  navigate(`/facility/${facilityId}/patient`)
                }
                data-testid="add-patient-button"
                disableFor="readOnly"
                buttonType="html"
              >
                <i className="fas fa-plus"></i>
                Add Details of a Patient
              </RoleButton>

              <button
                className="btn-secondary mt-2 w-full md:w-auto"
                onClick={() => navigate(`/facility/${facilityId}/patients`)}
              >
                <i className="fas fa-user-injured"></i>
                View Patients
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded p-3 md:p-6 shadow-sm mt-5">
        <h1 className="text-xl font-bold mb-6">Oxygen Information</h1>
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
      <div className="bg-white rounded p-3 md:p-6 shadow-sm mt-5">
        <div className="md:flex justify-between  md:border-b md:pb-2">
          <div className="font-semibold text-xl">Bed Capacity</div>
          <RoleButton
            className="btn-primary btn w-full md:w-auto"
            handleClickCB={() => navigate(`/facility/${facilityId}/bed`)}
            disableFor="readOnly"
            buttonType="html"
          >
            <i className="fas fa-bed text-white mr-2" />
            Add More Bed Types
          </RoleButton>
        </div>
        <div className="mt-4 grid lg:grid-cols-3 sm:grid-cols-2 gap-7 w-full">
          {capacityList}
        </div>
      </div>
      <div className="bg-white rounded p-3 md:p-6 shadow-sm mt-5">
        <div className="md:flex justify-between md:pb-2">
          <div className="font-bold text-xl mb-2">Doctors List</div>
          <RoleButton
            className="btn-primary btn w-full md:w-auto"
            handleClickCB={() => navigate(`/facility/${facilityId}/doctor`)}
            disabled={doctorList.length === DOCTOR_SPECIALIZATION.length}
            disableFor="readOnly"
            buttonType="html"
          >
            <i className="fas fa-user-md text-white mr-2" />
            Add Doctor Types
          </RoleButton>
        </div>
        <div className="mt-4 grid xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 gap-6">
          {doctorList}
        </div>
      </div>
      <div className="bg-white rounded p-3 md:p-6 shadow-sm mt-5">
        <div className="-my-2 py-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="md:flex justify-between md:pb-2">
            <div className="text-xl font-bold mb-2">Corona Triage</div>
            <RoleButton
              className="btn-primary btn w-full md:w-auto"
              handleClickCB={() => navigate(`/facility/${facilityId}/triage`)}
              disableFor="readOnly"
              buttonType="html"
            >
              <i className="fas fa-notes-medical text-white mr-2" />
              Add Triage
            </RoleButton>
          </div>
          <div className="overflow-x-auto min-w-full overflow-hidden mt-4">
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
              <div>
                <hr />
                <div className="p-4 text-xl text-gray-600 border rounded-sm border-[#D2D6DC] mt-3 font-bold flex justify-center items-center">
                  No Data Found
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
