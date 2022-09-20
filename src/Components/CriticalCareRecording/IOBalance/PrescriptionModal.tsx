import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { patchConsultation } from "../../../Redux/actions"
import PrescriptionBuilder, { PrescriptionType } from "../../Common/prescription-builder/PrescriptionBuilder"
import PRNPrescriptionBuilder, { PRNPrescriptionType } from "../../Common/prescription-builder/PRNPrescriptionBuilder"
import * as Notification from "../../../Utils/Notifications.js";

export default function PrescriptionModal(props : {
    prescriptions : PrescriptionType[]
    setPrescriptions : (prescriptions : PrescriptionType[]) => void
    PRNprescriptions : PRNPrescriptionType[]
    setPRNprescriptions : (PRNprescriptions : PRNPrescriptionType[]) => void,
    consultationID : number
    modal : boolean,
    setModal : (modal : boolean) => void
}){

    const { prescriptions, setPrescriptions, PRNprescriptions, setPRNprescriptions, consultationID, modal, setModal } = props;
    const dispatchAction: any = useDispatch();
    const [errors, setErrors] = useState<{pres? : string, prn?: string}>({});
    const [prescriptionLocal, setPrescriptionLocal] = useState<PrescriptionType[] | null>(null);
    const [PRNprescriptionLocal, setPRNprescriptionLocal] = useState<PRNPrescriptionType[] | null>(null);

    useEffect(()=>{
        setPrescriptionLocal(prescriptions);
        setPRNprescriptionLocal(PRNprescriptions);

        return ()=>{
            setPrescriptionLocal(null);
            setPRNprescriptionLocal(null);
        }
    }, [])

    const save = async () => {

        let invalid = false;
        setErrors({});
        
        for (const f of prescriptionLocal!) {
            if (
                !f.dosage?.replace(/\s/g, "").length ||
                !f.medicine?.replace(/\s/g, "").length
            ) {
                setErrors({ pres: "Please fill in all fields" });
                invalid = true;
            }
        }

        for (const f of PRNprescriptionLocal!) {
            if (
                !f.dosage?.replace(/\s/g, "").length ||
                !f.medicine?.replace(/\s/g, "").length ||
                f.indicator === "" ||
                f.indicator === " "
            ) {
                setErrors({ prn: "Please fill in all fields" });
                invalid = true;
            }
        }

        if(!invalid){
            const res = await dispatchAction(patchConsultation(consultationID, {"discharge_summary" : prescriptionLocal, "prn_prescription" : PRNprescriptionLocal}));
            if (res && res.data && res.status !== 400) {
                Notification.Success({
                  msg: "Consultation updated successfully",
                });
                setPrescriptions(prescriptionLocal!);
                setPRNprescriptions(PRNprescriptionLocal!);
                
            }else{
                Notification.Error({
                    msg: "Error updating consultation",
                });
            }
        }
    }

    return (
        <div className={`fixed inset-0 flex items-center justify-center z-[2000] transition-all ${modal ? "visible opacity-100" : "invisible opacity-0"} md:p-20`}>
            <div className="bg-black/70 absolute -z-10 inset-0" onClick={()=>setModal(false)} />
            <div className="w-full bg-white md:rounded-xl p-10 h-full md:h-auto md:max-h-full overflow-auto relative">
                <button
                     onClick={()=>setModal(false)}
                     className="absolute top-0 right-0 p-5 text-2xl"
                >
                    <i className="fas fa-times" />
                </button>
                <h3>
                    Prescription Editor
                </h3>
                <h4 className="mt-4">
                    Prescriptions
                </h4>
                {prescriptionLocal && 
                    <PrescriptionBuilder
                        prescriptions={prescriptionLocal}
                        setPrescriptions={setPrescriptionLocal as any}
                        consultationID={consultationID}
                    />
                }
                
                {errors.pres && <div className="text-red-500">{errors.pres}</div>}
                <h4 className="mt-4">
                    PRN Prescriptions
                </h4>
                {PRNprescriptionLocal &&
                    <PRNPrescriptionBuilder
                        prescriptions={PRNprescriptionLocal}
                        setPrescriptions={setPRNprescriptionLocal as any}
                        consultationID={consultationID}
                    />
                }
                
                {errors.prn && <div className="text-red-500">{errors.prn}</div>}
                <button 
                    className="text-white font-semibold bg-primary-500 rounded-lg py-2 px-4 w-full mt-4 hover:bg-primary-600"
                    onClick={save}
                >
                    Save
                </button>
            </div>
        </div>
    )
}