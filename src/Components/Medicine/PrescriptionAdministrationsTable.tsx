// import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
// import { PrescriptionActions } from "../../Redux/actions";
// import { useDispatch } from "react-redux";
// import { MedicineAdministrationRecord, Prescription } from "./models";
// import CareIcon from "../../CAREUI/icons/CareIcon";
// import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
// import SlideOver from "../../CAREUI/interactive/SlideOver";
// import MedicineAdministration from "./MedicineAdministration";
// import DiscontinuePrescription from "./DiscontinuePrescription";
// import AdministerMedicine from "./AdministerMedicine";
// import DialogModal from "../Common/Dialog";
// import PrescriptionDetailCard from "./PrescriptionDetailCard";
// import { useTranslation } from "react-i18next";
// import SubHeading from "../../CAREUI/display/SubHeading";
// import dayjs from "../../Utils/dayjs";
// import { classNames, formatDateTime, formatTime } from "../../Utils/utils";
// import useRangePagination from "../../Common/hooks/useRangePagination";
// import EditPrescriptionForm from "./EditPrescriptionForm";
// import useBreakpoints from "../../Common/hooks/useBreakpoints";
// import { Disclosure, Popover, Transition } from "@headlessui/react";

// interface DateRange {
//   start: Date;
//   end: Date;
// }

// interface Props {
//   prn: boolean;
//   prescription_type?: Prescription["prescription_type"];
//   consultation_id: string;
//   readonly?: boolean;
// }

// interface State {
//   prescriptions: Prescription[];
//   administrationsTimeBounds: DateRange;
// }

// export default function PrescriptionAdministrationsTable({
//   prn,
//   consultation_id,
//   readonly,
// }: Props) {
//   const dispatch = useDispatch<any>();
//   const { t } = useTranslation();

//   const [state, setState] = useState<State>();
//   const [showDiscontinued, setShowDiscontinued] = useState(false);
//   const [discontinuedCount, setDiscontinuedCount] = useState<number>();
//   const daysPerPage = useBreakpoints({ default: 1, "2xl": 2 });
//   const pagination = useRangePagination({
//     bounds: state?.administrationsTimeBounds ?? {
//       start: new Date(),
//       end: new Date(),
//     },
//     perPage: daysPerPage * 24 * 60 * 60 * 1000,
//     slots: (daysPerPage * 24) / 4, // Grouped by 4 hours
//     defaultEnd: true,
//   });
//   const [showBulkAdminister, setShowBulkAdminister] = useState(false);

//   const { list, prescription } = useMemo(
//     () => PrescriptionActions(consultation_id),
//     [consultation_id]
//   );

//   const refetch = useCallback(async () => {
//     const filters = {
//       is_prn: prn,
//       prescription_type: "REGULAR",
//       limit: 100,
//     };

//     const res = await dispatch(
//       list(showDiscontinued ? filters : { ...filters, discontinued: false })
//     );

//     setState({
//       prescriptions: (res.data.results as Prescription[]).sort(
//         (a, b) => +a.discontinued - +b.discontinued
//       ),
//       administrationsTimeBounds: getAdministrationBounds(res.data.results),
//     });

//     if (showDiscontinued === false) {
//       const discontinuedRes = await dispatch(
//         list({ ...filters, discontinued: true, limit: 0 })
//       );
//       setDiscontinuedCount(discontinuedRes.data.count);
//     }
//   }, [consultation_id, showDiscontinued, dispatch]);

//   useEffect(() => {
//     refetch();
//   }, [refetch]);

//   return (
//     <div>
//       {state?.prescriptions && (
//         <SlideOver
//           title={t("administer_medicines")}
//           dialogClass="w-full max-w-sm sm:max-w-md md:max-w-[1300px]"
//           open={showBulkAdminister}
//           setOpen={setShowBulkAdminister}
//         >
//           <MedicineAdministration
//             prescriptions={state.prescriptions}
//             onDone={() => {
//               setShowBulkAdminister(false);
//               refetch();
//             }}
//           />
//         </SlideOver>
//       )}

//       <SubHeading
//         title={prn ? "PRN Prescriptions" : "Prescriptions"}
//         lastModified={
//           state?.prescriptions?.[0]?.last_administered_on ??
//           state?.prescriptions?.[0]?.modified_date
//         }
//         options={
//           !readonly && (
//             <>
//               <ButtonV2
//                 variant="secondary"
//                 border
//                 href="prescriptions"
//                 className="w-full"
//               >
//                 <CareIcon className="care-l-pen text-lg" />
//                 <span className="hidden lg:block">
//                   {t("edit_prescriptions")}
//                 </span>
//                 <span className="block lg:hidden">{t("edit")}</span>
//               </ButtonV2>
//               <ButtonV2
//                 ghost
//                 border
//                 onClick={() => setShowBulkAdminister(true)}
//                 className="w-full"
//                 disabled={
//                   state === undefined || state.prescriptions.length === 0
//                 }
//               >
//                 <CareIcon className="care-l-syringe text-lg" />
//                 <span className="hidden lg:block">
//                   {t("administer_medicines")}
//                 </span>
//                 <span className="block lg:hidden">{t("administer")}</span>
//               </ButtonV2>
//             </>
//           )
//         }
//       />

//       <div className="relative max-h-[70vh] overflow-auto rounded border border-white shadow">
//         {state?.prescriptions.length === 0 ? (
//           <div className="my-16 flex w-full flex-col items-center justify-center gap-4 text-gray-500">
//             <CareIcon icon="l-tablets" className="text-5xl" />
//             <h3 className="text-lg font-medium">
//               {prn
//                 ? "No PRN Prescriptions Prescribed"
//                 : "No Prescriptions Prescribed"}
//             </h3>
//           </div>
//         ) : (
//           <table className="w-full whitespace-nowrap rounded">
//             <thead className="sticky top-0 z-10 bg-white text-xs font-medium text-black">
//               <tr>
//                 <th className="sticky left-0 z-10 bg-white py-3 pl-4 text-left">
//                   <div className="flex justify-between gap-2">
//                     <span className="text-sm">{t("medicine")}</span>
//                     <span className="hidden px-2 text-center text-xs leading-none lg:block">
//                       <p>Dosage &</p>
//                       <p>
//                         {!state?.prescriptions[0]?.is_prn
//                           ? "Frequency"
//                           : "Indicator"}
//                       </p>
//                     </span>
//                   </div>
//                 </th>

//                 <th>
//                   <ButtonV2
//                     size="small"
//                     circle
//                     ghost
//                     border
//                     className="mx-2 px-1"
//                     variant="secondary"
//                     disabled={!pagination.hasPrevious}
//                     onClick={pagination.previous}
//                     tooltip="Previous 24 hours"
//                     tooltipClassName="tooltip-bottom -translate-x-1/2 text-xs"
//                   >
//                     <CareIcon icon="l-angle-left-b" className="text-base" />
//                   </ButtonV2>
//                 </th>
//                 {state === undefined
//                   ? Array.from({ length: 12 }, (_, i) => i).map((i) => (
//                       <th
//                         className="tooltip py-2 text-center font-semibold leading-none text-gray-900"
//                         key={i}
//                       >
//                         <p className="h-4 w-6 animate-pulse rounded bg-gray-500" />
//                       </th>
//                     ))
//                   : pagination.slots?.map(({ start }, index) => (
//                       <>
//                         <th
//                           key={`administration-interval-${index}`}
//                           className={classNames(
//                             "leading-none",
//                             start.getHours() === 0
//                               ? "text-base font-bold text-gray-800"
//                               : "text-sm font-semibold text-gray-700"
//                           )}
//                         >
//                           {formatDateTime(
//                             start,
//                             start.getHours() === 0 ? "DD/MM" : "HH:mm"
//                           )}
//                         </th>
//                         <th
//                           key={`administration-slot-${index}`}
//                           className="flex w-6"
//                         />
//                       </>
//                     ))}
//                 <th>
//                   <ButtonV2
//                     size="small"
//                     circle
//                     ghost
//                     border
//                     className="mx-2 px-1"
//                     variant="secondary"
//                     disabled={!pagination.hasNext}
//                     onClick={pagination.next}
//                     tooltip="Next 24 hours"
//                     tooltipClassName="tooltip-bottom -translate-x-1/2 text-xs"
//                   >
//                     <CareIcon icon="l-angle-right-b" className="text-base" />
//                   </ButtonV2>
//                 </th>

//                 <th className="py-3 pr-2 text-right"></th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-gray-200">
//               {state?.prescriptions?.map((item) => (
//                 <PrescriptionRow
//                   key={item.id}
//                   prescription={item}
//                   intervals={pagination.slots!}
//                   actions={prescription(item.id ?? "")}
//                   refetch={refetch}
//                 />
//               ))}
//             </tbody>
//           </table>
//         )}

//         {showDiscontinued === false && !!discontinuedCount && (
//           <ButtonV2
//             variant="secondary"
//             className="sticky left-0 z-10 w-full"
//             ghost
//             onClick={() => setShowDiscontinued(true)}
//           >
//             <span className="flex w-full justify-start gap-1 text-sm">
//               <CareIcon icon="l-eye" className="text-lg" />
//               <span>
//                 Show <strong>{discontinuedCount}</strong> other discontinued
//                 prescription(s)
//               </span>
//             </span>
//           </ButtonV2>
//         )}
//       </div>
//     </div>
//   );
// }

// interface PrescriptionRowProps {
//   prescription: Prescription;
//   intervals: DateRange[];
//   actions: ReturnType<ReturnType<typeof PrescriptionActions>["prescription"]>;
//   refetch: () => void;
// }

// const PrescriptionRow = ({ prescription, ...props }: PrescriptionRowProps) => {
//   const dispatch = useDispatch<any>();
//   const { t } = useTranslation();
//   // const [showActions, setShowActions] = useState(false);
//   const [showDetails, setShowDetails] = useState(false);
//   const [showEdit, setShowEdit] = useState(false);
//   const [showAdminister, setShowAdminister] = useState(false);
//   const [showDiscontinue, setShowDiscontinue] = useState(false);
//   const [administrations, setAdministrations] =
//     useState<MedicineAdministrationRecord[]>();

//   useEffect(() => {
//     setAdministrations(undefined);

//     const getAdministrations = async () => {
//       const res = await dispatch(
//         props.actions.listAdministrations({
//           administered_date_after: formatDateTime(
//             props.intervals[0].start,
//             "YYYY-MM-DD"
//           ),
//           administered_date_before: formatDateTime(
//             props.intervals[props.intervals.length - 1].end,
//             "YYYY-MM-DD"
//           ),
//         })
//       );

//       setAdministrations(res.data.results);
//     };

//     getAdministrations();
//   }, [prescription.id, dispatch, props.intervals]);

//   return (
//     <tr
//       className={classNames(
//         "group border-separate border border-gray-300 bg-gray-100 transition-all duration-200 ease-in-out hover:bg-primary-100"
//       )}
//     >
//       {showDiscontinue && (
//         <DiscontinuePrescription
//           prescription={prescription}
//           actions={props.actions}
//           onClose={(success) => {
//             setShowDiscontinue(false);
//             if (success) {
//               props.refetch();
//             }
//           }}
//         />
//       )}
//       {showAdminister && (
//         <AdministerMedicine
//           prescription={prescription}
//           actions={props.actions}
//           onClose={(success) => {
//             setShowAdminister(false);
//             if (success) {
//               props.refetch();
//             }
//           }}
//         />
//       )}
//       {showDetails && (
//         <DialogModal
//           title={t("prescription_details")}
//           onClose={() => setShowDetails(false)}
//           className="w-full md:max-w-4xl"
//           show
//         >
//           <div className="mt-4 flex flex-col gap-4">
//             <PrescriptionDetailCard prescription={prescription} readonly />
//             <div className="flex w-full flex-col items-center justify-end gap-2 md:flex-row">
//               <Cancel
//                 onClick={() => setShowDetails(false)}
//                 label={t("close")}
//               />
//               <Submit
//                 disabled={
//                   prescription.discontinued ||
//                   prescription.prescription_type === "DISCHARGE"
//                 }
//                 variant="danger"
//                 onClick={() => setShowDiscontinue(true)}
//               >
//                 <CareIcon className="care-l-ban text-lg" />
//                 {t("discontinue")}
//               </Submit>
//               <Submit
//                 disabled={
//                   prescription.discontinued ||
//                   prescription.prescription_type === "DISCHARGE"
//                 }
//                 variant="secondary"
//                 border
//                 onClick={() => {
//                   setShowDetails(false);
//                   setShowEdit(true);
//                 }}
//               >
//                 <CareIcon icon="l-pen" className="text-lg" />
//                 {t("edit")}
//               </Submit>
//               <Submit
//                 disabled={
//                   prescription.discontinued ||
//                   prescription.prescription_type === "DISCHARGE"
//                 }
//                 onClick={() => setShowAdminister(true)}
//               >
//                 <CareIcon className="care-l-syringe text-lg" />
//                 {t("administer")}
//               </Submit>
//             </div>
//           </div>
//         </DialogModal>
//       )}
//       {showEdit && (
//         <DialogModal
//           onClose={() => setShowEdit(false)}
//           show={showEdit}
//           title={`${t("edit")} ${t(
//             prescription.is_prn ? "prn_prescription" : "prescription_medication"
//           )}: ${
//             prescription.medicine_object?.name ?? prescription.medicine_old
//           }`}
//           description={
//             <div className="mt-2 flex w-full justify-start gap-2 text-warning-500">
//               <CareIcon icon="l-info-circle" className="text-base" />
//               <span>{t("edit_caution_note")}</span>
//             </div>
//           }
//           className="w-full max-w-3xl lg:min-w-[600px]"
//         >
//           <EditPrescriptionForm
//             initial={prescription}
//             onDone={(success) => {
//               setShowEdit(false);
//               if (success) {
//                 props.refetch();
//               }
//             }}
//           />
//         </DialogModal>
//       )}
//       <td
//         className="sticky left-0 cursor-pointer bg-gray-100 py-3 pl-4 text-left transition-all duration-200 ease-in-out group-hover:bg-primary-100"
//         onClick={() => setShowDetails(true)}
//       >
//         <div className="flex flex-col gap-1 lg:flex-row lg:justify-between lg:gap-2">
//           <div className="flex items-center gap-2">
//             <span
//               className={classNames(
//                 "text-sm font-semibold",
//                 prescription.discontinued ? "text-gray-700" : "text-gray-900"
//               )}
//             >
//               {prescription.medicine_object?.name ?? prescription.medicine_old}
//             </span>

//             {prescription.discontinued && (
//               <span className="hidden rounded-full border border-gray-500 bg-gray-200 px-1.5 text-xs font-medium text-gray-700 lg:block">
//                 {t("discontinued")}
//               </span>
//             )}

//             {prescription.route && (
//               <span className="hidden rounded-full border border-blue-500 bg-blue-100 px-1.5 text-xs font-medium text-blue-700 lg:block">
//                 {t(prescription.route)}
//               </span>
//             )}
//           </div>

//           <div className="flex gap-1 text-xs font-semibold text-gray-900 lg:flex-col lg:px-2 lg:text-center">
//             <p>{prescription.dosage}</p>
//             <p>
//               {!prescription.is_prn
//                 ? t("PRESCRIPTION_FREQUENCY_" + prescription.frequency)
//                 : prescription.indicator}
//             </p>
//           </div>
//         </div>
//       </td>

//       <td />
//       {/* Administration Cells */}
//       {props.intervals.map(({ start, end }, index) => (
//         <>
//           <td>
//             <AdministrationCellSeperator date={start} />
//           </td>
//           <td key={index} className="text-center">
//             {administrations === undefined ? (
//               <CareIcon
//                 icon="l-spinner"
//                 className="animate-spin text-lg text-gray-500"
//               />
//             ) : (
//               <AdministrationCell
//                 administrations={administrations}
//                 interval={{ start, end }}
//                 prescription={prescription}
//               />
//             )}
//           </td>
//         </>
//       ))}
//       <td />

//       {/* Action Buttons */}
//       <td className="space-x-1 pr-2 text-right">
//         <ButtonV2
//           type="button"
//           size="small"
//           disabled={prescription.discontinued}
//           ghost
//           border
//           onClick={() => setShowAdminister(true)}
//         >
//           {t("administer")}
//         </ButtonV2>
//       </td>
//     </tr>
//   );
// };

// const AdministrationCellSeperator = ({ date }: { date: Date }) => {
//   // Show date if it's 00:00
//   if (date.getHours() === 0) {
//     return (
//       <div className="mx-auto flex h-[58px] flex-col items-center justify-center bg-gray-300 text-center text-xs font-bold text-gray-600 transition-all duration-200 ease-in-out group-hover:bg-primary-500 group-hover:text-white">
//         <span className="-rotate-90 uppercase duration-500 ease-in-out">
//           <p> {formatDateTime(date, "DD/MM")}</p>
//         </span>
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto flex h-[58px] flex-col items-center justify-center text-center text-xs font-bold text-gray-500 transition-all duration-200 ease-in-out">
//       <span className="font-bold duration-500 ease-in-out">
//         <p>{formatDateTime(date, "HH")}</p>
//       </span>
//     </div>
//   );
// };

// interface AdministrationCellProps {
//   administrations: MedicineAdministrationRecord[];
//   interval: DateRange;
//   prescription: Prescription;
// }

// const AdministrationCell = ({
//   administrations,
//   interval: { start, end },
//   prescription,
// }: AdministrationCellProps) => {
//   // Check if cell belongs to an administered prescription
//   const administered = administrations
//     .filter((administration) =>
//       dayjs(administration.administered_date).isBetween(start, end)
//     )
//     .sort(
//       (a, b) =>
//         new Date(a.administered_date!).getTime() -
//         new Date(b.administered_date!).getTime()
//     );

//   const hasComment = administered.some((obj) => !!obj.notes);

//   if (administered.length) {
//     return (
//       <Popover className="relative">
//         <Popover.Button className="scale-100 transition-transform duration-200 ease-in-out hover:scale-110">
//           <div className="tooltip">
//             <div className="relative mx-auto max-w-min">
//               <CareIcon
//                 icon="l-check-circle"
//                 className="text-xl text-primary-500"
//               />
//               {administered.length > 1 && (
//                 <span className="absolute -bottom-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-white">
//                   {administered.length}
//                 </span>
//               )}
//             </div>
//             {hasComment && (
//               <CareIcon icon="l-notes" className="text-xl text-primary-500" />
//             )}
//             <span className="tooltip-text tooltip-top -translate-x-1/2 text-xs">
//               {administered.length === 1 ? (
//                 <p>
//                   Administered on{" "}
//                   <strong>
//                     {formatTime(administered[0].administered_date)}
//                   </strong>
//                 </p>
//               ) : (
//                 <p>
//                   <strong>{administered.length}</strong> administrations
//                 </p>
//               )}
//               <p>Click to view details</p>
//             </span>
//           </div>
//         </Popover.Button>

//         <Transition
//           as={Fragment}
//           enter="transition ease-out duration-200"
//           enterFrom="opacity-0 translate-y-1"
//           enterTo="opacity-100 translate-y-0"
//           leave="transition ease-in duration-150"
//           leaveFrom="opacity-100 translate-y-0"
//           leaveTo="opacity-0 translate-y-1"
//         >
//           <Popover.Panel className="absolute left-1/2 z-10 mt-3 -translate-x-1/2 px-4 sm:px-0">
//             <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5">
//               <div className="relative flex flex-col gap-2 bg-white p-4">
//                 {administered.map((administration) => (
//                   <div>
//                     <Disclosure defaultOpen={administered.length === 1}>
//                       {({ open }) => (
//                         <>
//                           <Disclosure.Button
//                             className={classNames(
//                               "flex w-full justify-between border-gray-400 px-4 py-2 text-left text-sm focus:outline-none focus-visible:ring focus-visible:ring-primary-500/75",
//                               open
//                                 ? "rounded-t-lg border-l border-r border-t bg-gray-200"
//                                 : "rounded-lg border hover:bg-gray-200"
//                             )}
//                           >
//                             <span className="text-gray-700">
//                               Administered on{" "}
//                               <strong className="font-semibold text-gray-900">
//                                 {formatTime(administration.administered_date)}
//                               </strong>
//                             </span>
//                             {administration.notes && (
//                               <CareIcon
//                                 icon="l-notes"
//                                 className="ml-2 text-lg"
//                               />
//                             )}
//                             <CareIcon
//                               icon="l-angle-down"
//                               className={classNames(
//                                 "ml-8 text-base",
//                                 open ? "rotate-180" : "rotate-0"
//                               )}
//                             />
//                           </Disclosure.Button>
//                           <Disclosure.Panel className="flex flex-col items-start rounded-b-lg border border-gray-400 bg-gray-200 p-2 px-4 text-sm text-gray-700 shadow">
//                             <div>
//                               Administered by:{" "}
//                               <span className="font-medium text-gray-900">
//                                 {administration.administered_by?.first_name}{" "}
//                                 {administration.administered_by?.last_name}
//                               </span>
//                             </div>
//                             <div>
//                               Notes:{" "}
//                               <span className="font-medium text-gray-800">
//                                 {administration.notes || (
//                                   <span className="italic text-gray-700">
//                                     No notes
//                                   </span>
//                                 )}
//                               </span>
//                             </div>
//                           </Disclosure.Panel>
//                         </>
//                       )}
//                     </Disclosure>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </Popover.Panel>
//         </Transition>
//       </Popover>
//     );
//   }

//   // Check if cell belongs to a discontinued prescription
//   if (
//     prescription.discontinued &&
//     dayjs(end).isAfter(prescription.discontinued_date)
//   ) {
//     if (!dayjs(prescription.discontinued_date).isBetween(start, end)) return;

//     return (
//       <div className="tooltip">
//         <CareIcon
//           icon="l-ban"
//           className={classNames(
//             "text-xl",
//             dayjs(prescription.discontinued_date).isBetween(start, end)
//               ? "text-danger-700"
//               : "text-gray-400"
//           )}
//         />
//         <span className="tooltip-text tooltip-top -translate-x-1/2 text-xs">
//           <p>
//             Discontinued on{" "}
//             <strong>{formatDateTime(prescription.discontinued_date)}</strong>
//           </p>
//           <p>
//             Reason:{" "}
//             {prescription.discontinued_reason ? (
//               <strong>{prescription.discontinued_reason}</strong>
//             ) : (
//               <span className="italic">Not specified</span>
//             )}
//           </p>
//         </span>
//       </div>
//     );
//   }

//   // Check if cell belongs to after prescription.created_date
//   // if (dayjs(start).isAfter(prescription.created_date)) {
//   //   return <CareIcon icon="l-minus-circle" className="text-xl text-gray-400" />;
//   // }

//   // Check if prescription.created_date is between start and end
//   // if (dayjs(prescription.created_date).isBetween(start, end)) {
//   //   return (
//   //     <div className="tooltip">
//   //       <CareIcon icon="l-play-circle" className="text-xl text-gray-500" />
//   //       <span className="tooltip-text tooltip-top -translate-x-1/2 text-xs">
//   //         <p>
//   //           Prescribed on{" "}
//   //           <strong>{formatDateTime(prescription.created_date)}</strong>
//   //         </p>
//   //       </span>
//   //     </div>
//   //   );
//   // }
// };

// function getAdministrationBounds(prescriptions: Prescription[]) {
//   // get start by finding earliest of all presciption's created_date
//   const start = new Date(
//     prescriptions.reduce(
//       (earliest, curr) =>
//         earliest < curr.created_date ? earliest : curr.created_date,
//       prescriptions[0]?.created_date ?? new Date()
//     )
//   );

//   // get end by finding latest of all presciption's last_administered_on
//   const end = new Date(
//     prescriptions
//       .filter((prescription) => prescription.last_administered_on)
//       .reduce(
//         (latest, curr) =>
//           curr.last_administered_on && curr.last_administered_on > latest
//             ? curr.last_administered_on
//             : latest,
//         prescriptions[0]?.created_date ?? new Date()
//       )
//   );

//   // floor start to 00:00 of the day
//   start.setHours(0, 0, 0, 0);

//   // ceil end to 00:00 of the next day
//   end.setHours(0, 0, 0, 0);
//   end.setDate(end.getDate() + 1);

//   return { start, end };
// }
