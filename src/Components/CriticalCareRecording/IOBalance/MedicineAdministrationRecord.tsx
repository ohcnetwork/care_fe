import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { PrescriptionType } from "../../Medicine/PrescriptionBuilder";
import { UserModel } from "../../Users/models";
import { statusType } from "../../../Common/utils";
import { getPrescriptions } from "../../../Redux/actions";
import ButtonV2 from "../../Common/components/ButtonV2";
import CareIcon from "../../../CAREUI/icons/CareIcon";

type MedicineAdministrationRecord = {
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

  const fetchPrescriptions = useCallback(
    async (_: statusType) => {
      const res = await dispatchAction(getPrescriptions(id));
      if (res.data.results) {
        setPrescriptions(res.data.results);
      }
    },
    [dispatchAction, id]
  );

  useEffect(() => {
    fetchPrescriptions({});
  }, [id]);

  const normalPrescriptions = prescriptions?.filter(
    (prescription) => !prescription.is_prn && !prescription.discontinued
  );
  const prnPrescriptions = prescriptions?.filter(
    (prescription) => prescription.is_prn && !prescription.discontinued
  );
  //const discontinuedPrescriptions = prescriptions?.filter((prescription) => prescription.discontinued);

  const sections = [
    {
      name: "Prescriptions",
      prescriptions: normalPrescriptions,
    },
    {
      name: "PRN Prescriptions",
      prescriptions: prnPrescriptions,
    },
  ];

  return (
    <div className="flex gap-8 flex-col">
      {sections.map((section) => (
        <div>
          <h4>{section.name}</h4>
          <div className="mt-4">
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
                    <span className="font-bold">{prescription.medicine}</span>
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
                    : [prescription.frequency, prescription.days]),
                  <></>,
                  <div>
                    <ButtonV2>
                      <CareIcon className="care-l-plus" />
                      Administer
                    </ButtonV2>
                    &nbsp;
                    <ButtonV2 variant="danger" ghost>
                      <CareIcon className="care-l-times" />
                    </ButtonV2>
                  </div>,
                ]) || []
              }
            />
          </div>
        </div>
      ))}
    </div>
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
