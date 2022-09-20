import React, { Children, useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { getConsultation, patchConsultation } from "../../../Redux/actions"
import { PrescriptionType } from "../../Common/prescription-builder/PrescriptionBuilder"
import { patchedPrescriptions, patchIDs, PRNPrescriptionType } from "../../Common/prescription-builder/PRNPrescriptionBuilder"
import { PrescriptionAdministrationTable, PRNPrescriptionAdministrationTable } from "./AdministrationTable"
import PrescriptionModal from "./PrescriptionModal"

/* 
    HEADS UP!
    Understanding and editing the following piece of code will cost a piece of your soul
    Proceed with caution and caffeine.

    ~ Shivank on his last 3 braincells
*/

interface MedAdminRecordType {
    prescriptions? : MAPrescriptionType<AdministrationType[]>[],
    PRNprescriptions? : MAPrescriptionType<PRNAdministrationType[]>[]
}

type MAPrescriptionType<T> = {
    prescriptionID : number,
    administration : T
    discontinued : boolean
}

type AdministrationType = {
    time : string,
}

type PRNAdministrationType = {
    time : string,
}

type AdministrationRecordProps = {
    items : MedAdminRecordType
    setItems : ({...props} : any) => any
    consultationID : string
}

const frequencies = {
    od : "once daily",
    hs : "at bed time",
    bd : "twice a day",
    tid : "thrice a day",
    qid : "four times a day",
    q4h : "every 4 hours",
    qod : "every other day",
    qwk : "every week"
}

type DisplayType = {
    label: string,
    value: string,
    colspan? : number
}

export default function AdministrationRecord(props: AdministrationRecordProps) {

    const { items, setItems, consultationID } = props
    const dispatchAction: any = useDispatch();

    const [prescriptions, setPrescriptions] = useState<PrescriptionType[] | null>(null);
    const [PRNprescriptions, setPRNprescriptions] = useState<PRNPrescriptionType[] | null>(null);
    const [modal, setModal] = useState(false);

    useEffect(()=>{
        getConsultationDetails(consultationID);
    }, []);

    const getConsultationDetails = async (consultationID: string) => {
        const res = await dispatchAction(getConsultation(consultationID as any));
        const pres = res && res.data && res.data.discharge_advice;
        const PRNpres = !Array.isArray(res.data.prn_prescription) ? [] : res.data.prn_prescription;
        patchIDs(pres, dispatchAction, setPrescriptions, consultationID as any, "discharge_advice"); 
        patchIDs(PRNpres, dispatchAction, setPRNprescriptions, consultationID as any, "prn_prescription");
    }

    return (
        <div>
            {prescriptions && PRNprescriptions && (
                <PrescriptionModal
                    prescriptions={prescriptions}
                    setPrescriptions={setPrescriptions}
                    PRNprescriptions={PRNprescriptions}
                    setPRNprescriptions = {setPRNprescriptions}
                    consultationID={consultationID as any}
                    modal={modal}
                    setModal={setModal}
                />
            )}
            
            <h2 className="py-6">
                Medicine Administration Record
            </h2>
            <h3>
                Prescriptions
            </h3>
            <ul className="list-decimal ml-4">
                {prescriptions ? prescriptions.map((prescription, index) => {
                    return (
                        <li key={index} className="bg-gray-50 rounded-lg p-3 mt-2">
                            <div className="flex">
                                <Display
                                    display={[
                                        {
                                            label: "Medicine",
                                            value: prescription.medicine || "--",
                                            colspan: 3
                                        },
                                        {
                                            label: "Dosage",
                                            value: prescription.dosage_new || "--"
                                        },
                                        {
                                            label: "Frequency",
                                            value: `${prescription.dosage} - ${frequencies[prescription.dosage as keyof typeof frequencies]}`
                                        },
                                        {
                                            label: "Route",
                                            value: prescription.route || "--"
                                        },
                                        {
                                            label: "Notes",
                                            value: prescription.notes || "--",
                                            colspan : 2
                                        }
                                    ]}
                                    discontinued={items.prescriptions?.find(p=>p.prescriptionID === prescription.id)?.discontinued || false}
                                >
                                    <>
                                        <button className="text-red-600 hover:text-red-500">
                                            <i className="fas fa-times" /> Discontinue
                                        </button>
                                    </>
                                </Display>
                                <PrescriptionAdministrationTable
                                    prescription={prescription}
                                    record={items.prescriptions?.find(p => p.prescriptionID === prescription.id) || []}
                                    setRecord={setItems}
                                />
                            </div>
                        </li>
                    )
                }) : (
                    <div>
                        Loading...
                    </div>
                )}
            </ul>
            <h3 className="mt-8">
                PRN Prescriptions
            </h3>
            <ul className="list-decimal ml-4">
                {PRNprescriptions ? PRNprescriptions.map((prescription, index) => {

                    const discontinued = items.PRNprescriptions?.find(p=>p.prescriptionID === prescription.id)?.discontinued || true;

                    return (
                        <li key={index} className={`bg-gray-50 rounded-lg p-3 mt-2`}>
                            <div className="flex">
                                <Display
                                    display={[
                                        {
                                            label: "Medicine",
                                            value: prescription.medicine || "--",
                                            colspan: 3
                                        },
                                        {
                                            label: "Dosage",
                                            value: prescription.dosage || "--"
                                        },
                                        {
                                            label: "Indicator",
                                            value: prescription.indicator || "--"
                                        },
                                        {
                                            label: "Route",
                                            value: prescription.route || "--"
                                        },
                                        {
                                            label: "Max Dosage in 24 hours",
                                            value: prescription.max_dosage || "--",
                                        },
                                        {
                                            label : "Min time between 2 doses",
                                            value : prescription.min_time + " hours",
                                        },
                                    ]}
                                    discontinued={discontinued}
                                >
                                    <>
                                        {discontinued ? (
                                            <button className="text-primary-600 hover:text-primary-500">
                                                <i className="fas fa-rotate" /> Restart Medication
                                            </button> ) : (
                                            <button className="text-red-600 hover:text-red-500">
                                                <i className="fas fa-times" /> Discontinue
                                            </button>
                                        )}
                                    </>
                                </Display>
                                <PRNPrescriptionAdministrationTable 
                                    prescription={prescription}
                                    PRNrecord={items.PRNprescriptions?.find(p=>p.prescriptionID === prescription.id) || []}
                                    setPRNrecord={setItems}
                                    discontinued={discontinued}
                                />
                            </div>
                        </li>
                    )
                }) : (
                    <div>
                        Loading...
                    </div>
                )}
            </ul>
            <button 
                className="bg-gray-300 w-full p-2 rounded-lg mt-4"
                onClick={() => setModal(true)}
            >
                <i className="fas fa-pen mr-2" /> Edit Prescriptions
            </button>
        </div>
    )
}

function Display(props : {display : DisplayType[], children? : React.ReactNode, discontinued? : boolean}) {

    const {display, children, discontinued} = props;

    return (
        <div className={`${discontinued ? "opacity-70" : ""} grid grid-cols-3 gap-2 w-full lg:w-[400px] shrink-0`}>
            {display.map((item, i) => {
                return (
                    <div key={i} className={`${item.colspan ? (item.colspan === 3 ? "col-span-3" : "col-span-2") : ""}`}>
                        <span className="text-gray-700 text-xs uppercase">
                            {item.label}
                        </span>
                        <br />
                        <span className="font-semibold">
                            {item.value}
                        </span>
                    </div>
                )
            })}
            <div>
                <span className="text-gray-700 text-xs uppercase">
                    Actions
                </span>
                <br />
                <span className="">
                    {children}
                </span>
            </div>
        </div>
    )
}