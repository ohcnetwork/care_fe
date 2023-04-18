import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  PRESCRIPTION_FREQUENCY,
  PrescriptionForm,
  PrescriptionType,
  emptyPrescriptionValues,
} from "../../Medicine/PrescriptionBuilder";
import { UserModel } from "../../Users/models";
import { statusType } from "../../../Common/utils";
import { deleteAdministration, getPrescriptions } from "../../../Redux/actions";
import ButtonV2, { Cancel, Submit } from "../../Common/components/ButtonV2";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import DialogModal from "../../Common/Dialog";
import TextAreaFormField from "../../Form/FormFields/TextAreaFormField";
import { administerPrescription } from "../../../Redux/actions";
import moment from "moment";

export type MedicineAdministrationRecord = {
  external_id: string;
  prescription: PrescriptionType;
  notes: string;
  administered_by: UserModel;
  administered_date: string;
  created_date: string;
  modified_date: string;
};

export default function MedicineAdministrationRecord(props: {
  consultationId: string;
}) {
  const { consultationId: id } = props;
  const dispatchAction: any = useDispatch();
  const [prescriptions, setPrescriptions] = useState<PrescriptionType[] | null>(
    null
  );
  const [showAdministerModal, setShowAdministerModal] =
    useState<PrescriptionType | null>(null);
  const [showPrescriptionEditModal, setShowPrescriptionEditModal] =
    useState<PrescriptionType | null>(null);
  const [showAdminHistory, setShowAdminHistory] =
    useState<PrescriptionType | null>(null);
  const [administration, setAdministration] = useState<
    Partial<MedicineAdministrationRecord>
  >({
    administered_date: moment().format("YYYY-MM-DDTHH:mm"),
    notes: "",
  });

  const fetchPrescriptions = useCallback(
    async (_: statusType) => {
      const res = await dispatchAction(getPrescriptions(id));
      if (res.data.results) {
        setPrescriptions(res.data.results);
      }
    },
    [dispatchAction, id]
  );

  const handleAdminister = async (prescription: PrescriptionType) => {
    const res = await dispatchAction(
      administerPrescription(id, prescription.external_id, administration)
    );
    if (res.data) {
      setShowAdministerModal(null);
    }
    fetchPrescriptions({});
    setAdministration({
      administered_date: moment().format("YYYY-MM-DDTHH:mm"),
      notes: "",
    });
  };

  const handleDeleteAdministration = async (
    prescription: PrescriptionType,
    administration: MedicineAdministrationRecord
  ) => {
    const res = await dispatchAction(
      deleteAdministration(
        id,
        prescription.external_id,
        administration.external_id
      )
    );
    if (res.data) {
      setShowAdminHistory(null);
    }
    fetchPrescriptions({});
  };

  useEffect(() => {
    fetchPrescriptions({});
  }, [id]);

  const normalPrescriptions = prescriptions?.filter(
    (prescription) => !prescription.is_prn && !prescription.discontinued
  );
  const prnPrescriptions = prescriptions?.filter(
    (prescription) => prescription.is_prn && !prescription.discontinued
  );
  const discontinuedPrescriptions = prescriptions?.filter(
    (prescription) => prescription.discontinued
  );

  const sections = [
    {
      name: "Prescriptions",
      prescriptions: normalPrescriptions,
    },
    {
      name: "PRN Prescriptions",
      prescriptions: prnPrescriptions,
    },
    {
      name: "Discontinued Prescriptions",
      prescriptions: discontinuedPrescriptions,
    },
  ];

  return (
    <>
      <DialogModal
        title={
          <div>
            <p>Administer Medicine</p>
          </div>
        }
        show={showAdministerModal !== null}
        onClose={() => {
          setShowAdministerModal(null);
          setAdministration({
            administered_date: moment().format("YYYY-MM-DDTHH:mm"),
            notes: "",
          });
        }}
        className="md:max-w-3xl"
      >
        <div className="mt-3 flex flex-col">
          Administration Time
          <br />
          <input
            type="datetime-local"
            className="focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
            value={administration.administered_date}
            onChange={(e) => {
              setAdministration({
                ...administration,
                administered_date: e.target.value,
              });
              console.log(e.target.value);
            }}
          />
          <br />
          <TextAreaFormField
            label="Notes"
            name="notes"
            value={administration.notes}
            onChange={(e) => {
              setAdministration({ ...administration, notes: e.value });
            }}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-2 pt-4 md:justify-end">
          <Cancel
            onClick={() => {
              setShowAdministerModal(null);
              setAdministration({
                administered_date: moment().format("YYYY-MM-DDTHH:mm"),
                notes: "",
              });
            }}
          />
          <Submit
            onClick={() => handleAdminister(showAdministerModal!)}
            label="Administer"
            autoFocus
          />
        </div>
      </DialogModal>
      <DialogModal
        title={
          <div>
            {showPrescriptionEditModal?.external_id ? (
              <p>Update Prescription</p>
            ) : (
              <p>
                Add {showPrescriptionEditModal?.is_prn ? "PRN " : ""}
                Prescription
              </p>
            )}
          </div>
        }
        show={showPrescriptionEditModal !== null}
        onClose={() => {
          setShowPrescriptionEditModal(null);
        }}
        className="md:max-w-3xl"
      >
        <div className="mt-3 flex flex-col">
          {showPrescriptionEditModal && (
            <PrescriptionForm
              prescription={showPrescriptionEditModal}
              consultation={id}
              refreshPrescriptions={fetchPrescriptions}
              onAction={() => setShowPrescriptionEditModal(null)}
            />
          )}
        </div>
      </DialogModal>
      <DialogModal
        title="Administration History"
        show={showAdminHistory !== null}
        onClose={() => setShowAdminHistory(null)}
        className="md:max-w-3xl"
      >
        <div className="mt-3 flex flex-col">
          {showAdminHistory && (
            <Table
              headings={[
                "Date and Time",
                "Notes",
                "Administered By",
                "Actions",
              ]}
              data={showAdminHistory.administrations.map((history) => [
                moment(history.administered_date).format("DD-MM-YYYY, hh:mm A"),
                history.notes,
                history.administered_by.username,
                <div className="flex gap-2">
                  <ButtonV2
                    onClick={() => {
                      handleDeleteAdministration(showAdminHistory, history);
                      setShowAdminHistory(null);
                    }}
                    size="small"
                    variant="danger"
                  >
                    Delete
                  </ButtonV2>
                </div>,
              ])}
            />
          )}
        </div>
      </DialogModal>
      <div className="flex gap-8 flex-col">
        {sections.map((section) => (
          <div>
            <h4>{section.name}</h4>
            <div className="mt-4">
              {section.name === "Discontinued Prescriptions" ? (
                <Table
                  headings={[
                    "Medicine",
                    "Discontinued On",
                    "Discontinued Reason",
                    "Actions",
                  ]}
                  data={
                    section.prescriptions?.map((prescription) => [
                      <>
                        <span className="font-bold">
                          {prescription.medicine}
                        </span>
                        <p>{prescription.notes}</p>
                        {prescription.is_prn && (
                          <p className="text-primary-500">
                            INDICATOR : {prescription.indicator}
                          </p>
                        )}
                        <p>Type : {prescription.is_prn ? "PRN" : "Regular"}</p>
                      </>,
                      moment(prescription.discontinued_date).format(
                        "DD-MM-YYYY hh:mm A"
                      ),
                      prescription.discontinued_reason,
                      <ButtonV2
                        border
                        ghost
                        onClick={() => {
                          setShowPrescriptionEditModal(prescription);
                        }}
                      >
                        <CareIcon className="care-l-pen" />
                      </ButtonV2>,
                    ]) || []
                  }
                />
              ) : (
                <Table
                  headings={[
                    "Medicine",
                    "Dose",
                    "Route",
                    ...(section.prescriptions?.[0]?.is_prn
                      ? ["Max Dosage in 24 hrs", "Min time between doses"]
                      : ["Frequency", "Days"]),
                    "Administration",
                    "",
                  ]}
                  data={
                    section.prescriptions?.map((prescription) => [
                      <>
                        <span className="font-bold">
                          {prescription.medicine}
                        </span>
                        <p>{prescription.notes}</p>
                        {prescription.is_prn && (
                          <p className="text-primary-500">
                            INDICATOR : {prescription.indicator}
                          </p>
                        )}
                      </>,
                      prescription.dosage,
                      prescription.route,
                      ...(prescription.is_prn
                        ? [
                            prescription.max_dosage,
                            prescription.min_hours_between_doses + " hrs",
                          ]
                        : [
                            <>
                              {prescription.frequency}
                              <div className="text-xs text-gray-800">
                                {
                                  PRESCRIPTION_FREQUENCY.find(
                                    (f) => f.value === prescription.frequency
                                  )?.name
                                }
                              </div>
                            </>,
                            prescription.days,
                          ]),
                      <AdministrationVisualizer
                        prescription={prescription}
                        showHistory={setShowAdminHistory}
                      />,
                      <div className="flex">
                        <ButtonV2
                          border
                          onClick={() => {
                            setShowAdministerModal(prescription);
                          }}
                        >
                          <CareIcon className="care-l-plus" />
                          Administer
                        </ButtonV2>
                        &nbsp;
                        <ButtonV2
                          border
                          ghost
                          onClick={() => {
                            setShowPrescriptionEditModal(prescription);
                          }}
                        >
                          <CareIcon className="care-l-pen" />
                        </ButtonV2>
                      </div>,
                    ]) || []
                  }
                />
              )}
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <ButtonV2
            className="flex-1"
            border
            ghost
            onClick={() => {
              setShowPrescriptionEditModal(
                emptyPrescriptionValues(false) as PrescriptionType
              );
            }}
          >
            <CareIcon className="care-l-plus" />
            Add Prescription
          </ButtonV2>
          <ButtonV2
            border
            ghost
            onClick={() => {
              setShowPrescriptionEditModal(
                emptyPrescriptionValues(true) as PrescriptionType
              );
            }}
            className="flex-1"
          >
            <CareIcon className="care-l-plus" />
            Add PRN Prescription
          </ButtonV2>
        </div>
      </div>
    </>
  );
}

function Table(props: { data: React.ReactNode[][]; headings: string[] }) {
  return (
    <table className="w-full border border-gray-200 rounded-xl overflow-hidden">
      <thead>
        <tr className="text-left text-sm">
          {props.headings.map((heading) => (
            <th className="p-3 bg-gray-300">{heading}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.data.map((row, i) => (
          <tr
            className={`${i % 2 === 0 ? "bg-gray-100" : "bg-gray-200"} text-sm`}
            key={i}
          >
            {row.map((item, j) => (
              <td className="p-3" key={j}>
                {item}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AdministrationVisualizer(props: {
  prescription: PrescriptionType;
  showHistory: (prescription: PrescriptionType) => void;
}) {
  const { prescription, showHistory } = props;

  const administrations = prescription.administrations?.sort(
    (a, b) =>
      new Date(b.administered_date).getTime() -
      new Date(a.administered_date).getTime()
  );

  if (administrations.length === 0) {
    return (
      <div>
        <p className="text-gray-500">No administrations</p>
      </div>
    );
  }

  if (prescription.is_prn) {
    // get hours between last administration and now
    const lastAdministration = administrations[0];
    const hoursBetween = moment().diff(
      moment(lastAdministration.administered_date),
      "hours"
    );
    const hoursLeft = prescription.min_hours_between_doses - hoursBetween;
    return (
      <div>
        {administrations?.[0] && (
          <div className="text-xs text-gray-800">
            Last at:{" "}
            {moment(administrations[0].administered_date).format(
              "DD/MM/YY hh:mm A"
            )}
          </div>
        )}
        {hoursLeft > 0 && (
          <div className="text-xs text-red-500 mt-2">
            {hoursLeft} hours left before next dose
          </div>
        )}
        <button
          onClick={() => showHistory(prescription)}
          className="text-xs text-primary-500 mt-2"
        >
          <CareIcon className="care-l-history" /> View all
        </button>
      </div>
    );
  }

  const frequency = PRESCRIPTION_FREQUENCY.find(
    (f) => f.value === prescription.frequency
  );
  const completedAdministrations = frequency?.completed(administrations);

  return (
    <div>
      <div className="flex items-center justify-around">
        {Array(frequency?.slots)
          .fill(0)
          .map((_, i) => (
            <div
              className={`w-4 h-4 rounded-full ${
                completedAdministrations?.[i] ? "bg-primary-500" : "bg-gray-400"
              } text-white text-xs flex items-center justify-center`}
            >
              {completedAdministrations?.[i] && (
                <CareIcon className="care-l-check" />
              )}
            </div>
          ))}
      </div>
      {administrations?.[0] && (
        <div className="text-xs text-gray-800 mt-4">
          Last at:{" "}
          {moment(administrations[0].administered_date).format(
            "DD/MM/YY hh:mm A"
          )}
        </div>
      )}
      <button
        onClick={() => showHistory(prescription)}
        className="text-xs text-primary-500 mt-2"
      >
        <CareIcon className="care-l-history" /> View all
      </button>
    </div>
  );
}
