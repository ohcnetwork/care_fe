import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { patchConsultation, updateConsultation } from "../../../Redux/actions";
import { medicines, PrescriptionType, routes, units } from "./PrescriptionBuilder";
import { PrescriptionDropdown } from "./PrescriptionDropdown";

export type PRNPrescriptionType = {
    id? : number,
    medicine?: string; 
    route?: string; 
    dosage?: string;
    indicator?: string;
    max_dosage?: string; 
    min_time?: number;
}

export const PRNEmptyValues = {
    medicine: "",
    route: "",
    dosage: "0 mg",
    max_dosage: "0 mg",
    indicator: "",
    min_time: 0
}

const DOSAGE_HRS = [1,2,3,6,12,24];

export interface PrescriptionBuilderProps<T> {
    prescriptions :T[], 
    setPrescriptions : React.Dispatch<React.SetStateAction<T[]>>,
    consultationID : number
};

/*
    PRO TIP :
    If you are making an array of objects in a JSON field, ALWAYS have a unique id element in each object.
    I was not so wise, and now I am writing the following code.
*/

export const patchedPrescriptions = (prescriptions : any[]) => {

    const newID : (i : number) => number = (i : number) => {
        const check = prescriptions.find(p=>p.id === i);
        if(check){
            return newID(i+1);
        }else{
            return i;
        }
    }

    return prescriptions.map((p, i)=>{
        if(p.id){
            return p;
        }else{
            return {
                ...p,
                id : newID(i+1)
            }
        }
    })
}

export const patchIDs = async (prescriptions : any[], dispatch : any, setState : any, consultationID : number, key : string) => {

    const patched = patchedPrescriptions(prescriptions);

    if(prescriptions.filter(p => !p.id).length > 0){

        console.log("Patched", patched, "original", prescriptions)
        try {
            const res = await dispatch(patchConsultation(consultationID, {[key] : patched}));
        } catch(error) {
            console.log(error);
        }
    }

    setState(patched);
}

export default function PRNPrescriptionBuilder(props : PrescriptionBuilderProps<PRNPrescriptionType>){

    const {prescriptions, setPrescriptions, consultationID} = props;
    const dispatchAction : any = useDispatch();

    const setItem = (object : PRNPrescriptionType, i : number) => {
        setPrescriptions(prescriptions.map((prescription, index)=>
            index === i ? object : prescription
        ))
    }

    useEffect(()=>{
        patchIDs(prescriptions, dispatchAction, setPrescriptions, consultationID, "prn_prescription");
    }, [])
    
    return (
        <div className="mt-2">
            {
                prescriptions.map((prescription, i)=>{

                    const setMedicine = (medicine : string) => {
                        setItem({
                            ...prescription,
                            medicine
                        },i)
                    }

                    const setRoute = (route : string) => {
                        setItem({
                            ...prescription,
                            route
                        },i)
                    }

                    const setDosageUnit = (unit : string) => {
                        setItem({
                            ...prescription,
                            dosage : prescription.dosage ? prescription.dosage.split(" ")[0] + " " + unit : "0 mg"
                        },i)
                    }

                    const setMaxDosageUnit = (unit : string) => {
                        setItem({
                            ...prescription,
                            max_dosage : prescription.max_dosage ? prescription.max_dosage.split(" ")[0] + " " + unit : "0 mg"
                        },i)
                    }

                    const setMinTime = (min_time : number) => {
                        setItem({
                            ...prescription,
                            min_time
                        },i)
                    }

                    return (
                        <div key={i} className="border-b border-b-gray-500 border-dashed py-2 text-xs text-gray-600">
                            <div className="flex gap-2 flex-col md:flex-row">
                                <div
                                    className="w-full"    
                                >
                                    Medicine
                                    <PrescriptionDropdown
                                        placeholder="Medicine"
                                        options={medicines}
                                        value={prescription.medicine || ""}
                                        setValue={setMedicine}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-[100px]">
                                        Route
                                        <PrescriptionDropdown
                                            placeholder="Route"
                                            options={routes}
                                            value={prescription.route || ""}
                                            setValue={setRoute}
                                        />
                                    </div>
                                    <div>
                                        <div className="w-full md:w-[160px] flex gap-2 shrink-0">
                                            <div>
                                                Dosage
                                                <div className="flex gap-1">
                                                    <input 
                                                        type="number"
                                                        className="w-full focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
                                                        value={prescription.dosage?.split(" ")[0]}
                                                        placeholder="Dosage"
                                                        min={0}
                                                        onChange={(e)=>{
                                                            let value = parseFloat(e.target.value);
                                                            if(value < 0){
                                                                value = 0;
                                                            }
                                                            setItem({
                                                                ...prescription,
                                                                dosage : value + " " + (prescription.dosage?.split(" ")[1] || "mg")
                                                            },i)
                                                        }}
                                                        required
                                                    />
                                                    <div
                                                        className="w-[70px] shrink-0"    
                                                    >
                                                        <PrescriptionDropdown
                                                            placeholder="Unit"
                                                            options={units}
                                                            value={prescription.dosage?.split(" ")[1] || "mg"}
                                                            setValue={setDosageUnit}
                                                        />
                                                    </div>
                                                </div>    
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-2 flex-col md:flex-row">
                                <div className="w-full">
                                    Indicator
                                    <input 
                                        type="text"
                                        className="border w-full focus:ring-primary-500 focus:border-primary-500 block border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
                                        value={prescription.indicator}
                                        placeholder="Indicator"
                                        onChange={(e)=>{
                                            setItem({
                                                ...prescription,
                                                indicator : e.target.value
                                            },i)
                                        }}
                                    />
                                </div>
                                <div className="w-full md:w-[160px] flex gap-2 shrink-0">
                                    <div>
                                        Max Dosage in 24 hrs.
                                        <div className="flex gap-1">
                                            <input 
                                                type="number"
                                                className="w-full focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
                                                value={prescription.max_dosage?.split(" ")[0]}
                                                placeholder="Dosage"
                                                min={0}
                                                onChange={(e)=>{
                                                    let value = parseFloat(e.target.value);
                                                    if(value < 0){
                                                        value = 0;
                                                    }
                                                    setItem({
                                                        ...prescription,
                                                        max_dosage : value + " " + (prescription.max_dosage?.split(" ")[1] || "mg")
                                                    },i)
                                                }}
                                                required
                                            />
                                            <div
                                                className="w-[70px] shrink-0"    
                                            >
                                                <PrescriptionDropdown
                                                    placeholder="Unit"
                                                    options={units}
                                                    value={prescription.max_dosage?.split(" ")[1] || "mg"}
                                                    setValue={setMaxDosageUnit}
                                                />
                                            </div>
                                        </div>    
                                    </div>
                                </div>
                                <div className="w-[130px] shrink-0">
                                    Min. time btwn. 2 doses
                                    <div className="flex items-center">
                                        <PrescriptionDropdown
                                            type="number"
                                            placeholder="hours"
                                            options={DOSAGE_HRS}
                                            value={prescription.min_time || 0}
                                            setValue={setMinTime}
                                            min={0}
                                        />
                                        <div className="ml-2">
                                            Hrs.
                                        </div>
                                    </div>
                                </div>
                                
                                <button
                                    type="button"
                                    className="text-gray-400 text-base transition hover:text-red-500"
                                    onClick={()=>{
                                        setPrescriptions(prescriptions.filter((prescription, index)=>i!=index))
                                    }}
                                >
                                    <i className="fas fa-trash" />
                                </button>
                            </div>
                        </div>
                    )
                })
            }
            <button
                type="button"
                onClick={()=>{
                    setPrescriptions([
                        ...prescriptions,
                        {...PRNEmptyValues, id : Date.now() }
                    ])
                }}
                className="shadow-sm mt-4 bg-gray-200 w-full font-bold block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:bg-gray-300 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900"
            >
                + Add Prescription
            </button>
        </div>
    )
}