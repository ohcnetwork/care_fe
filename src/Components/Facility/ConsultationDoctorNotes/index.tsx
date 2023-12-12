// import { GENDER_TYPES, SYMPTOM_CHOICES } from "../../../Common/constants";
// import { ConsultationModel } from "../models";
// import {
//   getConsultation,
//   getPatient,
//   listAssetBeds,
//   listShiftRequests,
// } from "../../../Redux/actions";
// import { statusType, useAbortableEffect } from "../../../Common/utils";
// import { lazy, useCallback, useState } from "react";
// // import DoctorVideoSlideover from "../DoctorVideoSlideover";
// // import { make as Link } from "../../Common/components/Link.bs";
// import PatientInfoCard from "../../Patient/PatientInfoCard";
// import { PatientModel } from "../../Patient/models";
// import { formatDateTime } from "../../../Utils/utils";

// import { navigate, useQueryParams } from "raviger";
// import { useDispatch } from "react-redux";
// import { triggerGoal } from "../../../Integrations/Plausible";
// import useAuthUser from "../../../Common/hooks/useAuthUser";
// // import { ConsultationUpdatesTab } from "./ConsultationUpdatesTab";
// // import { ConsultationABGTab } from "./ConsultationABGTab";
// // import { ConsultationNursingTab } from "./ConsultationNursingTab";
// // import { ConsultationFeedTab } from "./ConsultationFeedTab";
// // import { ConsultationSummaryTab } from "./ConsultationSummaryTab";
// // import { ConsultationFilesTab } from "./ConsultationFilesTab";
// // import { ConsultationMedicinesTab } from "./ConsultationMedicinesTab";
// // import { ConsultationInvestigationsTab } from "./ConsultationInvestigationsTab";
// // import { ConsultationVentilatorTab } from "./ConsultationVentilatorTab";
// // import { ConsultationPressureSoreTab } from "./ConsultationPressureSoreTab";
// // import { ConsultationDialysisTab } from "./ConsultationDialysisTab";
// // import { ConsultationNeurologicalMonitoringTab } from "./ConsultationNeurologicalMonitoringTab";
// // import { ConsultationNutritionTab } from "./ConsultationNutritionTab";
// // import ConsultationDoctorNotesSlideover from "../ConsultationDoctorNotesSlideover";
// // import LegacyDiagnosesList from "../../Diagnosis/LegacyDiagnosesList";

// const Loading = lazy(() => import("../../Common/Loading"));
// const PageTitle = lazy(() => import("../../Common/PageTitle"));
// const symptomChoices = [...SYMPTOM_CHOICES];

// export interface ConsultationTabProps {
//   consultationId: string;
//   facilityId: string;
//   patientId: string;
//   consultationData: ConsultationModel;
//   patientData: PatientModel;
// }

// export const ConsultationDoctorNotes = (props: any) => {
//   const { facilityId, patientId, consultationId } = props;
//   const dispatch: any = useDispatch();
//   const [isLoading, setIsLoading] = useState(false);
//   const [qParams, _] = useQueryParams();

//   const [consultationData, setConsultationData] = useState<ConsultationModel>(
//     {} as ConsultationModel
//   );
//   const [patientData, setPatientData] = useState<PatientModel>({});
//   const [activeShiftingData, setActiveShiftingData] = useState<Array<any>>([]);
//   const [isCameraAttached, setIsCameraAttached] = useState(false);

//   const getPatientGender = (patientData: any) =>
//     GENDER_TYPES.find((i) => i.id === patientData.gender)?.text;

//   const getPatientAddress = (patientData: any) =>
//     `${patientData.address},\n${patientData.ward_object?.name},\n${patientData.local_body_object?.name},\n${patientData.district_object?.name},\n${patientData.state_object?.name}`;

//   const getPatientComorbidities = (patientData: any) => {
//     if (patientData?.medical_history?.length) {
//       const medHis = patientData.medical_history;
//       return medHis.map((item: any) => item.disease).join(", ");
//     } else {
//       return "None";
//     }
//   };
//   const [showConsultationDoctorNotesPopup, setShowConsultationDoctorNotesPopup] = useState(false);

//   const authUser = useAuthUser();

//   const fetchData = useCallback(
//     async (status: statusType) => {
//       setIsLoading(true);
//       const res = await dispatch(getConsultation(consultationId));
//       if (!status.aborted) {
//         if (res?.data) {
//           const data: ConsultationModel = {
//             ...res.data,
//             symptoms_text: "",
//           };
//           if (res.data.symptoms?.length) {
//             const symptoms = res.data.symptoms
//               .filter((symptom: number) => symptom !== 9)
//               .map((symptom: number) => {
//                 const option = symptomChoices.find((i) => i.id === symptom);
//                 return option ? option.text.toLowerCase() : symptom;
//               });
//             data.symptoms_text = symptoms.join(", ");
//           }
//           setConsultationData(data);
//           const assetRes = await dispatch(
//             listAssetBeds({
//               bed: data?.current_bed?.bed_object?.id,
//             })
//           );
//           const isCameraAttachedRes = assetRes.data.results.some(
//             (asset: { asset_object: { asset_class: string } }) => {
//               return asset?.asset_object?.asset_class === "ONVIF";
//             }
//           );
//           setIsCameraAttached(isCameraAttachedRes);
//           const id = res.data.patient;
//           const patientRes = await dispatch(getPatient({ id }));
//           if (patientRes?.data) {
//             const patientGender = getPatientGender(patientRes.data);
//             const patientAddress = getPatientAddress(patientRes.data);
//             const patientComorbidities = getPatientComorbidities(
//               patientRes.data
//             );
//             const data = {
//               ...patientRes.data,
//               gender: patientGender,
//               address: patientAddress,
//               comorbidities: patientComorbidities,
//               is_declared_positive: patientRes.data.is_declared_positive
//                 ? "Yes"
//                 : "No",
//               is_vaccinated: patientData.is_vaccinated ? "Yes" : "No",
//             };
//             setPatientData(data);
//           }

//           // Get shifting data
//           const shiftingRes = await dispatch(
//             listShiftRequests({ patient: id }, "shift-list-call")
//           );
//           if (shiftingRes?.data?.results) {
//             const data = shiftingRes.data.results;
//             setActiveShiftingData(data);
//           }
//         } else {
//           navigate("/not-found");
//         }
//         setIsLoading(false);
//       }
//     },
//     [consultationId, dispatch, patientData.is_vaccinated]
//   );

//   useAbortableEffect((status: statusType) => {
//     fetchData(status);
//     triggerGoal("Patient Consultation Viewed", {
//       facilityId: facilityId,
//       consultationId: consultationId,
//       userId: authUser.id,
//     });
//   }, []);

//   //   const consultationTabProps: ConsultationTabProps = {
//   //     consultationId,
//   //     facilityId,
//   //     patientId,
//   //     consultationData,
//   //     patientData,
//   //   };

//   //   const SelectedTab = TABS[tab];

//   if (isLoading) {
//     return <Loading />;
//   }

//   //   const tabButtonClasses = (selected: boolean) =>
//   //     `capitalize min-w-max-content cursor-pointer border-transparent text-gray-700 hover:text-gray-700 hover:border-gray-300 font-bold whitespace-nowrap ${
//   //       selected === true ? "border-primary-500 text-primary-600 border-b-2" : ""
//   //     }`;

//   return (
//     <div>
//       <div className="px-2 pb-2">
//         <nav className="relative flex flex-wrap items-start justify-between">
//           <PageTitle
//             title="Patient Dashboard"
//             className="sm:m-0 sm:p-0"
//             crumbsReplacements={{
//               [facilityId]: { name: patientData?.facility_object?.name },
//               [patientId]: { name: patientData?.name },
//               [consultationId]: {
//                 name:
//                   consultationData.suggestion === "A"
//                     ? `Admitted on ${formatDateTime(
//                         consultationData?.admission_date
//                       )}`
//                     : consultationData.suggestion_text,
//               },
//             }}
//             breadcrumbs={true}
//             backUrl="/patients"
//           />
//         </nav>
//         <div className="mt-2 flex w-full flex-col md:flex-row">
//           <div className="h-full w-full rounded-lg border bg-white text-black shadow">
//             <PatientInfoCard
//               patient={patientData}
//               consultation={consultationData}
//               fetchPatientData={fetchData}
//               consultationId={consultationId}
//               activeShiftingData={activeShiftingData}
//               showAbhaProfile={qParams["show-abha-profile"] === "true"}
//             />
//           </div>
//         </div>
//         Pranshu
//       </div>
//     </div>
//   );
// };

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import * as Notification from "../../../Utils/Notifications.js";
import { addPatientNote, getPatient } from "../../../Redux/actions";
import Page from "../../Common/components/Page";
import TextFormField from "../../Form/FormFields/TextFormField";
import ButtonV2 from "../../Common/components/ButtonV2";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { NonReadOnlyUsers } from "../../../Utils/AuthorizeFor";
import { useMessageListener } from "../../../Common/hooks/useMessageListener";
import PatientNotesList from "../../Facility/PatientNotesList";

interface ConsultationDoctorNotesProps {
  patientId: string;
  facilityId: string;
  consultationId: string;
}

const ConsultationDoctorNotes = (props: ConsultationDoctorNotesProps) => {
  const { patientId, facilityId, consultationId } = props;

  const [patientActive, setPatientActive] = useState(true);
  const [noteField, setNoteField] = useState("");
  const [reload, setReload] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");

  const dispatch = useDispatch();

  console.log(consultationId);

  const onAddNote = () => {
    const payload = {
      note: noteField,
    };
    if (!/\S+/.test(noteField)) {
      Notification.Error({
        msg: "Note Should Contain At Least 1 Character",
      });
      return;
    }
    dispatch(addPatientNote(patientId, payload)).then(() => {
      Notification.Success({ msg: "Note added successfully" });
      setNoteField("");
      setReload(!reload);
    });
  };

  useEffect(() => {
    async function fetchPatientName() {
      if (patientId) {
        const res = await dispatch(getPatient({ id: patientId }));
        if (res.data) {
          setPatientActive(res.data.is_active);
          setPatientName(res.data.name);
          setFacilityName(res.data.facility_object.name);
        }
      }
    }
    fetchPatientName();
  }, [dispatch, patientId]);

  useMessageListener((data) => {
    const message = data?.message;
    if (
      (message?.from == "patient/doctor_notes/create" ||
        message?.from == "patient/doctor_notes/edit") &&
      message?.facility_id == facilityId &&
      message?.patient_id == patientId
    ) {
      setReload(true);
    }
  });

  return (
    <Page
      title="Doctor Notes"
      className="flex h-screen flex-col"
      crumbsReplacements={{
        [facilityId]: { name: facilityName },
        [patientId]: { name: patientName },
      }}
      backUrl={`/facility/${facilityId}/patient/${patientId}`}
    >
      <div className="mx-3 my-2 flex grow flex-col rounded-lg bg-white p-2 sm:mx-10 sm:my-5 sm:p-5">
        <PatientNotesList
          patientId={patientId}
          facilityId={facilityId}
          reload={reload}
          setReload={setReload}
        />

        <div className="relative mx-4 flex items-center">
          <TextFormField
            name="note"
            value={noteField}
            onChange={(e) => setNoteField(e.value)}
            className="grow"
            type="text"
            errorClassName="hidden"
            placeholder="Type your Note"
            disabled={!patientActive}
          />
          <ButtonV2
            onClick={onAddNote}
            border={false}
            className="absolute right-2"
            ghost
            size="small"
            disabled={!patientActive}
            authorizeFor={NonReadOnlyUsers}
          >
            <CareIcon className="care-l-message text-lg" />
          </ButtonV2>
        </div>
      </div>
    </Page>
  );
};

export default ConsultationDoctorNotes;
