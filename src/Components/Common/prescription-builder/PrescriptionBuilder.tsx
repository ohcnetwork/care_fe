import { PrescriptionDropdown } from "./PrescriptionDropdown";

const medicines = require("./assets/medicines");
const frequency = ["od", "hs", "bd", "tid", "qid", "q4h", "qod", "qwk"]
const routes = ["Oral", "IV", "IM", "S/C"]
const units = ["mg", "ml", "drops"]

export type PrescriptionType = {
    medicine?: string; 
    route?: string; 
    dosage?: string; // is now frequency
    dosage_new?: string;
    days?: number; 
    notes?: string;
}

export const emptyValues = {
    medicine: "",
    route: "",
    dosage: "",
    dosage_new: "0 mg",
    days: 0,
    notes: ""
}

export default function PrescriptionBuilder(props : {prescriptions : PrescriptionType[], setPrescriptions : React.Dispatch<React.SetStateAction<PrescriptionType[]>>}){

    const {prescriptions, setPrescriptions} = props;

    const setItem = (object : PrescriptionType, i : number) => {
        setPrescriptions(prescriptions.map((prescription, index)=>
            index === i ? object : prescription
        ))
    }

    return (
        <div className="">
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

                    const setFrequency = (frequency : string) => {
                        setItem({
                            ...prescription,
                            dosage : frequency
                        },i)
                    }

                    const setDosageUnit = (unit : string) => {
                        setItem({
                            ...prescription,
                            dosage_new : prescription.dosage_new ? prescription.dosage_new.split(" ")[0] + " " + unit : "0 mg"
                        },i)
                    }

                    return (
                        <div key={i} className="mt-4 text-xs text-gray-600">
                            <div className="flex gap-2">
                                <div
                                    className="w-full"    
                                >
                                    Medicine :
                                    <PrescriptionDropdown
                                        placeholder="Medicine"
                                        options={medicines}
                                        value={prescription.medicine || ""}
                                        setValue={setMedicine}
                                    />
                                </div>
                                <div>
                                    Route :
                                    <PrescriptionDropdown
                                        placeholder="Route"
                                        options={routes}
                                        value={prescription.route || ""}
                                        setValue={setRoute}
                                    />
                                </div>
                                <div>
                                    Frequency :
                                    <PrescriptionDropdown
                                        placeholder="Frequency"
                                        options={frequency}
                                        value={prescription.dosage || ""}
                                        setValue={setFrequency}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <div>
                                    Dosage :
                                    <div className="flex gap-1">
                                        <input 
                                            type="number"
                                            className="w-[110px] block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white focus:border-gray-600"
                                            value={prescription.dosage_new?.split(" ")[0]}
                                            placeholder="Dosage"
                                            onChange={(e)=>{
                                                setItem({
                                                    ...prescription,
                                                    dosage_new : e.target.value + " " + (prescription.dosage_new ? prescription.dosage_new.split(" ")[1] : "mg")
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
                                                value={prescription.dosage_new?.split(" ")[1] || "mg"}
                                                setValue={setDosageUnit}
                                            />
                                        </div>
                                    </div>
                                    
                                </div>
                                
                                <div className="w-[80px]">
                                    Days
                                    <input 
                                        type="number"
                                        className="border w-[80px] block border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white focus:border-gray-600"
                                        value={prescription.days}
                                        placeholder="Days"
                                        onChange={(e)=>{
                                            setItem({
                                                ...prescription,
                                                days : parseInt(e.target.value)
                                            },i)
                                        }}
                                        required
                                    />
                                </div>
                                
                                <div className="w-full">
                                    Notes : 
                                    <input 
                                        type="text"
                                        className="border w-full block border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white focus:border-gray-600"
                                        value={prescription.notes}
                                        placeholder="Notes"
                                        onChange={(e)=>{
                                            setItem({
                                                ...prescription,
                                                notes : e.target.value
                                            },i)
                                        }}
                                    />
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
                        emptyValues
                    ])
                }}
                className="shadow-sm mt-4 bg-gray-200 w-full font-bold block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:bg-gray-300 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900"
            >
                + Add Medicine
            </button>
        </div>
    )
}