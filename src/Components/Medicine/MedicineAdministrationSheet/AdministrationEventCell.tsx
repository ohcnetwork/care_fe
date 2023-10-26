import dayjs from "../../../Utils/dayjs";
import { MedicineAdministrationRecord, Prescription } from "../models";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { classNames, formatDateTime, formatTime } from "../../../Utils/utils";
import DialogModal from "../../Common/Dialog";
import PrescrpitionActivityTimeline from "../PrescrpitionTimeline";
import { useState } from "react";
import PrescriptionDetailCard from "../PrescriptionDetailCard";

interface Props {
  administrations: MedicineAdministrationRecord[];
  interval: { start: Date; end: Date };
  prescription: Prescription;
}

export default function AdministrationEventCell({
  administrations,
  interval: { start, end },
  prescription,
}: Props) {
  const [showTimeline, setShowTimeline] = useState(false);
  // Check if cell belongs to an administered prescription
  const administered = administrations
    .filter((administration) =>
      dayjs(administration.administered_date).isBetween(start, end)
    )
    .sort(
      (a, b) =>
        new Date(a.administered_date!).getTime() -
        new Date(b.administered_date!).getTime()
    );

  const hasComment = administered.some((obj) => !!obj.notes);

  if (administered.length) {
    return (
      <>
        <DialogModal
          onClose={() => setShowTimeline(false)}
          title={
            <PrescriptionDetailCard prescription={prescription} readonly />
          }
          className="w-full md:max-w-2xl"
          show={showTimeline}
        >
          <div className="mt-6 text-sm font-medium text-gray-700">
            Administrations between{" "}
            <span className="text-black">{formatTime(start, "HH:mm")}</span> and{" "}
            <span className="text-black">{formatTime(end, "HH:mm")}</span> on{" "}
            <span className="text-black">
              {formatDateTime(start, "DD/MM/YYYY")}
            </span>
          </div>
          <PrescrpitionActivityTimeline
            interval={{ start, end }}
            prescription={prescription}
            showPrescriptionDetails
          />
        </DialogModal>
        <button
          className="tooltip scale-100 transition-transform duration-200 ease-in-out hover:scale-110"
          onClick={() => setShowTimeline(true)}
        >
          <div className="relative mx-auto max-w-min">
            <CareIcon
              icon="l-check-circle"
              className="text-xl text-primary-500"
            />
            {administered.length > 1 && (
              <span className="absolute -bottom-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-white">
                {administered.length}
              </span>
            )}
          </div>
          {hasComment && (
            <CareIcon icon="l-notes" className="text-xl text-primary-500" />
          )}
          {!showTimeline && (
            <span className="tooltip-text tooltip-bottom -translate-x-1/2 text-xs">
              {administered.length === 1 ? (
                <p>
                  Administered on{" "}
                  <strong>
                    {formatTime(administered[0].administered_date)}
                  </strong>
                </p>
              ) : (
                <p>
                  Click to see <strong>{administered.length}</strong>{" "}
                  administrations
                </p>
              )}
            </span>
          )}
        </button>
      </>
    );
    //// TODO: use the below inline timeline popover when inline popover overflow clipping issue is solved when.
    // return (
    //   <Popover className="relative">
    //     <Popover.Button className="scale-100 transition-transform duration-200 ease-in-out hover:scale-110">
    //       {({ open }) => (
    //         <div className="tooltip">
    //           <div className="relative mx-auto max-w-min">
    //             <CareIcon
    //               icon="l-check-circle"
    //               className="text-xl text-primary-500"
    //             />
    //             {administered.length > 1 && (
    //               <span className="absolute -bottom-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-white">
    //                 {administered.length}
    //               </span>
    //             )}
    //           </div>
    //           {hasComment && (
    //             <CareIcon icon="l-notes" className="text-xl text-primary-500" />
    //           )}
    //           {!open && (
    //             <span className="tooltip-text tooltip-bottom -translate-x-1/2 text-xs">
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
    //           )}
    //         </div>
    //       )}
    //     </Popover.Button>
    //     <Transition
    //       as={Fragment}
    //       enter="transition ease-out duration-200"
    //       enterFrom="opacity-0 translate-y-1"
    //       enterTo="opacity-100 translate-y-0"
    //       leave="transition ease-in duration-150"
    //       leaveFrom="opacity-100 translate-y-0"
    //       leaveTo="opacity-0 translate-y-1"
    //     >
    //       <Popover.Panel className="absolute left-1/2 z-30 mt-3 -translate-x-1/2 px-4 sm:px-0">
    //         <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5">
    //           <div className="relative flex flex-col gap-2 bg-white p-4">
    //             {administered.map((administration) => (
    //               <div key={administration.id}>
    //                 <Disclosure defaultOpen={administered.length === 1}>
    //                   {({ open }) => (
    //                     <>
    //                       <Disclosure.Button
    //                         className={classNames(
    //                           "flex w-full justify-between border-gray-400 px-4 py-2 text-left text-sm focus:outline-none focus-visible:ring focus-visible:ring-primary-500/75",
    //                           open
    //                             ? "rounded-t-lg border-l border-r border-t bg-gray-200"
    //                             : "rounded-lg border hover:bg-gray-200"
    //                         )}
    //                       >
    //                         <span className="text-gray-700">
    //                           Administered on{" "}
    //                           <strong className="font-semibold text-gray-900">
    //                             {formatTime(administration.administered_date)}
    //                           </strong>
    //                         </span>
    //                         {administration.notes && (
    //                           <CareIcon
    //                             icon="l-notes"
    //                             className="ml-2 text-lg"
    //                           />
    //                         )}
    //                         <CareIcon
    //                           icon="l-angle-down"
    //                           className={classNames(
    //                             "ml-8 text-base",
    //                             open ? "rotate-180" : "rotate-0"
    //                           )}
    //                         />
    //                       </Disclosure.Button>
    //                       <Disclosure.Panel className="flex flex-col items-start rounded-b-lg border border-gray-400 bg-gray-200 p-2 px-4 text-sm text-gray-700 shadow">
    //                         <div>
    //                           Administered by:{" "}
    //                           <span className="font-medium text-gray-900">
    //                             {administration.administered_by?.first_name}{" "}
    //                             {administration.administered_by?.last_name}
    //                           </span>
    //                         </div>
    //                         <div>
    //                           Notes:{" "}
    //                           <span className="font-medium text-gray-800">
    //                             {administration.notes || (
    //                               <span className="italic text-gray-700">
    //                                 No notes
    //                               </span>
    //                             )}
    //                           </span>
    //                         </div>
    //                       </Disclosure.Panel>
    //                     </>
    //                   )}
    //                 </Disclosure>
    //               </div>
    //             ))}
    //           </div>
    //         </div>
    //       </Popover.Panel>
    //     </Transition>
    //   </Popover>
    // );
  }

  // Check if cell belongs to after prescription.created_date
  if (dayjs(start).isAfter(prescription.created_date)) {
    return <CareIcon icon="l-minus-circle" className="text-xl text-gray-400" />;
  }

  // Check if cell belongs to a discontinued prescription
  if (
    prescription.discontinued &&
    dayjs(end).isAfter(prescription.discontinued_date)
  ) {
    if (!dayjs(prescription.discontinued_date).isBetween(start, end)) return;

    return (
      <div className="tooltip">
        <CareIcon
          icon="l-ban"
          className={classNames(
            "text-xl",
            dayjs(prescription.discontinued_date).isBetween(start, end)
              ? "text-danger-700"
              : "text-gray-400"
          )}
        />
        <span className="tooltip-text tooltip-top -translate-x-1/2 text-xs">
          <p>
            Discontinued on{" "}
            <strong>{formatDateTime(prescription.discontinued_date)}</strong>
          </p>
          <p>
            Reason:{" "}
            {prescription.discontinued_reason ? (
              <strong>{prescription.discontinued_reason}</strong>
            ) : (
              <span className="italic">Not specified</span>
            )}
          </p>
        </span>
      </div>
    );
  }
}
